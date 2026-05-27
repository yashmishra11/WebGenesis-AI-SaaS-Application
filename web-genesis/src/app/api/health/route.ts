import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const startTime = Date.now();

// every env var your app needs to function
const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "CLERK_SECRET_KEY",
  "INNGEST_EVENT_KEY",
  "INNGEST_SIGNING_KEY",
  "GROQ_API_KEY",
  "E2B_API_KEY",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
] as const;

type checkStatus = "Ok" | "Fail" | "Missing";

interface HealthResponse {
  status: "Healthy" | "Degraded";
  timestamp: string;
  uptime_seconds: number;
  checks: Record<string, checkStatus>;
}

async function checkDatabase(): Promise<checkStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "Ok";
  } catch (error) {
    console.error("[health] database check failed:", error);
    return "Fail";
  }
}

function checkEnvVars(): Record<string, checkStatus> {
  const results: Record<string, checkStatus> = {};

  for (const key of REQUIRED_ENV_VARS) {
    const value = process.env[key];
    if (!value || value.trim() === "") {
      results[key] = "Missing";
    } else {
      results[key] = "Ok";
    }
  }

  return results;
}

export async function GET() {
  const checks: Record<string, checkStatus> = {};

  // run DB check
  checks.database = await checkDatabase();

  // run env var checks
  const envChecks = checkEnvVars();
  Object.assign(checks, envChecks);

  // determine overall status
  const allOk = Object.values(checks).every((v) => v === "Ok");

  const response: HealthResponse = {
    status: allOk ? "Healthy" : "Degraded",
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    checks,
  };

  return NextResponse.json(response, {
    status: allOk ? 200 : 500,
    headers: {
      // don't cache this — always needs to be fresh
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
