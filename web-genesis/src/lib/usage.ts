import { RateLimiterPrisma } from "rate-limiter-flexible";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "./db";

const FREE_POINTS = 5;
const PRO_POINTS = 100;
const GUEST_POINTS = 2;
const DURATION = 30 * 24 * 60 * 60; // 30 days
const GENERATION_COST = 1;

export async function getUsageTracker() {
  const { has } = await auth();
  const hasProAccess = has({ plan: "pro" });

  const usageTracker = new RateLimiterPrisma({
    storeClient: prisma,
    tableName: "Usage",
    points: hasProAccess ? PRO_POINTS : FREE_POINTS,
    duration: DURATION,
  });
  return usageTracker;
}
export async function consumeCredits() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }
  const usageTracker = await getUsageTracker();
  const result = await usageTracker.consume(userId, GENERATION_COST);
  return result;
}

export async function getUsageStatus() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }
  const usageTracker = await getUsageTracker();
  const result = await usageTracker.get(userId);
  return result;
}

export async function consumeGuestCredits(guestId: string) {
  const usageTracker = new RateLimiterPrisma({
    storeClient: prisma,
    tableName: "Usage",
    points: GUEST_POINTS,
    duration: DURATION,
  });
  return usageTracker.consume(`guest_${guestId}`, GENERATION_COST);
}

// userId can be a real Clerk userId or "guest_<guestId>"
export async function refundCredit(userId: string) {
  const isGuest = userId.startsWith("guest_");
  const usageTracker = new RateLimiterPrisma({
    storeClient: prisma,
    tableName: "Usage",
    points: isGuest ? GUEST_POINTS : FREE_POINTS,
    duration: DURATION,
  });
  try {
    await usageTracker.reward(userId, GENERATION_COST);
  } catch {
    // best-effort refund — don't fail the cancel request over this
  }
}
