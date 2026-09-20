import "server-only";

import { z } from "zod";

const emptyToUndefined = (val: unknown) =>
  typeof val === "string" && val.trim() === "" ? undefined : val;

const optionalString = z.preprocess(
  emptyToUndefined,
  z.string().min(1).optional(),
);

const serverEnvSchema = z.object({
  DATABASE_URL: z.preprocess(emptyToUndefined, z.string().min(1)),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: optionalString,
  CLERK_SECRET_KEY: z.preprocess(emptyToUndefined, z.string().min(1)),
  INNGEST_EVENT_KEY: optionalString,
  INNGEST_SIGNING_KEY: optionalString,
  GROQ_API_KEY: optionalString,
  GROQ_MODEL: optionalString,
  OPENROUTER_API_KEY: optionalString,
  OPENROUTER_MODEL: optionalString,
  GEMINI_API_KEY: optionalString,
  GEMINI_MODEL: optionalString,
  OPENAI_API_KEY: optionalString,
  OPENAI_MODEL: optionalString,
  E2B_API_KEY: optionalString,
  E2B_TEMPLATE: optionalString,
  NEXT_PUBLIC_APP_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().default("http://localhost:3000"),
  ),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .optional()
    .default("development"),
  INNGEST_DEV: optionalString,
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  console.error(
    `❌ Invalid environment configuration:\n${issues}\n\nPlease check your .env file or deployment environment variables.\n`,
  );
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
