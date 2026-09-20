import { z } from "zod";
import { assertInngestCanSendEvents, inngest } from "@/inngest/client";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { consumeCredits, consumeGuestCredits } from "@/lib/usage";
import { prisma } from "@/lib/db";

export const messagesRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(
      z.object({
        projectId: z.string().min(1, { message: "Project Id is required" }),
      }),
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.auth.userId;
      const guestId = ctx.guestId;

      if (!userId && !guestId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
      }

      // If user is authenticated and has a guest cookie, claim matching guest project
      if (userId && guestId) {
        const guestProject = await prisma.project.findFirst({
          where: { id: input.projectId, userId: `guest_${guestId}` },
        });
        if (guestProject) {
          await prisma.project.update({
            where: { id: input.projectId },
            data: { userId },
          });
        }
      }

      const userIdFilter = userId ?? `guest_${guestId}`;

      const messages = await prisma.message.findMany({
        where: {
          projectId: input.projectId,
          project: { userId: userIdFilter },
        },
        orderBy: { createdAt: "asc" },
        include: { fragment: true },
      });
      return messages;
    }),
  create: baseProcedure
    .input(
      z.object({
        value: z
          .string()
          .min(1, { message: "Value is required" })
          .max(10000, { message: "Value is too long" }),
        projectId: z.string().min(1, { message: "Project Id is required" }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.auth.userId;
      const guestId = ctx.guestId;

      if (!userId && !guestId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // If user is authenticated and has a guest cookie, claim matching guest project
      if (userId && guestId) {
        const guestProject = await prisma.project.findFirst({
          where: { id: input.projectId, userId: `guest_${guestId}` },
        });
        if (guestProject) {
          await prisma.project.update({
            where: { id: input.projectId },
            data: { userId },
          });
        }
      }

      const userIdFilter = userId ?? `guest_${guestId}`;
      const existingProject = await prisma.project.findFirst({
        where: {
          id: input.projectId,
          userId: userIdFilter,
        },
      });

      if (!existingProject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      try {
        if (userId) {
          await consumeCredits();
        } else if (guestId) {
          await consumeGuestCredits(guestId);
        }
      } catch (error: unknown) {
        console.error("❌ Error consuming credits:", error);

        const rateLimitErr =
          typeof error === "object" && error !== null
            ? (error as { msBeforeNext?: number; message?: string })
            : null;

        if (rateLimitErr?.msBeforeNext !== undefined) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: userId
              ? `You have run out of credits. Try again in ${Math.ceil(
                  rateLimitErr.msBeforeNext / 1000 / 60 / 60 / 24,
                )} days.`
              : "You've used all your free generations. Sign in to continue.",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: rateLimitErr?.message || "Failed to consume credits",
        });
      }

      const newMessage = await prisma.message.create({
        data: {
          projectId: existingProject.id,
          content: input.value,
          role: "USER",
          type: "RESULT",
        },
      });

      try {
        assertInngestCanSendEvents();
        await inngest.send({
          name: "code-agent/run",
          data: {
            value: input.value,
            projectId: input.projectId,
          },
        });
      } catch (error) {
        console.error("Failed to send Inngest event:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Inngest is not configured on the server. Add INNGEST_EVENT_KEY in Vercel and redeploy.",
        });
      }

      return newMessage;
    }),
});
