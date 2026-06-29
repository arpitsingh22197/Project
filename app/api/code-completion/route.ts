import { type NextRequest, NextResponse } from "next/server";

// Force Node.js runtime — required so `fetch` can reach a local Ollama
// instance on localhost. (Edge runtime can't talk to localhost services.)
export const runtime = "nodejs";

// Make the Ollama endpoint configurable via env var, falling back to local default.
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5-coder:0.5b";

interface CodeSuggestionRequest {
  fileContent: string;
  cursorLine: number;
  cursorColumn: number;
  suggestionType: string;
  fileName?: string;
}

interface CodeContext {
  language: string;
  framework: string;
  beforeContext: string;
  currentLine: string;
  afterContext: string;
  cursorPosition: { line: number; column: number };
  isInFunction: boolean;
  isInClass: boolean;
  isAfterComment: boolean;
  incompletePatterns: string[];
}

export async function POST(request: NextRequest) {
  try {
    let body: CodeSuggestionRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 }
      );
    }

    const { fileContent, cursorLine, cursorColumn, suggestionType, fileName } = body;

    // Stricter validation — use typeof checks instead of falsy/`< 0` checks,
    // which previously let `undefined` slip through and produce NaN downstream.
    if (
      typeof fileContent !== "string" ||
      fileContent.length === 0 ||
      typeof cursorLine !== "number" ||
      !Number.isFinite(cursorLine) ||
      cursorLine < 0 ||
      typeof cursorColumn !== "number" ||
      !Number.isFinite(cursorColumn) ||
      cursorColumn < 0 ||
      typeof suggestionType !== "string" ||
      suggestionType.length === 0
    ) {
      return NextResponse.json(
        { error: "Invalid input parameters" },
        { status: 400 }
      );
    }

    const context = analyzeCodeContext(
      fileContent,
      cursorLine,
      cursorColumn,
      fileName
    );

    const prompt = buildPrompt(context, suggestionType);

    const { suggestion, warning } = await generateSuggestion(prompt);

    return NextResponse.json({
      suggestion,
      ...(warning ? { warning } : {}),
      context,
      metadata: {
        language: context.language,
        framework: context.framework,
        position: context.cursorPosition,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Context analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

function analyzeCodeContext(
  content: string,
  line: number,
  column: number,
  fileName?: string
): CodeContext {
  const lines = content.split("\n");

  // Clamp line/column so out-of-range cursor positions can't produce
  // NaN slices or undefined access.
  const safeLine = Math.min(Math.max(0, Math.floor(line)), Math.max(0, lines.length - 1));
  const currentLineRaw = lines[safeLine] ?? "";
  const safeColumn = Math.min(Math.max(0, Math.floor(column)), currentLineRaw.length);

  const contextRadius = 10;
  const startLine = Math.max(0, safeLine - contextRadius);
  const endLine = Math.min(lines.length, safeLine + contextRadius);

  const beforeContext = lines.slice(startLine, safeLine).join("\n");
  const afterContext = lines.slice(safeLine + 1, endLine).join("\n");

  const language = detectLanguage(content, fileName);
  const framework = detectFramework(content);

  const isInFunction = detectInFunction(lines, safeLine);
  const isInClass = detectInClass(lines, safeLine);
  const isAfterComment = detectAfterComment(currentLineRaw, safeColumn);
  const incompletePatterns = detectIncompletePatterns(currentLineRaw, safeColumn);

  return {
    language,
    framework,
    beforeContext,
    currentLine: currentLineRaw,
    afterContext,
    cursorPosition: { line: safeLine, column: safeColumn },
    isInFunction,
    isInClass,
    isAfterComment,
    incompletePatterns,
  };
}

function buildPrompt(context: CodeContext, suggestionType: string): string {
  return `You are an expert code completion assistant. Generate a ${suggestionType} suggestion.

Language: ${context.language}
Framework: ${context.framework}

Context:
${context.beforeContext}
${context.currentLine.substring(
  0,
  context.cursorPosition.column
)}|CURSOR|${context.currentLine.substring(context.cursorPosition.column)}
${context.afterContext}

Analysis:
- In Function: ${context.isInFunction}
- In Class: ${context.isInClass}
- After Comment: ${context.isAfterComment}
- Incomplete Patterns: ${context.incompletePatterns.join(", ") || "None"}

Instructions:
1. Provide only the code that should be inserted at the cursor
2. Maintain proper indentation and style
3. Follow ${context.language} best practices
4. Make the suggestion contextually appropriate

Generate suggestion:`;
}

async function generateSuggestion(
  prompt: string
): Promise<{ suggestion: string; warning?: string }> {
  const controller = new AbortController();
  // 30s is already generous for an inline completion — if Ollama can't
  // respond in that time, the UX of waiting 2 full minutes for ghost text
  // is worse than failing fast and letting the next keystroke retry.
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    console.log("Generating suggestion... prompt length:", prompt.length);

    let response: Response;
    try {
      response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
          options: {
            temperature: 0.2,
            top_p: 0.9,
            num_predict: 100,
          },
        }),
      });
    } catch (fetchErr: any) {
      // Distinguish "Ollama isn't reachable" from other failures so it's
      // obvious in logs/response what to fix.
      if (fetchErr.name === "AbortError") {
        return {
          suggestion: "// AI request timed out",
          warning: "Request to Ollama timed out after 120s",
        };
      }
      return {
        suggestion: "// AI suggestion unavailable",
        warning: `Could not reach Ollama at ${OLLAMA_URL}. Is "ollama serve" running and is the model pulled (ollama pull ${OLLAMA_MODEL})? (${fetchErr.message})`,
      };
    }

    if (!response.ok) {
      const errorText = await response.text();
      return {
        suggestion: "// AI suggestion unavailable",
        warning: `Ollama returned ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();

    if (typeof data.response !== "string" || data.response.length === 0) {
      return {
        suggestion: "// No suggestion generated",
        warning: "Ollama responded but returned no usable text",
      };
    }

    let suggestion: string = data.response;

    // Remove markdown code fences
    suggestion = suggestion
      .replace(/```[\w]*\n?/g, "")
      .replace(/```/g, "")
      .trim();

    return { suggestion: suggestion || "// No suggestion generated" };
  } finally {
    clearTimeout(timeout);
  }
}

// Helper functions for code analysis
function detectLanguage(content: string, fileName?: string): string {
  if (fileName) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const extMap: Record<string, string> = {
      ts: "TypeScript",
      tsx: "TypeScript",
      js: "JavaScript",
      jsx: "JavaScript",
      py: "Python",
      java: "Java",
      go: "Go",
      rs: "Rust",
      php: "PHP",
    };
    if (ext && extMap[ext]) return extMap[ext];
  }

  // Content-based detection
  if (content.includes("interface ") || content.includes(": string"))
    return "TypeScript";
  if (content.includes("def ") || content.includes("import ")) return "Python";
  if (content.includes("func ") || content.includes("package ")) return "Go";

  return "JavaScript";
}

function detectFramework(content: string): string {
  if (content.includes("import React") || content.includes("useState"))
    return "React";
  if (content.includes("import Vue") || content.includes("<template>"))
    return "Vue";
  if (content.includes("@angular/") || content.includes("@Component"))
    return "Angular";
  if (content.includes("next/") || content.includes("getServerSideProps"))
    return "Next.js";

  return "None";
}

function detectInFunction(lines: string[], currentLine: number): boolean {
  for (let i = currentLine - 1; i >= 0; i--) {
    const line = lines[i];
    if (line?.match(/^\s*(function|def|const\s+\w+\s*=|let\s+\w+\s*=)/))
      return true;
    if (line?.match(/^\s*}/)) break;
  }
  return false;
}

function detectInClass(lines: string[], currentLine: number): boolean {
  for (let i = currentLine - 1; i >= 0; i--) {
    const line = lines[i];
    if (line?.match(/^\s*(class|interface)\s+/)) return true;
  }
  return false;
}

function detectAfterComment(line: string, column: number): boolean {
  const beforeCursor = line.substring(0, column);
  return /\/\/.*$/.test(beforeCursor) || /#.*$/.test(beforeCursor);
}

function detectIncompletePatterns(line: string, column: number): string[] {
  const beforeCursor = line.substring(0, column);
  const patterns: string[] = [];

  if (/^\s*(if|while|for)\s*\($/.test(beforeCursor.trim()))
    patterns.push("conditional");
  if (/^\s*(function|def)\s*$/.test(beforeCursor.trim()))
    patterns.push("function");
  if (/\{\s*$/.test(beforeCursor)) patterns.push("object");
  if (/\[\s*$/.test(beforeCursor)) patterns.push("array");
  if (/=\s*$/.test(beforeCursor)) patterns.push("assignment");
  if (/\.\s*$/.test(beforeCursor)) patterns.push("method-call");

  return patterns;
}