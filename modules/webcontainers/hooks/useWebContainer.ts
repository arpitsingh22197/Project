"use client";

import { useState, useEffect, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";
import { TemplateFolder } from "@/modules/playground/lib/path-to-json";

interface UseWebContainerProps {
  templateData: TemplateFolder;
}

interface UseWebContaierReturn {
  serverUrl: string | null;
  isLoading: boolean;
  error: string | null;
  instance: WebContainer | null;
  writeFileSync: (path: string, content: string) => Promise<void>;
  destory: () => void;
}

/*
  WebContainer allows only ONE booted instance per browser tab.

  Using globalThis makes this survive React Strict Mode and
  Next.js Fast Refresh without calling WebContainer.boot() again.
*/
declare global {
  // eslint-disable-next-line no-var
  var __webContainerInstance: WebContainer | null | undefined;

  // eslint-disable-next-line no-var
  var __webContainerBootPromise: Promise<WebContainer> | null | undefined;
}

if (globalThis.__webContainerInstance === undefined) {
  globalThis.__webContainerInstance = null;
}

if (globalThis.__webContainerBootPromise === undefined) {
  globalThis.__webContainerBootPromise = null;
}

export const useWebContainer = ({
  templateData,
}: UseWebContainerProps): UseWebContaierReturn => {
  const [serverUrl, setServerUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(
    !globalThis.__webContainerInstance
  );

  const [error, setError] = useState<string | null>(null);

  const [instance, setInstance] = useState<WebContainer | null>(
    globalThis.__webContainerInstance ?? null
  );

  useEffect(() => {
    let mounted = true;

    async function initializeWebContainer() {
      try {
        setError(null);

        // Reuse the already booted WebContainer.
        if (globalThis.__webContainerInstance) {
          if (mounted) {
            setInstance(globalThis.__webContainerInstance);
            setIsLoading(false);
          }

          return;
        }

        setIsLoading(true);

        // Create only one boot promise.
        if (!globalThis.__webContainerBootPromise) {
          globalThis.__webContainerBootPromise = WebContainer.boot();
        }

        const webcontainerInstance =
          await globalThis.__webContainerBootPromise;

        globalThis.__webContainerInstance = webcontainerInstance;

        if (!mounted) return;

        setInstance(webcontainerInstance);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to initialize WebContainer:", err);

        // Clear failed promise so future attempts can retry.
        globalThis.__webContainerBootPromise = null;

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to initialize WebContainer"
          );

          setIsLoading(false);
        }
      }
    }

    initializeWebContainer();

    return () => {
      mounted = false;

      /*
        Do NOT call instance.teardown() here.

        Next.js React Strict Mode unmounts and mounts components again
        during development. teardown() would destroy the running container,
        then WebContainer.boot() would throw:
        "Only a single WebContainer instance can be booted"
      */
    };
  }, []);

  const writeFileSync = useCallback(
    async (path: string, content: string): Promise<void> => {
      const activeInstance =
        instance || globalThis.__webContainerInstance;

      if (!activeInstance) {
        throw new Error("WebContainer instance is not available");
      }

      try {
        const pathParts = path.split("/");
        const folderPath = pathParts.slice(0, -1).join("/");

        if (folderPath) {
          await activeInstance.fs.mkdir(folderPath, {
            recursive: true,
          });
        }

        await activeInstance.fs.writeFile(path, content);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to write file";

        console.error(`Failed to write file at ${path}:`, err);

        throw new Error(
          `Failed to write file at ${path}: ${errorMessage}`
        );
      }
    },
    [instance]
  );

  const destory = useCallback(() => {
    /*
      Do NOT call teardown() here either.

      Keep the global instance alive because WebContainer can only
      be booted once in the current browser tab.
    */
    setInstance(null);
    setServerUrl(null);
  }, []);

  return {
    serverUrl,
    isLoading,
    error,
    instance,
    writeFileSync,
    destory,
  };
};

export default useWebContainer;