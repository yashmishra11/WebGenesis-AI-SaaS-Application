// function.ts
import { inngest } from "./client";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandBox } from "./utils";
import { Ollama } from "ollama";

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
const sandbox = await Sandbox.create('web-test')
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
      // Debug logging
      console.log('=== E2B API KEY DEBUG ===');
      console.log('E2B_API_KEY exists:', !!process.env.E2B_API_KEY);
      console.log('E2B_API_KEY length:', process.env.E2B_API_KEY?.length);
      console.log('E2B_API_KEY starts with:', process.env.E2B_API_KEY?.substring(0, 10));
      console.log('All env vars:', Object.keys(process.env).filter(k => k.includes('E2B')));
      
      // Use env variable or fallback to hardcoded (temporary)
      const apiKey = process.env.E2B_API_KEY || "e2b_ee5b23ab96c80237d05ec9fea3bf83383273f5aa";
      
      console.log('Using API key:', apiKey.substring(0, 10) + '...');
      
      const s = await Sandbox.create("web-test", {
        apiKey: apiKey
      });
      return s.sandboxId;
    });

    // 2) Call Ollama with a system prompt that instructs JSON tool calls
    const systemPrompt = `You are a coding assistant. When you want the host to execute a tool, RESPOND WITH A SINGLE JSON OBJECT ONLY (no extra text).
Example JSON formats:
{ "tool": "terminal", "args": { "command": "ls -la" } }
{ "tool": "createOrUpdateFiles", "args": { "files": [{ "path": "index.ts", "content": "console.log('hi')" }] } }
{ "tool": "readFiles", "args": { "files": ["index.ts"] } }

If you don't need tools, return the code or explanation as plain text (no JSON).`;

    const userPrompt = event?.data?.value ?? "";

    const response = await ollama.chat({
      model: process.env.OLLAMA_MODEL || "qwen2.5-coder:3b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      // stream: true, // optionally enable streaming to reduce header-timeout risk
    });

    const raw = response?.message?.content ?? "";
    let parsed: any = null;
    let toolResult: any = null;

    // 3) Try to parse a tool call (JSON) from the assistant output
    parsed = extractJSONBlock(raw);

    if (parsed && parsed.tool) {
      try {
        switch (parsed.tool) {
          case "terminal": {
            const cmd = parsed.args?.command;
            if (!cmd) throw new Error("Missing 'command' for terminal tool");
            toolResult = await runTerminal(cmd, sandboxId);
            break;
          }
          case "createOrUpdateFiles": {
            const files = parsed.args?.files;
            if (!Array.isArray(files)) throw new Error("'files' must be an array");
            toolResult = await createOrUpdateFiles(files, sandboxId);
            break;
          }
          case "readFiles": {
            const files = parsed.args?.files;
            if (!Array.isArray(files)) throw new Error("'files' must be an array");
            toolResult = await readFiles(files, sandboxId);
            break;
          }
          default:
            toolResult = { error: `Unknown tool: ${parsed.tool}` };
        }
      } catch (err: any) {
        toolResult = { error: String(err) };
      }
    } else {
      // No tool call: plain text/code response.
      toolResult = null;
    }

    // 4) Build sandbox URL using your helper
    const sandboxInstance = await getSandBox(sandboxId);
    const host = await sandboxInstance.getHost(3000); // your util appears to use this
    const sandBoxUrl = `https://${host}`;

    // 5) Return everything useful
    return {
      raw, // original assistant output
      parsed, // JSON object if present
      toolResult, // execution result if a tool was called
      sandboxId,
      sandBoxUrl,
    };
  }
);