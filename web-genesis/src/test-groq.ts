import 'dotenv/config';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function main() {
  const model = process.env.GROQ_MODEL || "groq/compound";

  const res = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: "You are a Next.js engineer. Respond with ONLY JSON: {\"tool\":\"createOrUpdateFiles\",\"args\":{\"files\":[{\"path\":\"app/page.tsx\",\"content\":\"'use client';\\n\\nimport React from 'react';\\nexport default function Page() { return <div>Hello</div>; }\"}]}}"
      },
      {
        role: "user",
        content: "Build a simple counter button with useState"
      }
    ],
    temperature: 0.35,
    max_tokens: 2000,
  });

  const raw = res.choices[0].message.content || "";
  console.log('--- FULL RAW RESPONSE ---');
  console.log(raw);
}

main().catch(console.error);
