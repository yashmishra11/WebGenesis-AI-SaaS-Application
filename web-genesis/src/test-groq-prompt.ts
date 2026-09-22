import 'dotenv/config';
import Groq from 'groq-sdk';
import { PROMPT } from './inngest/prompt';
import { z } from 'zod';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MAX_FILE_SIZE = 250_000;
const MAX_FILES_PER_WRITE = 25;

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

function autoFixJsxCode(content: string): string {
  if (!content || typeof content !== "string") return "";

  let code = content.trim();

  if (
    (code.startsWith('"') && code.endsWith('"')) ||
    (code.startsWith("'") && code.endsWith("'"))
  ) {
    try {
      code = JSON.parse(code);
    } catch {
      code = code.slice(1, -1);
    }
  } else if (code.startsWith('\\"') && code.endsWith('\\"')) {
    code = code.slice(2, -2);
  }

  if (code.includes('\\"') || code.includes("\\n") || code.includes("\\t") || code.includes("\\r")) {
    code = code
      .replace(/\\"/g, '"')
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "\r");
  }

  code = code.replace(/\\"/g, '"');
  code = code.replace(/^```(?:tsx|jsx|typescript|javascript|react)?\s*/i, "");
  code = code.replace(/\s*```$/i, "");
  code = code.replace(/(\{\/\*[\s\S]*?\*\/)(?!\})/g, "$1}");

  return code.trim();
}

function extractFirstJSONObject(text: string): string | null {
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (start === -1) {
      if (ch === "{") { start = i; depth = 1; }
      continue;
    }
    if (escaping) { escaping = false; continue; }
    if (ch === "\\") { escaping = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") { depth++; continue; }
    if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function getJSONCandidates(rawText: string) {
  const candidates: string[] = [];
  const trimmed = rawText.trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fencedMatch?.[1]) candidates.push(fencedMatch[1].trim());
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) candidates.push(trimmed);
  const embeddedObject = extractFirstJSONObject(rawText);
  if (embeddedObject) candidates.push(embeddedObject);
  return [...new Set(candidates)];
}

function extractToolCallFromMarkdown(rawText: string) {
  const jsonBlocks = [...rawText.matchAll(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/gi)];
  for (const m of jsonBlocks) {
    try {
      const extracted = JSON.parse(m[1].trim());
      const parsed = createOrUpdateFilesSchema.safeParse(extracted);
      if (parsed.success) return { source: 'jsonBlock', data: parsed.data };
    } catch {
      continue;
    }
  }

  const codeBlockRegex = /```(?:tsx|jsx|typescript|javascript|react)?\s*([\s\S]*?)```/gi;
  const blocks = [...rawText.matchAll(codeBlockRegex)];
  const candidateFiles: { path: string; content: string }[] = [];

  for (const match of blocks) {
    const code = match[1].trim();
    const isReactCode = code.includes("export default") || code.includes("<div") || code.includes("<main");
    if (!isReactCode) continue;

    let processedCode = code;
    if (!processedCode.includes('"use client"') && !processedCode.includes("'use client'")) {
      processedCode = `"use client";\n\n${processedCode}`;
    }
    processedCode = autoFixJsxCode(processedCode);
    candidateFiles.push({ path: "app/page.tsx", content: processedCode });
  }

  if (candidateFiles.length > 0) {
    return { source: 'markdownCodeBlock', data: { tool: "createOrUpdateFiles", args: { files: candidateFiles } } };
  }

  const hasReactSigns = (rawText.includes("export default function") || rawText.includes("export default")) && (rawText.includes("<div") || rawText.includes("<main"));
  if (hasReactSigns) {
    const startIdx = Math.min(...[rawText.indexOf('"use client"'), rawText.indexOf("'use client'"), rawText.indexOf("import "), rawText.indexOf("export default")].filter(i => i >= 0));
    if (startIdx >= 0) {
      let rawCode = rawText.slice(startIdx).trim();
      const lastBrace = rawCode.lastIndexOf("}");
      if (lastBrace > 0) rawCode = rawCode.slice(0, lastBrace + 1);
      if (!rawCode.includes('"use client"') && !rawCode.includes("'use client'")) {
        rawCode = `"use client";\n\n${rawCode}`;
      }
      rawCode = autoFixJsxCode(rawCode);
      return { source: 'rawTSXFallback', data: { tool: "createOrUpdateFiles", args: { files: [{ path: "app/page.tsx", content: rawCode }] } } };
    }
  }

  return null;
}

function parseToolCall(rawText: string) {
  for (const candidate of getJSONCandidates(rawText)) {
    try {
      const extracted = JSON.parse(candidate);
      const parsed = createOrUpdateFilesSchema.safeParse(extracted);
      if (parsed.success) return { source: 'jsonCandidate', data: parsed.data };
    } catch {
      continue;
    }
  }
  return extractToolCallFromMarkdown(rawText);
}

async function test() {
  const model = process.env.GROQ_MODEL || "groq/compound";
  console.log('Calling model:', model);

  const res = await groq.chat.completions.create({
    model,
    messages: [
      { role: "system", content: PROMPT },
      { role: "user", content: "Build an Airbnb-style listings grid with mock data, filter sidebar, and a modal with property details using local state. Use card spacing, soft shadows, and clean layout for a welcoming design." }
    ],
    temperature: 0.35,
    max_tokens: 4096,
  });

  const raw = res.choices[0].message.content || "";
  console.log('Raw response length:', raw.length);
  console.log('Raw starts with:', JSON.stringify(raw.slice(0, 100)));
  console.log('Raw ends with:', JSON.stringify(raw.slice(-100)));

  const parsed = parseToolCall(raw);
  if (!parsed) {
    console.log('FAILED TO PARSE');
    return;
  }
  console.log('PARSE SUCCESS from source:', parsed.source);
  const file = parsed.data.args.files[0];
  console.log('File path:', file.path);
  console.log('File content length:', file.content.length);
  console.log('File content first 250 chars:\n', file.content.slice(0, 250));
  console.log('File content first 100 chars JSON representation:', JSON.stringify(file.content.slice(0, 100)));
}

test().catch(console.error);
