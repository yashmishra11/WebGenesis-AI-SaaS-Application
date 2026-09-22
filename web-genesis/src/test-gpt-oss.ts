import 'dotenv/config';
import Groq from 'groq-sdk';
import { PROMPT } from './inngest/prompt';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

function autoFixJsxCode(content: string): string {
  if (!content || typeof content !== "string") return "";

  let code = content.trim();

  // 1. Strip leading/trailing escaped or unescaped quotes if the whole content was wrapped
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

  // 2. Unescape double-escaped characters from LLM JSON responses:
  // \" -> ", \n -> newline, \t -> tab, \r -> return
  if (code.includes('\\"') || code.includes("\\n") || code.includes("\\t") || code.includes("\\r")) {
    code = code
      .replace(/\\"/g, '"')
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "\r");
  }

  // 3. Clean up any remaining literal backslash-escaped quotes (e.g. from \"react\" or className=\"...\")
  code = code.replace(/\\"/g, '"');

  // 4. Strip accidental markdown code fences if wrapped inside the content string
  code = code.replace(/^```(?:tsx|jsx|typescript|javascript|react)?\s*/i, "");
  code = code.replace(/\s*```$/i, "");

  // 5. Fix unclosed JSX comments like {/* comment */ without closing }
  code = code.replace(/(\{\/\*[\s\S]*?\*\/)(?!\})/g, "$1}");

  return code.trim();
}

async function test() {
  const model = "openai/gpt-oss-120b";
  console.log('Testing with model:', model);

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
  const parsed = JSON.parse(raw);
  const content = parsed.args.files[0].content;
  console.log('--- CONTENT FIRST 200 (JSON repr) ---');
  console.log(JSON.stringify(content.slice(0, 200)));

  const fixed = autoFixJsxCode(content);
  console.log('--- FIXED FIRST 200 (JSON repr) ---');
  console.log(JSON.stringify(fixed.slice(0, 200)));
}

test().catch(console.error);
