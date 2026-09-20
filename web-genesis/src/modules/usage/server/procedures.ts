import { getUsageStatus, getGuestUsageStatus } from "@/lib/usage";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";

export const usageRouter = createTRPCRouter({
  status: baseProcedure.query(async ({ ctx }) => {
    try {
      if (ctx.auth.userId) {
        return await getUsageStatus();
      }
      if (ctx.guestId) {
        return await getGuestUsageStatus(ctx.guestId);
      }
      return null;
    } catch {
      return null;
    }
  }),
});
