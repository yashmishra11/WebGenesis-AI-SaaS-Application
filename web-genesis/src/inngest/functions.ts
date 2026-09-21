import { inngest } from "./client";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandBox } from "./utils";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "./prompt";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SANDBOX_TIMEOUT } from "./types";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { env } from "@/env";

interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

type ModelMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const DEFAULT_GROQ_MODELS = [
  "groq/compound",
  "groq/compound-mini",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
];
const GROQ_MODELS = env.GROQ_MODEL
  ? [
      env.GROQ_MODEL,
      ...DEFAULT_GROQ_MODELS.filter((model) => model !== env.GROQ_MODEL),
    ]
  : DEFAULT_GROQ_MODELS;
const DEFAULT_OPENROUTER_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "z-ai/glm-4.5-air:free",
  "openai/gpt-oss-20b:free",
];
const OPENROUTER_MODELS = env.OPENROUTER_MODEL
  ? [
      env.OPENROUTER_MODEL,
      ...DEFAULT_OPENROUTER_MODELS.filter(
        (model) => model !== env.OPENROUTER_MODEL,
      ),
    ]
  : DEFAULT_OPENROUTER_MODELS;
const GEMINI_MODEL = env.GEMINI_MODEL ?? "gemini-2.0-flash";
const OPENAI_MODEL = env.OPENAI_MODEL ?? "gpt-4o-mini";
const MAX_FILES_PER_WRITE = 25;
const MAX_FILE_SIZE = 250_000;
const MAX_TERMINAL_CMD_LENGTH = 160;
const MAX_RAW_LOG_LENGTH = 500;
const MAX_AGENT_STEPS = 6;
const MAX_CONTEXT_FILES = 8;
const MAX_CONTEXT_FILE_CHARS = 2_000;
const BLOCKED_SHELL_CHARS = /[|;&`$><]/;
const ALLOWED_TERMINAL_PREFIXES = ["npm install "];

const createOrUpdateFilesSchema = z.object({
  tool: z.literal("createOrUpdateFiles"),
  args: z.object({
    files: z
      .array(
        z.object({
          path: z.string().min(1),
          content: z.string().max(MAX_FILE_SIZE),
        }),
      )
      .min(1)
      .max(MAX_FILES_PER_WRITE),
  }),
});

const readFilesSchema = z.object({
  tool: z.literal("readFiles"),
  args: z.object({
    files: z.array(z.string().min(1)).min(1).max(MAX_FILES_PER_WRITE),
  }),
});

const terminalSchema = z.object({
  tool: z.literal("terminal"),
  args: z.object({
    command: z.string().min(1).max(MAX_TERMINAL_CMD_LENGTH),
  }),
});

const doneSchema = z.object({
  tool: z.literal("done"),
  args: z.object({
    summary: z.string().min(1).max(2000),
  }),
});

const toolCallSchema = z.union([
  createOrUpdateFilesSchema,
  readFilesSchema,
  terminalSchema,
  doneSchema,
]);

type ToolCall = z.infer<typeof toolCallSchema>;
type CreateOrUpdateFilesCall = z.infer<typeof createOrUpdateFilesSchema>;

const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});

const openrouter = env.OPENROUTER_API_KEY
  ? new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": env.NEXT_PUBLIC_APP_URL,
        "X-Title": "WebGenesis",
      },
    })
  : null;

const gemini = env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(env.GEMINI_API_KEY)
  : null;

const openai = env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    })
  : null;

interface PotentialApiError {
  status?: number;
  code?: string;
  message?: string;
  error?: {
    code?: string;
    message?: string;
  };
}

function isRateLimitError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const err = error as PotentialApiError;
  return (
    err.status === 429 ||
    err.code === "rate_limit_exceeded" ||
    err.error?.code === "rate_limit_exceeded"
  );
}

function getRateLimitMessage(error: unknown): string {
  if (typeof error !== "object" || error === null) {
    return "Rate limit reached. Please retry later.";
  }
  const err = error as PotentialApiError;
  return (
    err.error?.message ||
    err.message ||
    "Rate limit reached. Please retry later."
  );
}

function getSafeErrorMessage(error: unknown) {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown generation error";
  return raw.slice(0, 1500);
}

function getProviderErrorMessage(error: unknown) {
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? String((error as { status?: unknown }).status)
      : "";
  return [status, getSafeErrorMessage(error)].filter(Boolean).join(" ");
}

function toGeminiPrompt(messages: ModelMessage[]) {
  return messages
    .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
    .join("\n\n");
}

async function callLLMWithFallbacks(
  messages: ModelMessage[],
  options: { temperature?: number; max_tokens?: number } = {},
): Promise<string> {
  const { temperature = 0.7, max_tokens = 4000 } = options;
  const failures: string[] = [];

function parseGroqWaitMs(detail: string): number | null {
  const match = detail.match(/try again in ([0-9.]+)s/i);
  if (match?.[1]) {
    return Math.ceil(parseFloat(match[1]) * 1000) + 1000;
  }
  return null;
}

  for (const model of GROQ_MODELS) {
    try {
      const effectiveMaxTokens = model.includes("qwen")
        ? Math.min(max_tokens, 1000)
        : Math.min(max_tokens, 4096);

      const response = await groq.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: effectiveMaxTokens,
      });
      return response.choices[0].message.content || "";
    } catch (error) {
      const detail = getProviderErrorMessage(error);
      failures.push(`Groq (${model}): ${detail}`);
      console.warn(`[LLM] Groq (${model}) failed → ${detail}`);

      const waitMs = parseGroqWaitMs(detail);
      if (waitMs && waitMs <= 20000) {
        console.warn(
          `[LLM] Groq (${model}) rate limit cooldown: waiting ${waitMs}ms before retry...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        try {
          const retryResponse = await groq.chat.completions.create({
            model,
            messages,
            temperature,
            max_tokens: model.includes("qwen") ? Math.min(max_tokens, 1000) : Math.min(max_tokens, 4096),
          });
          return retryResponse.choices[0].message.content || "";
        } catch (retryErr) {
          const retryDetail = getProviderErrorMessage(retryErr);
          failures.push(`Groq (${model}) retry: ${retryDetail}`);
        }
      }
    }
  }

  if (openrouter) {
    for (const model of OPENROUTER_MODELS) {
      try {
        const response = await openrouter.chat.completions.create({
          model,
          messages,
          temperature,
          max_tokens,
        });
        return response.choices[0].message.content || "";
      } catch (error) {
        const detail = getProviderErrorMessage(error);
        failures.push(`OpenRouter (${model}): ${detail}`);
        console.warn(`[LLM] OpenRouter (${model}) failed → ${detail}`);
      }
    }
  }

  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: {
          temperature,
          maxOutputTokens: max_tokens,
        },
      });
      const response = await model.generateContent(toGeminiPrompt(messages));
      return response.response.text();
    } catch (error) {
      const detail = getProviderErrorMessage(error);
      failures.push(`Gemini (${GEMINI_MODEL}): ${detail}`);
      console.warn(`[LLM] Gemini (${GEMINI_MODEL}) failed → ${detail}`);
    }
  }

  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages,
        temperature,
        max_tokens,
      });
      return response.choices[0].message.content || "";
    } catch (error) {
      const detail = getProviderErrorMessage(error);
      failures.push(`OpenAI (${OPENAI_MODEL}): ${detail}`);
      console.warn(`[LLM] OpenAI (${OPENAI_MODEL}) failed → ${detail}`);
    }
  }

  const error = new Error(
    `All configured AI providers failed. ${failures.join(" | ")}`,
  );
  (error as { status?: number }).status = 429;
  throw error;
}

function extractFirstJSONObject(text: string): string | null {
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (start === -1) {
      if (ch === "{") {
        start = i;
        depth = 1;
      }
      continue;
    }

    if (escaping) {
      escaping = false;
      continue;
    }

    if (ch === "\\") {
      escaping = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (ch === "{") {
      depth++;
      continue;
    }

    if (ch === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

function getJSONCandidates(rawText: string) {
  const candidates: string[] = [];
  const trimmed = rawText.trim();

  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fencedMatch?.[1]) {
    candidates.push(fencedMatch[1].trim());
  }

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    candidates.push(trimmed);
  }

  const embeddedObject = extractFirstJSONObject(rawText);
  if (embeddedObject) {
    candidates.push(embeddedObject);
  }

  return [...new Set(candidates)];
}

function extractToolCallFromMarkdown(rawText: string): ToolCall | null {
  // 1. Check if any markdown code block contains a valid JSON tool call
  const jsonBlocks = [...rawText.matchAll(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/gi)];
  for (const m of jsonBlocks) {
    try {
      const extracted = JSON.parse(m[1].trim());
      const parsed = toolCallSchema.safeParse(extracted);
      if (parsed.success) return parsed.data;
    } catch {
      continue;
    }
  }

  // 2. Extract code blocks (tsx, jsx, typescript, javascript, or untagged)
  const codeBlockRegex = /```(?:tsx|jsx|typescript|javascript|react)?\s*([\s\S]*?)```/gi;
  const blocks = [...rawText.matchAll(codeBlockRegex)];

  const candidateFiles: { path: string; content: string }[] = [];

  for (const match of blocks) {
    const code = match[1].trim();
    // Check if this block looks like a React/Next.js page or component
    const isReactCode =
      code.includes("export default function") ||
      code.includes("export default") ||
      (code.includes("function") && code.includes("return (")) ||
      (code.includes("const ") && (code.includes("=> {") || code.includes("=> (")) && code.includes("return (")) ||
      code.includes("<div") ||
      code.includes("<main");

    if (!isReactCode) continue;

    // Check if there's an explicit file path in comments (e.g. // app/page.tsx or // components/FileManager.tsx)
    const pathMatch = code.match(/^\s*\/\/\s*([a-zA-Z0-9_\-./]+\.(?:tsx|jsx|ts|js))/m);
    let filePath = pathMatch ? pathMatch[1].trim() : "";

    if (!filePath) {
      if (
        code.includes("export default function") ||
        code.includes("export default") ||
        code.includes("function Page") ||
        code.includes("function Home") ||
        candidateFiles.length === 0
      ) {
        filePath = "app/page.tsx";
      } else {
        filePath = `components/component-${candidateFiles.length + 1}.tsx`;
      }
    }

    let processedCode = code;
    if (
      !processedCode.includes('"use client"') &&
      !processedCode.includes("'use client'")
    ) {
      processedCode = `"use client";\n\n${processedCode}`;
    }

    processedCode = autoFixJsxCode(processedCode);

    if (!candidateFiles.some((f) => f.path === filePath)) {
      candidateFiles.push({ path: filePath, content: processedCode });
    }
  }

  if (candidateFiles.length > 0) {
    // Ensure at least one file is designated as app/page.tsx
    if (!candidateFiles.some((f) => f.path === "app/page.tsx")) {
      candidateFiles[0].path = "app/page.tsx";
    }

    console.log(
      `[Parser] Extracted ${candidateFiles.length} file(s) from markdown response:`,
      candidateFiles.map((f) => f.path),
    );

    return {
      tool: "createOrUpdateFiles",
      args: {
        files: candidateFiles,
      },
    };
  }

  // 3. Fallback: Detect raw TSX in unfenced text
  const hasReactSigns =
    (rawText.includes("export default function") || rawText.includes("export default")) &&
    (rawText.includes("<div") || rawText.includes("<main") || rawText.includes("return ("));

  if (hasReactSigns) {
    const startIdx = Math.min(
      ...[
        rawText.indexOf('"use client"'),
        rawText.indexOf("'use client'"),
        rawText.indexOf("import "),
        rawText.indexOf("export default"),
      ].filter((idx) => idx >= 0),
    );

    if (startIdx >= 0) {
      let rawCode = rawText.slice(startIdx).trim();
      const lastBrace = rawCode.lastIndexOf("}");
      if (lastBrace > 0) {
        rawCode = rawCode.slice(0, lastBrace + 1);
      }

      if (!rawCode.includes('"use client"') && !rawCode.includes("'use client'")) {
        rawCode = `"use client";\n\n${rawCode}`;
      }
      rawCode = autoFixJsxCode(rawCode);

      console.log("[Parser] Extracted raw TSX from unfenced response into app/page.tsx");
      return {
        tool: "createOrUpdateFiles",
        args: {
          files: [{ path: "app/page.tsx", content: rawCode }],
        },
      };
    }
  }

  return null;
}

function parseToolCall(rawText: string): ToolCall | null {
  for (const candidate of getJSONCandidates(rawText)) {
    try {
      const extracted = JSON.parse(candidate);
      const parsed = toolCallSchema.safeParse(extracted);
      if (parsed.success) {
        return parsed.data;
      }
    } catch {
      continue;
    }
  }

  // Fallback: extract code blocks from conversational markdown response
  const extractedFromMarkdown = extractToolCallFromMarkdown(rawText);
  if (extractedFromMarkdown) {
    return extractedFromMarkdown;
  }

  return null;
}

function isSafeRelativePath(path: string) {
  return (
    !!path &&
    !path.startsWith("/") &&
    !path.includes("..") &&
    !path.includes("\\")
  );
}

function assertSafeTerminalCommand(command: string) {
  const normalized = command.trim();
  const isAllowedPrefix = ALLOWED_TERMINAL_PREFIXES.some((prefix) =>
    normalized.startsWith(prefix),
  );

  if (!isAllowedPrefix || BLOCKED_SHELL_CHARS.test(normalized)) {
    throw new Error("Unsafe terminal command blocked");
  }
}

function truncateLog(value: string, maxLength = MAX_RAW_LOG_LENGTH) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function normalizeFragmentFiles(
  rawFiles: unknown,
): { path: string; content: string }[] {
  if (!rawFiles || typeof rawFiles !== "object" || Array.isArray(rawFiles)) {
    return [];
  }

  const entries = Object.entries(rawFiles as Record<string, unknown>);
  const normalized: { path: string; content: string }[] = [];

  for (const [path, content] of entries) {
    if (!isSafeRelativePath(path)) continue;
    if (typeof content !== "string") continue;
    normalized.push({
      path,
      content: content.slice(0, MAX_FILE_SIZE),
    });
  }

  return normalized.slice(0, MAX_CONTEXT_FILES);
}

function buildExistingFilesContext(files: { path: string; content: string }[]) {
  if (!files.length) return "";

  const sections = files.map((file) => {
    const trimmed =
      file.content.length > MAX_CONTEXT_FILE_CHARS
        ? `${file.content.slice(0, MAX_CONTEXT_FILE_CHARS)}\n/* truncated */`
        : file.content;

    return `FILE: ${file.path}\n${trimmed}`;
  });

  return [
    "Existing project files from the most recent generated fragment are provided below.",
    "When the user asks to improve or change output, treat these files as the current baseline and update them incrementally.",
    sections.join("\n\n"),
  ].join("\n\n");
}

function createFallbackPage(): CreateOrUpdateFilesCall {
  return {
    tool: "createOrUpdateFiles",
    args: {
      files: [
        {
          path: "app/page.tsx",
          content: `"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Home() {
  const [value, setValue] = useState("");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl border rounded-2xl bg-card p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Generated Page</h1>
        <div className="space-y-3">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type here..."
          />
          <Button className="w-full">Continue</Button>
        </div>
      </div>
    </div>
  );
}`,
        },
      ],
    },
  };
}

async function runTerminal(command: string, sandbox: Sandbox) {
  assertSafeTerminalCommand(command);
  const buffers = { stdout: "", stderr: "" };

  const res = await sandbox.commands.run(command, {
    onStdout: (d: string) => {
      buffers.stdout += d;
    },
    onStderr: (d: string) => {
      buffers.stderr += d;
    },
  });

  const executionResult = res as {
    stdout?: string;
    stderr?: string;
    exitCode?: number | null;
  };

  return {
    stdout: buffers.stdout || executionResult.stdout || "",
    stderr: buffers.stderr || executionResult.stderr || "",
    exitCode: executionResult.exitCode ?? null,
  };
}

function autoFixJsxCode(content: string): string {
  // Fix unclosed JSX comments like {/* comment */ without closing }
  return content.replace(/(\{\/\*[\s\S]*?\*\/)(?!\})/g, "$1}");
}

function scoreCandidateCode(code: string): number {
  if (!code || typeof code !== "string") return 0;
  let score = 0;

  // 1. Valid React & Next.js structure
  if (code.includes('"use client"') || code.includes("'use client'")) score += 15;
  if (code.includes("export default function") || code.includes("export default")) score += 15;

  // 2. React Interactivity & State
  if (code.includes("useState")) score += 15;
  if (code.includes("onClick") || code.includes("onChange") || code.includes("onSubmit")) score += 10;
  if (code.includes("useMemo") || code.includes("useEffect")) score += 5;

  // 3. Mock Data Richness (detecting realistic arrays of objects)
  const arrayMatches = code.match(/\[\s*\{[\s\S]*?\}\s*\]/g);
  if (arrayMatches && arrayMatches.length > 0) {
    score += 15;
    if (code.includes("https://images.unsplash.com") || code.includes("avatar")) score += 5;
  }

  // 4. Responsive Layout & Tailwind structure
  if (code.includes("md:") || code.includes("lg:")) score += 10;
  if (code.includes("grid-cols-") || code.includes("flex-col")) score += 10;

  // 5. Component & Icon Polish
  if (code.includes("lucide-react")) score += 10;
  if (code.includes("@/components/ui/")) score += 10;

  // Penalties
  if (code.includes("// TODO") || code.includes("/* TODO */")) score -= 30;
  if (code.length < 500) score -= 25;

  return Math.max(0, score);
}

async function createOrUpdateFiles(
  files: { path: string; content: string }[],
  sandbox: Sandbox,
) {
  for (const file of files) {
    if (!isSafeRelativePath(file.path)) {
      throw new Error(`Unsafe file path blocked: ${file.path}`);
    }
    const sanitized =
      file.path.endsWith(".tsx") || file.path.endsWith(".jsx")
        ? autoFixJsxCode(file.content)
        : file.content;
    file.content = sanitized;
    await sandbox.files.write(file.path, sanitized);
  }
  return { updated: files.map((f) => f.path) };
}

async function readFiles(files: string[], sandbox: Sandbox) {
  const out: { path: string; content: string }[] = [];
  for (const p of files) {
    if (!isSafeRelativePath(p)) {
      throw new Error(`Unsafe file path blocked: ${p}`);
    }
    const content = await sandbox.files.read(p);
    out.push({ path: p, content });
  }
  return out;
}

async function executeToolCall(parsed: ToolCall, sandbox: Sandbox) {
  switch (parsed.tool) {
    case "terminal":
      return {
        tool: "terminal" as const,
        result: await runTerminal(parsed.args.command, sandbox),
      };
    case "createOrUpdateFiles":
      return {
        tool: "createOrUpdateFiles" as const,
        result: await createOrUpdateFiles(parsed.args.files, sandbox),
      };
    case "readFiles":
      return {
        tool: "readFiles" as const,
        result: await readFiles(parsed.args.files, sandbox),
      };
    case "done":
      return {
        tool: "done" as const,
        result: parsed.args,
      };
    default: {
      const fallback = createFallbackPage();
      return {
        tool: "createOrUpdateFiles" as const,
        result: await createOrUpdateFiles(fallback.args.files, sandbox),
      };
    }
  }
}

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async (ctx) => {
    const { step, event } = ctx;
    const userPrompt = event?.data?.value ?? "";
    const projectId = event?.data?.projectId;

    const initialProjectState = await prisma.project.findUnique({
      where: { id: projectId },
      select: { cancelled: true },
    });
    if (initialProjectState?.cancelled) {
      return { cancelled: true };
    }

    try {
      const latestFragmentInfo = await step.run(
        "get-latest-fragment-info",
        async () => {
          const latestFragment = await prisma.fragment.findFirst({
            where: {
              message: {
                projectId: event.data.projectId,
                type: "RESULT",
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            select: {
              sandboxUrl: true,
              files: true,
            },
          });

          return {
            sandboxUrl: latestFragment?.sandboxUrl || null,
            files: normalizeFragmentFiles(latestFragment?.files),
          };
        },
      );

      const { sandboxId, isReused } = await step.run(
        "get-or-create-sandbox",
        async () => {
          const prevUrl = latestFragmentInfo?.sandboxUrl;
          const prevSandboxId = prevUrl?.match(
            /3000-([a-z0-9]+)\.e2b\.app/i,
          )?.[1];
          if (prevSandboxId) {
            try {
              console.log(
                `[E2B] Attempting warm connection to sandbox: ${prevSandboxId}`,
              );
              const s = await Sandbox.connect(prevSandboxId);
              await s.setTimeout(SANDBOX_TIMEOUT);
              console.log(
                `[E2B] Warm connection successful! Reused sandbox: ${prevSandboxId}`,
              );
              return { sandboxId: prevSandboxId, isReused: true };
            } catch (connectError) {
              console.warn(
                `[E2B] Warm sandbox connection failed, creating fresh sandbox:`,
                connectError,
              );
            }
          }
          const template = process.env.E2B_TEMPLATE || "web-test";
          const s = await Sandbox.create(template);
          await s.setTimeout(SANDBOX_TIMEOUT);
          return { sandboxId: s.sandboxId, isReused: false };
        },
      );

      const sandboxInstance = await getSandBox(sandboxId);

      const latestFragmentFiles = latestFragmentInfo.files;

      if (!isReused && latestFragmentFiles.length) {
        await createOrUpdateFiles(latestFragmentFiles, sandboxInstance);
      }

      const previousMessages = await step.run(
        "get-previous-messages",
        async () => {
          const messages = await prisma.message.findMany({
            where: {
              projectId: event.data.projectId,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 8,
          });

          return messages.reverse().map((message) => ({
            role: message.role === "ASSISTANT" ? "assistant" : "user",
            content: message.content,
          }));
        },
      );

      const conversationMessages: ModelMessage[] = previousMessages.map(
        (message) => ({
          role: message.role as "assistant" | "user",
          content: message.content,
        }),
      );

      // The procedure stores the USER message before sending the event, so the
      // current prompt is already at the end of conversationMessages. Avoid
      // duplicating it. Fall back to appending if history is empty (e.g. race).
      const lastConvMessage =
        conversationMessages[conversationMessages.length - 1];
      const promptAlreadyPresent =
        lastConvMessage?.role === "user" &&
        lastConvMessage?.content === userPrompt;

      const agentMessages: ModelMessage[] = [
        { role: "system", content: PROMPT },
        ...(latestFragmentFiles.length
          ? [
              {
                role: "system" as const,
                content: buildExistingFilesContext(latestFragmentFiles),
              },
            ]
          : []),
        ...conversationMessages,
        ...(promptAlreadyPresent
          ? []
          : [{ role: "user" as const, content: userPrompt }]),
      ];

      let lastRaw = "";
      let lastParsed: ToolCall | null = null;
      let lastToolResult: unknown = null;
      const updatedFiles = new Set<string>();
      let finalSummary = "Generated code and summary.";
      let assistantErrorMessage: string | null = null;

      for (let i = 0; i < MAX_AGENT_STEPS; i++) {
        const projectState = await prisma.project.findUnique({
          where: { id: projectId },
          select: { cancelled: true },
        });
        if (projectState?.cancelled) {
          finalSummary = "Generation was stopped.";
          break;
        }

        let raw: string;
        try {
          raw = await callLLMWithFallbacks(agentMessages, {
            temperature: 0.35,
            max_tokens: 4096,
          });
        } catch (error: unknown) {
          if (isRateLimitError(error)) {
            const rateLimitMessage = getRateLimitMessage(error);
            console.error("Rate limit on all providers:", rateLimitMessage);
            finalSummary =
              "Generation paused — all providers are rate limited. Please retry shortly.";
            assistantErrorMessage = rateLimitMessage;
            lastToolResult = { error: "rate_limit", message: rateLimitMessage };
            break;
          }
          throw error;
        }
        lastRaw = raw;
        console.log("Raw LLM response (truncated):", truncateLog(raw));

        let parsed = parseToolCall(raw);
        let cand1Score = 0;

        if (parsed && parsed.tool === "createOrUpdateFiles") {
          const mainFile = parsed.args.files.find((f) =>
            f.path.includes("page.tsx"),
          );
          if (mainFile) {
            cand1Score = scoreCandidateCode(mainFile.content);
          }
        }

        console.log(
          `[Quality Evaluation] Candidate 1 parsed: ${!!parsed}, quality score: ${cand1Score}/100`,
        );

        // If Candidate 1 failed to parse or scored low, perform an adaptive second try
        if ((!parsed || cand1Score < 60) && i === 0) {
          console.log(
            `[Quality Evaluation] Candidate 1 scored below threshold (${cand1Score}/100). Generating Candidate 2...`,
          );
          try {
            const raw2 = await callLLMWithFallbacks(agentMessages, {
              temperature: 0.65,
              max_tokens: 4096,
            });
            const parsed2 = parseToolCall(raw2);
            if (parsed2 && parsed2.tool === "createOrUpdateFiles") {
              const mainFile2 = parsed2.args.files.find((f) =>
                f.path.includes("page.tsx"),
              );
              const cand2Score = mainFile2
                ? scoreCandidateCode(mainFile2.content)
                : 0;
              console.log(
                `[Quality Evaluation] Candidate 2 quality score: ${cand2Score}/100`,
              );
              if (cand2Score > cand1Score) {
                console.log(
                  `[Quality Evaluation] Candidate 2 won (${cand2Score} vs ${cand1Score}). Adopting Candidate 2.`,
                );
                raw = raw2;
                parsed = parsed2;
              }
            }
          } catch (cand2Err) {
            console.warn(
              `[Quality Evaluation] Candidate 2 generation skipped:`,
              cand2Err,
            );
          }
        }

        if (!parsed) {
          console.log("Parsing failed, using fallback page");
          parsed = createFallbackPage();
        }
        lastParsed = parsed;

        let execution;
        try {
          execution = await executeToolCall(parsed, sandboxInstance);
        } catch (error: unknown) {
          console.error("Tool execution error:", error);
          const fallback = createFallbackPage();
          execution = {
            tool: "createOrUpdateFiles" as const,
            result: await createOrUpdateFiles(
              fallback.args.files,
              sandboxInstance,
            ),
            error: String(error),
          };
        }

        lastToolResult = execution.result;

        if (execution.tool === "createOrUpdateFiles") {
          const maybeUpdated = (execution.result as { updated?: string[] })
            .updated;
          if (Array.isArray(maybeUpdated)) {
            for (const filePath of maybeUpdated) {
              updatedFiles.add(filePath);
            }
          }
        }

        if (parsed.tool === "done") {
          finalSummary = parsed.args.summary;
          break;
        }

        // If app/page.tsx was written in step 0, generation is complete!
        // Break early to eliminate redundant agent roundtrips.
        if (parsed.tool === "createOrUpdateFiles") {
          const filesCreated = parsed.args.files;
          const hasPage = filesCreated.some((f) => f.path.includes("page.tsx"));
          if (hasPage) {
            finalSummary = "Your application was built and is ready to preview.";
            break;
          }
        }

        agentMessages.push({
          role: "assistant",
          content: JSON.stringify(parsed),
        });
        agentMessages.push({
          role: "user",
          content: `Tool result: ${truncateLog(JSON.stringify(execution.result), 3000)}. Continue with the next tool call or finish with {"tool":"done","args":{"summary":"..."}}.`,
        });
      }

      if (finalSummary === "Generated code and summary." && lastParsed) {
        finalSummary = `Generated output using ${lastParsed.tool}.`;
      }

      const host = await sandboxInstance.getHost(3000);
      const sandBoxUrl = `https://${host}`;
      console.log("Sandbox URL:", sandBoxUrl);

      const filesWithContent: { [path: string]: string } = {};
      for (const filePath of updatedFiles) {
        try {
          const content = await sandboxInstance.files.read(filePath);
          filesWithContent[filePath] = content;
        } catch (error) {
          console.error(`Failed to read file ${filePath}:`, error);
          filesWithContent[filePath] = "// Error reading file content";
        }
      }

      const agentState: AgentState = {
        summary: finalSummary,
        files: filesWithContent,
      };

      const postLoopProjectState = await prisma.project.findUnique({
        where: { id: projectId },
        select: { cancelled: true },
      });
      if (postLoopProjectState?.cancelled) {
        return {
          cancelled: true,
          summary: "Generation was stopped.",
          sandboxId,
          sandBoxUrl,
        };
      }

      const [fragmentTitleOutput, responseOutput] = assistantErrorMessage
        ? ["Generation Error", assistantErrorMessage]
        : await step.run("generate-metadata", async () => {
            const [title, response] = await Promise.all([
              callLLMWithFallbacks(
                [
                  { role: "system", content: FRAGMENT_TITLE_PROMPT },
                  { role: "user", content: agentState.summary },
                ],
                { temperature: 0.2, max_tokens: 40 },
              ).catch((err) => {
                console.error("Fragment title generation error:", err);
                return "Generated Page";
              }),
              callLLMWithFallbacks(
                [
                  { role: "system", content: RESPONSE_PROMPT },
                  { role: "user", content: agentState.summary },
                ],
                { temperature: 0.3, max_tokens: 60 },
              ).catch((err) => {
                console.error("Response generation error:", err);
                return "Successfully generated your code.";
              }),
            ]);
            return [
              title.trim() || "Generated Page",
              response.trim() || "Successfully generated your code.",
            ];
          });

      const result = await step.run("save-result", async () => {
        const projectState = await prisma.project.findUnique({
          where: { id: projectId },
          select: { cancelled: true },
        });
        if (projectState?.cancelled) return null;

        try {
          return await prisma.message.create({
            data: {
              projectId: event.data.projectId,
              content: responseOutput,
              role: "ASSISTANT",
              type: assistantErrorMessage ? "ERROR" : "RESULT",
              ...(assistantErrorMessage
                ? {}
                : {
                    fragment: {
                      create: {
                        sandboxUrl: sandBoxUrl,
                        title: fragmentTitleOutput,
                        files: agentState.files,
                      },
                    },
                  }),
            },
            include: {
              fragment: true,
            },
          });
        } catch (error) {
          console.error("Database save error:", error);
          try {
            return await prisma.message.create({
              data: {
                projectId: event.data.projectId,
                content:
                  assistantErrorMessage ||
                  "Something went wrong generating the code.",
                role: "ASSISTANT",
                type: "ERROR",
              },
            });
          } catch (secondaryError) {
            console.error("Error fallback save failed:", secondaryError);
            return null;
          }
        }
      });

      return {
        raw: lastRaw,
        parsed: lastParsed,
        toolResult: lastToolResult,
        sandboxId,
        sandBoxUrl,
        result,
      };
    } catch (error) {
      const safeError = getSafeErrorMessage(error);
      console.error("Unhandled code-agent error:", safeError);
      if (projectId) {
        try {
          await prisma.message.create({
            data: {
              projectId,
              content: safeError,
              role: "ASSISTANT",
              type: "ERROR",
            },
          });
        } catch (dbError) {
          console.error("Failed to persist unhandled error message:", dbError);
        }
      }

      return {
        raw: "",
        parsed: null,
        toolResult: { error: safeError },
        sandboxId: null,
        sandBoxUrl: null,
        result: null,
      };
    }
  },
);
