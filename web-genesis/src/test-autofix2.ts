import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

async function main() {
  const msg = await prisma.message.findUnique({
    where: { id: '6d0e6372-6db8-45eb-962b-64848d88e330' },
    include: { fragment: true }
  });
  const page = (msg.fragment.files as Record<string, string>)['app/page.tsx'];
  const after = autoFixJsxCode(page);
  console.log('--- AFTER (first 200 raw chars) ---');
  console.log(after.slice(0, 200));
  console.log('--- CHAR CODES OF AFTER (chars 40 to 80) ---');
  for (let i = 40; i < 80; i++) {
    console.log(i, JSON.stringify(after[i]), after.charCodeAt(i));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
