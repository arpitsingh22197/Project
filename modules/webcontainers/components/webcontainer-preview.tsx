"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";

import { transformToWebContainerFormat } from "../hooks/transformer";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

import { WebContainer } from "@webcontainer/api";
import { TemplateFolder } from "@/modules/playground/lib/path-to-json";
import TerminalComponent from "./terminal";

interface WebContainerPreviewProps {
  templateData: TemplateFolder;
  serverUrl: string;
  isLoading: boolean;
  error: string | null;
  instance: WebContainer | null;
  writeFileSync: (path: string, content: string) => Promise<void>;
  forceResetup?: boolean;
}

const WebContainerPreview = ({
  templateData,
  error,
  instance,
  isLoading,
  serverUrl,
  writeFileSync,
  forceResetup = false,
}: WebContainerPreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loadingState, setLoadingState] = useState({
    transforming: false,
    mounting: false,
    installing: false,
    starting: false,
    ready: false,
  });
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 4;
  const [setupError, setSetupError] = useState<string | null>(null);

  const terminalRef = useRef<any>(null);
  const prevTemplateRef = useRef<TemplateFolder | null>(null);

  // Refs survive remounts — guards must NOT be state
  const isSetupCompleteRef = useRef(false);
  const isSetupInProgressRef = useRef(false);
  const serverReadyListenerRef = useRef<((port: number, url: string) => void) | null>(null);

  // ─── writeToTerminal shorthand ────────────────────────────────────────────────
  const writeln = useCallback((msg: string) => {
    terminalRef.current?.writeToTerminal(msg);
  }, []);

  // ─── Recursive file differ ────────────────────────────────────────────────────
  const writeChangedFiles = useCallback(
    async (
      newFiles: Record<string, any>,
      oldFiles: Record<string, any>,
      basePath: string
    ): Promise<void> => {
      for (const [name, newEntry] of Object.entries(newFiles)) {
        const fullPath = basePath ? `${basePath}/${name}` : name;
        const oldEntry = oldFiles?.[name];

        if (newEntry?.file) {
          const newContent = newEntry.file.contents;
          const oldContent = oldEntry?.file?.contents;
          if (newContent !== oldContent) {
            await writeFileSync(fullPath, newContent);
            writeln(`📝 Updated: ${fullPath}\r\n`);
          }
        } else if (newEntry?.directory) {
          await writeChangedFiles(
            newEntry.directory,
            oldEntry?.directory ?? {},
            fullPath
          );
        }
      }
    },
    [writeFileSync, writeln]
  );

  // ─── Register server-ready exactly once, replacing any previous listener ──────
  const registerServerReady = useCallback(
    (inst: WebContainer) => {
      // Just overwrite the ref — the unmounted flag prevents stale handlers from firing
      const handler = (_port: number, url: string) => {
        if (isSetupCompleteRef.current) return; // already set up, ignore duplicate events
        writeln(`🌐 Server ready at ${url}\r\n`);
        setPreviewUrl(url);
        setLoadingState((prev) => ({ ...prev, starting: false, ready: true }));
        isSetupCompleteRef.current = true;
        isSetupInProgressRef.current = false;
      };
      serverReadyListenerRef.current = handler;
      inst.on("server-ready", handler);
    },
    [writeln]
  );

  // ─── Reset when forceResetup changes ─────────────────────────────────────────
  useEffect(() => {
    if (!forceResetup) return;
    isSetupCompleteRef.current = false;
    isSetupInProgressRef.current = false;
    prevTemplateRef.current = null;
    setPreviewUrl("");
    setCurrentStep(0);
    setLoadingState({
      transforming: false,
      mounting: false,
      installing: false,
      starting: false,
      ready: false,
    });
  }, [forceResetup]);

  // ─── Initial container setup ──────────────────────────────────────────────────
  useEffect(() => {
    if (!instance) return;
    const inst = instance;
    let unmounted = false; // guard against stale async callbacks after unmount

    async function setupContainer() {
      if (isSetupCompleteRef.current || isSetupInProgressRef.current) return;

      try {
        isSetupInProgressRef.current = true;
        setSetupError(null);

        // Check if files are already mounted (component remounted mid-session)
        try {
          const packageJsonExists = await inst.fs.readFile("package.json", "utf8");

          if (packageJsonExists) {
            writeln("🔄 Reconnecting to existing WebContainer session...\r\n");

            if (serverUrl) {
              // Server already running — use URL directly, no listener needed
              setPreviewUrl(serverUrl);
              setCurrentStep(4);
              setLoadingState({
                transforming: false,
                mounting: false,
                installing: false,
                starting: false,
                ready: true,
              });
              isSetupCompleteRef.current = true;
            } else {
              setCurrentStep(4);
              setLoadingState((prev) => ({ ...prev, starting: true }));
              registerServerReady(inst);
            }

            prevTemplateRef.current = JSON.parse(JSON.stringify(templateData));
            isSetupInProgressRef.current = false;
            return;
          }
        } catch {
          // package.json not found — first-time setup, continue below
        }

        // ── Step 1: Transform ──────────────────────────────────────────────────
        setLoadingState((prev) => ({ ...prev, transforming: true }));
        setCurrentStep(1);
        writeln("🔄 Transforming template data...\r\n");

        // @ts-ignore
        const files = transformToWebContainerFormat(templateData);

        setLoadingState((prev) => ({ ...prev, transforming: false, mounting: true }));
        setCurrentStep(2);

        // ── Step 2: Mount ──────────────────────────────────────────────────────
        writeln("📁 Mounting files to WebContainer...\r\n");
        await inst.mount(files);
        writeln("✅ Files mounted successfully\r\n");

        setLoadingState((prev) => ({ ...prev, mounting: false, installing: true }));
        setCurrentStep(3);

        // ── Step 3: Install ────────────────────────────────────────────────────
        writeln("📦 Installing dependencies...\r\n");

        const installProcess = await inst.spawn("npm", ["install"]);
        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              writeln(data);
            },
          })
        );

        const installExitCode = await installProcess.exit;
        if (installExitCode !== 0) {
          throw new Error(`Failed to install dependencies. Exit code: ${installExitCode}`);
        }

        writeln("✅ Dependencies installed successfully\r\n");
        setLoadingState((prev) => ({ ...prev, installing: false, starting: true }));
        setCurrentStep(4);

        // ── Step 4: Start dev server ───────────────────────────────────────────
        writeln("🚀 Starting development server...\r\n");

        // Register BEFORE spawning so we never miss a fast boot
        registerServerReady(inst);

        const startProcess = await inst.spawn("npm", ["run", "dev"]);
        startProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              writeln(data);
            },
          })
        );

        prevTemplateRef.current = JSON.parse(JSON.stringify(templateData));
      } catch (err) {
        console.error("Error setting up container:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        writeln(`❌ Error: ${errorMessage}\r\n`);
        setSetupError(errorMessage);
        isSetupInProgressRef.current = false;
        setLoadingState({
          transforming: false,
          mounting: false,
          installing: false,
          starting: false,
          ready: false,
        });
      }
    }

    setupContainer();

    return () => {
      unmounted = true;
      serverReadyListenerRef.current = null;
    };
  }, [instance, serverUrl, templateData, registerServerReady, writeln]);

  // ─── Real-time file sync ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!instance || !isSetupCompleteRef.current) return;

    if (!prevTemplateRef.current) {
      prevTemplateRef.current = JSON.parse(JSON.stringify(templateData));
      return;
    }

    async function syncChangedFiles() {
      try {
        // @ts-ignore
        const newFiles = transformToWebContainerFormat(templateData);
        // @ts-ignore
        const oldFiles = transformToWebContainerFormat(prevTemplateRef.current!);

        await writeChangedFiles(newFiles, oldFiles, "");

        prevTemplateRef.current = JSON.parse(JSON.stringify(templateData));
      } catch (err) {
        console.error("File sync error:", err);
        const msg = err instanceof Error ? err.message : String(err);
        writeln(`❌ Sync error: ${msg}\r\n`);
      }
    }

    syncChangedFiles();
  }, [templateData, instance, writeChangedFiles, writeln]);

  // ─── Render helpers ───────────────────────────────────────────────────────────
  const getStepIcon = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (stepIndex === currentStep) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
    return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
  };

  const getStepText = (stepIndex: number, label: string) => {
    const isActive = stepIndex === currentStep;
    const isComplete = stepIndex < currentStep;
    return (
      <span
        className={`text-sm font-medium ${
          isComplete ? "text-green-600" : isActive ? "text-blue-600" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    );
  };

  // ─── Early returns ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-6 rounded-lg bg-gray-50 dark:bg-gray-900">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <h3 className="text-lg font-medium">Initializing WebContainer</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Setting up the environment for your project...
          </p>
        </div>
      </div>
    );
  }

  if (error || setupError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg max-w-md">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="h-5 w-5" />
            <h3 className="font-semibold">Error</h3>
          </div>
          <p className="text-sm">{error || setupError}</p>
        </div>
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="h-full w-full flex flex-col">
      {!previewUrl ? (
        <div className="h-full flex flex-col">
          <div className="w-full max-w-md p-6 m-5 rounded-lg bg-white dark:bg-zinc-800 shadow-sm mx-auto">
            <Progress value={(currentStep / totalSteps) * 100} className="h-2 mb-6" />
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                {getStepIcon(1)}
                {getStepText(1, "Transforming template data")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(2)}
                {getStepText(2, "Mounting files")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(3)}
                {getStepText(3, "Installing dependencies")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(4)}
                {getStepText(4, "Starting development server")}
              </div>
            </div>
          </div>
          <div className="flex-1 p-4">
            <TerminalComponent
              ref={terminalRef}
              webContainerInstance={instance}
              theme="dark"
              className="h-full"
            />
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          <div className="flex-1">
            <iframe
              src={previewUrl}
              className="w-full h-full border-none"
              title="WebContainer Preview"
            />
          </div>
          <div className="h-64 border-t">
            <TerminalComponent
              ref={terminalRef}
              webContainerInstance={instance}
              theme="dark"
              className="h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WebContainerPreview;