import { inngest } from "./client";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandBox } from "./utils";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "./prompt";
import Groq from "groq-sdk";
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

const GROQ_MODEL = "llama-3.3-70b-versatile";
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

function isRateLimitError(error: any) {
  return (
    error?.status === 429 ||
    error?.code === "rate_limit_exceeded" ||
    error?.error?.code === "rate_limit_exceeded"
  );
}

function getRateLimitMessage(error: any) {
  return (
    error?.error?.message ||
    error?.message ||
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

async function callGroq(systemPrompt: string, userPrompt: string) {
  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  return response.choices[0].message.content || "";
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

  return {
    stdout: buffers.stdout || (res as any).stdout || "",
    stderr: buffers.stderr || (res as any).stderr || "",
    exitCode: (res as any).exitCode ?? null,
  };
}

async function createOrUpdateFiles(
  files: { path: string; content: string }[],
  sandbox: Sandbox,
) {
  for (const file of files) {
    if (!isSafeRelativePath(file.path)) {
      throw new Error(`Unsafe file path blocked: ${file.path}`);
    }
    await sandbox.files.write(file.path, file.content);
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

    try {
      const sandboxId = await step.run("create-sandbox", async () => {
        const s = await Sandbox.create("web-test");
        await s.setTimeout(SANDBOX_TIMEOUT);
        return s.sandboxId;
      });

      const sandboxInstance = await getSandBox(sandboxId);

      const latestFragmentFiles = await step.run(
        "get-latest-fragment-files",
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
              files: true,
            },
          });

          return normalizeFragmentFiles(latestFragment?.files);
        },
      );

      if (latestFragmentFiles.length) {
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
        { role: "user", content: userPrompt },
      ];

      let lastRaw = "";
      let lastParsed: ToolCall | null = null;
      let lastToolResult: unknown = null;
      const updatedFiles = new Set<string>();
      let finalSummary = "Generated code and summary.";
      let assistantErrorMessage: string | null = null;

      for (let i = 0; i < MAX_AGENT_STEPS; i++) {
        let response;
        try {
          response = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: agentMessages,
            temperature: 0.4,
            max_tokens: 2500,
          });
        } catch (error: any) {
          if (isRateLimitError(error)) {
            const rateLimitMessage = getRateLimitMessage(error);
            console.error("Groq rate limit in agent loop:", rateLimitMessage);
            finalSummary =
              "Generation paused due to Groq rate limits. Please retry shortly.";
            assistantErrorMessage = rateLimitMessage;
            lastToolResult = { error: "rate_limit", message: rateLimitMessage };
            break;
          }
          throw error;
        }

        const raw = response?.choices?.[0]?.message?.content ?? "";
        lastRaw = raw;
        console.log("Raw LLM response (truncated):", truncateLog(raw));

        let parsed = parseToolCall(raw);
        if (!parsed) {
          console.log("Parsing failed, using fallback page");
          parsed = createFallbackPage();
        }
        lastParsed = parsed;

        let execution;
        try {
          execution = await executeToolCall(parsed, sandboxInstance);
        } catch (error: any) {
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

      const fragmentTitleOutput = assistantErrorMessage
        ? "Generation Error"
        : await step.run("generate-fragment-title", async () => {
            try {
              return await callGroq(FRAGMENT_TITLE_PROMPT, agentState.summary);
            } catch (error: any) {
              if (isRateLimitError(error)) {
                const message = getRateLimitMessage(error);
                assistantErrorMessage = message;
                console.error("Groq rate limit in fragment title:", message);
                return "Generation Error";
              }
              console.error("Fragment title generation error:", error);
              return "Generated Page";
            }
          });

      const responseOutput = assistantErrorMessage
        ? assistantErrorMessage
        : await step.run("generate-response", async () => {
            try {
              return await callGroq(RESPONSE_PROMPT, agentState.summary);
            } catch (error: any) {
              if (isRateLimitError(error)) {
                const message = getRateLimitMessage(error);
                assistantErrorMessage = message;
                console.error(
                  "Groq rate limit in response generation:",
                  message,
                );
                return message;
              }
              console.error("Response generation error:", error);
              return "Successfully generated your code.";
            }
          });

      const result = await step.run("save-result", async () => {
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
