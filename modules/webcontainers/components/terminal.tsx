"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
//@ts-ignorets-ignore
import "@xterm/xterm/css/xterm.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Copy, Trash2, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface TerminalProps {
  webcontainerUrl?: string;
  className?: string;
  theme?: "dark" | "light";
  webContainerInstance?: any;
}

export interface TerminalRef {
  writeToTerminal: (data: string) => void;
  clearTerminal: () => void;
  focusTerminal: () => void;
}

const terminalThemes = {
  dark: {
    background: "#09090B",
    foreground: "#FAFAFA",
    cursor: "#FAFAFA",
    cursorAccent: "#09090B",
    selection: "#27272A",
    black: "#18181B",
    red: "#EF4444",
    green: "#22C55E",
    yellow: "#EAB308",
    blue: "#3B82F6",
    magenta: "#A855F7",
    cyan: "#06B6D4",
    white: "#F4F4F5",
    brightBlack: "#3F3F46",
    brightRed: "#F87171",
    brightGreen: "#4ADE80",
    brightYellow: "#FDE047",
    brightBlue: "#60A5FA",
    brightMagenta: "#C084FC",
    brightCyan: "#22D3EE",
    brightWhite: "#FFFFFF",
  },
  light: {
    background: "#FFFFFF",
    foreground: "#18181B",
    cursor: "#18181B",
    cursorAccent: "#FFFFFF",
    selection: "#E4E4E7",
    black: "#18181B",
    red: "#DC2626",
    green: "#16A34A",
    yellow: "#CA8A04",
    blue: "#2563EB",
    magenta: "#9333EA",
    cyan: "#0891B2",
    white: "#F4F4F5",
    brightBlack: "#71717A",
    brightRed: "#EF4444",
    brightGreen: "#22C55E",
    brightYellow: "#FDE047",
    brightBlue: "#60A5FA",
    brightMagenta: "#C084FC",
    brightCyan: "#22D3EE",
    brightWhite: "#FAFAFA",
  },
};

const TerminalComponent = forwardRef<TerminalRef, TerminalProps>(
  ({ className, theme = "dark", webContainerInstance }, ref) => {
    const terminalRef = useRef<HTMLDivElement>(null);

    const termRef = useRef<any>(null);
    const fitAddonRef = useRef<any>(null);
    const searchAddonRef = useRef<any>(null);
    const currentProcessRef = useRef<any>(null);

    const currentLineRef = useRef("");
    const commandHistoryRef = useRef<string[]>([]);
    const historyIndexRef = useRef(-1);

    const mountedRef = useRef(false);
    const readyRef = useRef(false);
    const animationFrameRef = useRef<number | null>(null);

    const [isConnected, setIsConnected] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showSearch, setShowSearch] = useState(false);

    const safeFit = useCallback(() => {
      const terminal = termRef.current;
      const fitAddon = fitAddonRef.current;
      const container = terminalRef.current;

      if (
        !mountedRef.current ||
        !readyRef.current ||
        !terminal ||
        !fitAddon ||
        !container ||
        !terminal.element
      ) {
        return;
      }

      const rect = container.getBoundingClientRect();

      if (rect.width < 10 || rect.height < 10) {
        return;
      }

      try {
        fitAddon.fit();
      } catch {
        // Ignore resize events that happen while terminal is being destroyed.
      }
    }, []);

    const writePrompt = useCallback(() => {
      const terminal = termRef.current;

      if (!terminal || !readyRef.current) return;

      terminal.write("\r\n$ ");
      currentLineRef.current = "";
    }, []);

    const clearTerminal = useCallback(() => {
      const terminal = termRef.current;

      if (!terminal || !readyRef.current) return;

      terminal.clear();
      terminal.writeln("🚀 WebContainer Terminal");
      terminal.write("\r\n$ ");
      currentLineRef.current = "";
    }, []);

    const executeCommand = useCallback(
      async (command: string) => {
        const terminal = termRef.current;

        if (!terminal || !readyRef.current) return;

        const cleanCommand = command.trim();

        if (!cleanCommand) {
          writePrompt();
          return;
        }

        if (cleanCommand === "clear") {
          clearTerminal();
          return;
        }

        if (cleanCommand === "history") {
          commandHistoryRef.current.forEach((item, index) => {
            terminal.writeln(`  ${index + 1}  ${item}`);
          });

          writePrompt();
          return;
        }

        if (
          commandHistoryRef.current[
            commandHistoryRef.current.length - 1
          ] !== cleanCommand
        ) {
          commandHistoryRef.current.push(cleanCommand);
        }

        historyIndexRef.current = -1;

        if (!webContainerInstance) {
          terminal.writeln("\r\nWebContainer is not ready yet.");
          writePrompt();
          return;
        }

        try {
          const [cmd, ...args] = cleanCommand.split(/\s+/);

          const process = await webContainerInstance.spawn(cmd, args, {
            terminal: {
              cols: terminal.cols,
              rows: terminal.rows,
            },
          });

          currentProcessRef.current = process;

          process.output.pipeTo(
            new WritableStream({
              write(data) {
                if (mountedRef.current && termRef.current) {
                  termRef.current.write(data);
                }
              },
            })
          );

          await process.exit;

          currentProcessRef.current = null;

          if (mountedRef.current) {
            writePrompt();
          }
        } catch {
          if (mountedRef.current && termRef.current) {
            termRef.current.writeln(
              `\r\nCommand not found: ${cleanCommand}`
            );
            writePrompt();
          }
        }
      },
      [webContainerInstance, clearTerminal, writePrompt]
    );

    const handleTerminalInput = useCallback(
      (data: string) => {
        const terminal = termRef.current;

        if (!terminal || !readyRef.current) return;

        if (data === "\r") {
          executeCommand(currentLineRef.current);
          return;
        }

        if (data === "\u007F") {
          if (currentLineRef.current.length > 0) {
            currentLineRef.current = currentLineRef.current.slice(0, -1);
            terminal.write("\b \b");
          }
          return;
        }

        if (data === "\u0003") {
          currentProcessRef.current?.kill();
          currentProcessRef.current = null;
          terminal.writeln("^C");
          writePrompt();
          return;
        }

        if (data === "\u001b[A") {
          if (commandHistoryRef.current.length === 0) return;

          if (historyIndexRef.current === -1) {
            historyIndexRef.current = commandHistoryRef.current.length - 1;
          } else if (historyIndexRef.current > 0) {
            historyIndexRef.current--;
          }

          const previousCommand =
            commandHistoryRef.current[historyIndexRef.current];

          terminal.write(
            "\r$ " +
              " ".repeat(currentLineRef.current.length) +
              "\r$ " +
              previousCommand
          );

          currentLineRef.current = previousCommand;
          return;
        }

        if (data === "\u001b[B") {
          if (historyIndexRef.current === -1) return;

          if (
            historyIndexRef.current <
            commandHistoryRef.current.length - 1
          ) {
            historyIndexRef.current++;

            const nextCommand =
              commandHistoryRef.current[historyIndexRef.current];

            terminal.write(
              "\r$ " +
                " ".repeat(currentLineRef.current.length) +
                "\r$ " +
                nextCommand
            );

            currentLineRef.current = nextCommand;
          } else {
            historyIndexRef.current = -1;

            terminal.write(
              "\r$ " +
                " ".repeat(currentLineRef.current.length) +
                "\r$ "
            );

            currentLineRef.current = "";
          }

          return;
        }

        if (data >= " " || data === "\t") {
          currentLineRef.current += data;
          terminal.write(data);
        }
      },
      [executeCommand, writePrompt]
    );

    useImperativeHandle(
      ref,
      () => ({
        writeToTerminal: (data: string) => {
          termRef.current?.write(data);
        },
        clearTerminal,
        focusTerminal: () => {
          termRef.current?.focus();
        },
      }),
      [clearTerminal]
    );

    useEffect(() => {
      let terminal: any = null;
      let resizeObserver: ResizeObserver | null = null;
      let cancelled = false;

      mountedRef.current = true;
      readyRef.current = false;

      const setupTerminal = async () => {
        if (!terminalRef.current || cancelled) return;

        const { Terminal } = await import("@xterm/xterm");
        const { FitAddon } = await import("@xterm/addon-fit");
        const { WebLinksAddon } = await import("@xterm/addon-web-links");
        const { SearchAddon } = await import("@xterm/addon-search");

        if (!terminalRef.current || cancelled) return;

        terminal = new Terminal({
          cursorBlink: true,
          fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
          fontSize: 14,
          lineHeight: 1.2,
          theme: terminalThemes[theme],
          convertEol: true,
          scrollback: 1000,
          tabStopWidth: 4,
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();
        const searchAddon = new SearchAddon();

        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);
        terminal.loadAddon(searchAddon);

        terminal.open(terminalRef.current);

        termRef.current = terminal;
        fitAddonRef.current = fitAddon;
        searchAddonRef.current = searchAddon;

        terminal.onData(handleTerminalInput);

        readyRef.current = true;

        terminal.writeln("🚀 WebContainer Terminal");
        terminal.writeln("Type commands like: npm run dev");
        terminal.write("\r\n$ ");

        animationFrameRef.current = requestAnimationFrame(() => {
          safeFit();
        });

        resizeObserver = new ResizeObserver(() => {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }

          animationFrameRef.current = requestAnimationFrame(() => {
            safeFit();
          });
        });

        resizeObserver.observe(terminalRef.current);
      };

      setupTerminal();

      return () => {
        cancelled = true;
        mountedRef.current = false;
        readyRef.current = false;

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        resizeObserver?.disconnect();

        currentProcessRef.current?.kill();
        currentProcessRef.current = null;

        terminal?.dispose();

        termRef.current = null;
        fitAddonRef.current = null;
        searchAddonRef.current = null;
      };
    }, [theme, handleTerminalInput, safeFit]);

    useEffect(() => {
      if (webContainerInstance && termRef.current && !isConnected) {
        setIsConnected(true);
        termRef.current.writeln("\r\n✅ Connected to WebContainer");
      }
    }, [webContainerInstance, isConnected]);

    const copyTerminalContent = async () => {
      const selectedText = termRef.current?.getSelection();

      if (selectedText) {
        await navigator.clipboard.writeText(selectedText);
      }
    };

    const downloadTerminalLog = () => {
      const terminal = termRef.current;

      if (!terminal) return;

      const buffer = terminal.buffer.active;
      let content = "";

      for (let index = 0; index < buffer.length; index++) {
        const line = buffer.getLine(index);

        if (line) {
          content += line.translateToString(true) + "\n";
        }
      }

      const blob = new Blob([content], {
        type: "text/plain",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "terminal-log.txt";
      link.click();

      URL.revokeObjectURL(url);
    };

    return (
      <div
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-lg border bg-background",
          className
        )}
      >
        <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>

            <span className="text-sm font-medium">WebContainer Terminal</span>

            {isConnected && (
              <span className="text-xs text-green-500">Connected</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {showSearch && (
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(event) => {
                  const value = event.target.value;

                  setSearchTerm(value);

                  if (value) {
                    searchAddonRef.current?.findNext(value);
                  }
                }}
                className="h-6 w-32 text-xs"
              />
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch((value) => !value)}
              className="h-6 w-6 p-0"
            >
              <Search className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={copyTerminalContent}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={downloadTerminalLog}
              className="h-6 w-6 p-0"
            >
              <Download className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={clearTerminal}
              className="h-6 w-6 p-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="relative flex-1">
          <div
            ref={terminalRef}
            className="absolute inset-0 p-2"
            style={{
              background: terminalThemes[theme].background,
            }}
          />
        </div>
      </div>
    );
  }
);

TerminalComponent.displayName = "TerminalComponent";

export default TerminalComponent;