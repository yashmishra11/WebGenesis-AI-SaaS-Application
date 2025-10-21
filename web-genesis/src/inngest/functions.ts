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
      model: process.env.OLLAMA_MODEL || "qwen2.5-coder:3b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = response?.message?.content ?? "";
    console.log("Raw LLM response:", raw);

    let parsed: any = null;
    let toolResult: any = null;

    // 3) Try to parse a tool call (JSON) from the assistant output
    parsed = extractJSONBlock(raw);

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
            console.log("Creating/updating files:", files.map(f => f.path));
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
            toolResult = { error: `Unknown tool: ${parsed.tool}` };
        }
      } catch (err: any) {
        console.error("Tool execution error:", err);
        toolResult = { error: String(err) };
      }
    } else {
      console.log("No tool call detected in response");
      toolResult = null;
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

