import 'dotenv/config';
import Groq from 'groq-sdk';
import { PROMPT } from './inngest/prompt';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function test(model: string) {
  console.log('Testing with model:', model);

  const res = await groq.chat.completions.create({
    model,
    messages: [
      { role: "system", content: PROMPT },
      { role: "user", content: "Build an Airbnb-style listings grid with mock data, filter sidebar, and a modal with property details using local state. Use card spacing, soft shadows, and clean layout for a welcoming design." }
    ],
    temperature: 0.35,
    max_tokens: 2000,
  });

  const raw = res.choices[0].message.content || "";
  console.log('--- RAW FIRST 300 ---');
  console.log(raw.slice(0, 300));
}

async function main() {
  await test("openai/gpt-oss-20b");
  await test("qwen/qwen3.8-27b");
}

main().catch(console.error);
