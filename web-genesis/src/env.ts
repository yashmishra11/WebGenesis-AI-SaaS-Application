import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.url(),
  CLERK_SECRET_KEY: z.string().min(1),
  INNGEST_EVENT_KEY: z.string().min(1),
  INNGEST_SIGNING_KEY: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),
  E2B_API_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.url(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .optional()
    .default("development"),
  INNGEST_DEV: z.string().optional(),
});

export const env = serverEnvSchema.parse(process.env);
