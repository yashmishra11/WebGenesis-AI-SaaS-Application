import 'dotenv/config';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function listModels() {
  const models = await groq.models.list();
  console.log('Available Groq models:');
  for (const m of models.data) {
    console.log('-', m.id, `(context: ${m.context_window})`);
  }
}

listModels().catch(console.error);
