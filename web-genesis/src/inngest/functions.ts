// function.ts
import { inngest } from "./client";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandBox } from "./utils";
import { Ollama } from "ollama";
import { PROMPT } from "./prompt";

const ollama = new Ollama({
  host: "http://127.0.0.1:11434",
});

// Helper: extract first top-level JSON object from text (balanced braces)
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

// NEW: Fallback function to create a basic page when LLM fails
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
}`
        }
      ]
    }
  };
}

// ---------- Tools (use getSandBox(sandboxId) to access sandbox instance) ----------
async function runTerminal(command: string, sandboxId: string) {
  const sandbox = await getSandBox(sandboxId);
  const buffers = { stdout: "", stderr: "" };

  const res = await sandbox.commands.run(command, {
    onStdout: (d: string) => { buffers.stdout += d; },
    onStderr: (d: string) => { buffers.stderr += d; },
  });

  return {
    stdout: buffers.stdout || (res as any).stdout || "",
    stderr: buffers.stderr || (res as any).stderr || "",
    exitCode: (res as any).exitCode ?? null,
  };
}

async function createOrUpdateFiles(files: { path: string; content: string }[], sandboxId: string) {
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

// ---------- helloWorld Inngest function ----------
export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async (ctx) => {
    const { step, event } = ctx;

    // 1) Create sandbox and keep sandboxId only
    const sandboxId = await step.run("create-sandbox", async () => {
      const s = await Sandbox.create("web-test");
      return s.sandboxId;
    });

    // 2) Call Ollama with system prompt
    const systemPrompt = PROMPT;
    const userPrompt = event?.data?.value ?? "";

    console.log("Calling Ollama with user prompt:", userPrompt);

    const response = await ollama.chat({
      // USE A BETTER MODEL - qwen2.5-coder is MUCH better for code generation
      model: process.env.OLLAMA_MODEL || "qwen2.5-coder:3b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      options: {
        temperature: 0.7,
        num_predict: 2000, // Allow longer responses
      }
    });

    const raw = response?.message?.content ?? "";
    console.log("Raw LLM response:", raw);

    let parsed: any = null;
    let toolResult: any = null;

    // 3) Try to parse a tool call (JSON) from the assistant output
    parsed = extractJSONBlock(raw);

    // NEW: If parsing failed, use fallback
    if (!parsed || !parsed.tool) {
      console.log("⚠️ No valid tool call detected, using fallback page generator");
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
            if (!Array.isArray(files)) throw new Error("'files' must be an array");
            console.log("Creating/updating files:", files.map((f: any) => f.path));
            toolResult = await createOrUpdateFiles(files, sandboxId);
            break;
          }
          case "readFiles": {
            const files = parsed.args?.files;
            if (!Array.isArray(files)) throw new Error("'files' must be an array");
            console.log("Reading files:", files);
            toolResult = await readFiles(files, sandboxId);
            break;
          }
          default:
            console.log("Unknown tool, using fallback");
            const fallback = createFallbackPage(userPrompt);
            toolResult = await createOrUpdateFiles(fallback.args.files, sandboxId);
        }
      } catch (err: any) {
        console.error("Tool execution error:", err);
        // On error, still try to create a fallback page
        try {
          const fallback = createFallbackPage(userPrompt);
          toolResult = await createOrUpdateFiles(fallback.args.files, sandboxId);
        } catch (fallbackErr) {
          toolResult = { error: String(err) };
        }
      }
    }

    // 4) Build sandbox URL
    const sandboxInstance = await getSandBox(sandboxId);
    const host = await sandboxInstance.getHost(3000);
    const sandBoxUrl = `https://${host}`;

    console.log("Sandbox URL:", sandBoxUrl);

    // 5) Return everything
    return {
      raw,
      parsed,
      toolResult,
      sandboxId,
      sandBoxUrl,
    };
  }
);