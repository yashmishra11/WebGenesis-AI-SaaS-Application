// function.ts
import { inngest } from "./client";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandBox } from "./utils";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "./prompt";
import prisma from "@/lib/db";
import OpenAI from "openai";
import { createState, type Message } from "@inngest/agent-kit";
import { parseAgentOutput } from "@/lib/utils";

interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

// Initialize OpenRouter client
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.YOUR_SITE_URL || "http://localhost:3000",
    "X-Title": process.env.YOUR_APP_NAME || "Code Agent App",
  },
});

// Helper function to call OpenRouter
async function callOpenRouter(systemPrompt: string, userPrompt: string) {
  const response = await openrouter.chat.completions.create({
    model: "meta-llama/llama-3.3-70b-instruct",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });
  
  return response.choices[0].message.content || "";
}

// Extract JSON from text
function extractJSONBlock(text: string): any | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

// Fallback page generator
function createFallbackPage(userPrompt: string) {
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-10 max-w-2xl w-full">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 text-center">
          ${userPrompt}
        </h1>
        <p className="text-gray-600 text-center mb-8">
          AI-generated webpage based on your prompt
        </p>
        <div className="space-y-4">
          <Input 
            value={value} 
            onChange={(e) => setValue(e.target.value)} 
            placeholder="Enter something..."
            className="text-lg p-6"
          />
          <Button className="w-full text-lg py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
            Click Me
          </Button>
        </div>
        <div className="mt-8 p-6 bg-gray-50 rounded-xl">
          <h2 className="text-xl font-semibold mb-2">Your Prompt:</h2>
          <p className="text-gray-700">${userPrompt}</p>
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

// Tool functions
async function runTerminal(command: string, sandboxId: string) {
  const sandbox = await getSandBox(sandboxId);
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
  sandboxId: string
) {
  const sandbox = await getSandBox(sandboxId);
  for (const file of files) {
    await sandbox.files.write(file.path, file.content);
  }
  return { updated: files.map((f) => f.path) };
}

async function readFiles(files: string[], sandboxId: string) {
  const sandbox = await getSandBox(sandboxId);
  const out: { path: string; content: string }[] = [];
  for (const p of files) {
    const content = await sandbox.files.read(p);
    out.push({ path: p, content });
  }
  return out;
}

// Main Inngest function
export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async (ctx) => {
    const { step, event } = ctx;

    const sandboxId = await step.run("create-sandbox", async () => {
      const s = await Sandbox.create("web-test");
      return s.sandboxId;
    });

    const previousMessages = await step.run("get-previous-messages", async () => {
      const formattedMessages: Message[] = [];
      const messages = await prisma.message.findMany({
        where: {
          projectId: event.data.projectId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      for (const message of messages) {
        formattedMessages.push({
          type: "text",
          role: message.role === "ASSISTANT" ? "assistant" : "user",
          content: message.content,
        });
      }

      return formattedMessages;
    });

    const state = createState<AgentState>(
      {
        summary: "",
        files: {},
      },
      {
        messages: previousMessages,
      }
    );

    const systemPrompt = PROMPT;
    const userPrompt = event?.data?.value ?? "";

    console.log("Calling OpenRouter API with user prompt:", userPrompt);

    const response = await openrouter.chat.completions.create({
      model: "meta-llama/llama-3.3-70b-instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const raw = response?.choices?.[0]?.message?.content ?? "";
    console.log("Raw LLM response:", raw);

    let parsed: any = null;
    let toolResult: any = null;

    parsed = extractJSONBlock(raw);

    if (!parsed || !parsed.tool) {
      console.log("Parsing failed, using fallback page");
      parsed = createFallbackPage(userPrompt);
    }

    if (parsed && parsed.tool) {
      console.log("Parsed tool call:", JSON.stringify(parsed, null, 2));

      try {
        switch (parsed.tool) {
          case "terminal": {
            const cmd = parsed.args?.command;
            if (!cmd) throw new Error("Missing 'command' for terminal tool");
            console.log("Running terminal command:", cmd);
            toolResult = await runTerminal(cmd, sandboxId);
            break;
          }
          case "createOrUpdateFiles": {
            const files = parsed.args?.files;
            if (!Array.isArray(files))
              throw new Error("'files' must be an array");
            console.log(
              "Creating/updating files:",
              files.map((f: any) => f.path)
            );
            toolResult = await createOrUpdateFiles(files, sandboxId);
            break;
          }
          case "readFiles": {
            const files = parsed.args?.files;
            if (!Array.isArray(files))
              throw new Error("'files' must be an array");
            console.log("Reading files:", files);
            toolResult = await readFiles(files, sandboxId);
            break;
          }
          default:
            console.log("Unknown tool, using fallback");
            const fallback = createFallbackPage(userPrompt);
            toolResult = await createOrUpdateFiles(
              fallback.args.files,
              sandboxId
            );
        }
      } catch (err: any) {
        console.error("Tool execution error:", err);
        try {
          const fallback = createFallbackPage(userPrompt);
          toolResult = await createOrUpdateFiles(
            fallback.args.files,
            sandboxId
          );
        } catch (fallbackErr) {
          toolResult = { error: String(err) };
        }
      }
    }

    const sandboxInstance = await getSandBox(sandboxId);
    const host = await sandboxInstance.getHost(3000);
    const sandBoxUrl = `https://${host}`;

    console.log("Sandbox URL:", sandBoxUrl);

    const filesWithContent: { [path: string]: string } = {};
    
    if (toolResult?.updated && Array.isArray(toolResult.updated)) {
      for (const filePath of toolResult.updated) {
        try {
          const content = await sandboxInstance.files.read(filePath);
          filesWithContent[filePath] = content;
        } catch (error) {
          console.error(`Failed to read file ${filePath}:`, error);
          filesWithContent[filePath] = "// Error reading file content";
        }
      }
    }

    const agentState: AgentState = {
      summary: parsed?.summary || "Generated code and summary.",
      files: filesWithContent,
    };

    // Generate fragment title using OpenRouter directly
    const fragmentTitleOutput = await step.run("generate-fragment-title", async () => {
      try {
        return await callOpenRouter(FRAGMENT_TITLE_PROMPT, agentState.summary);
      } catch (error) {
        console.error("Fragment title generation error:", error);
        return "Generated Page";
      }
    });

    // Generate response using OpenRouter directly
    const responseOutput = await step.run("generate-response", async () => {
      try {
        return await callOpenRouter(RESPONSE_PROMPT, agentState.summary);
      } catch (error) {
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
            type: "RESULT",
            fragment: {
              create: {
                sandboxUrl: sandBoxUrl,
                title: fragmentTitleOutput,
                files: agentState.files,
              },
            },
          },
          include: {
            fragment: true,
          },
        });
      } catch (error) {
        console.error("Database save error:", error);
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong generating the code.",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }
    });

    return {
      raw,
      parsed,
      toolResult,
      sandboxId,
      sandBoxUrl,
      result,
    };
  }
);