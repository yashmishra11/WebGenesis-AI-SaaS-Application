import 'dotenv/config';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const DEFAULT_GROQ_MODELS = [
  "groq/compound",
  "groq/compound-mini",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant"
];

async function checkModels() {
  for (const m of DEFAULT_GROQ_MODELS) {
    try {
      const res = await groq.chat.completions.create({
        model: m,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 10,
      });
      console.log(`[SUCCESS] ${m}:`, res.choices[0].message.content);
    } catch (err) {
      console.log(`[FAILED] ${m}:`, err.message);
    }
  }
}

checkModels();
