import { z } from "zod";
import { assertInngestCanSendEvents, inngest } from "@/inngest/client";
import { baseProcedure, protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { generateSlug } from "random-word-slugs";
import { consumeCredits, consumeGuestCredits, refundCredit } from "@/lib/usage";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export const projectsRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(
      z.object({
        id: z.string().min(1, { message: "Id is required" }),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.auth.userId;
      const guestId = ctx.guestId;

      if (!userId && !guestId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
      }

      const userIdFilter = userId ?? `guest_${guestId}`;
      const existingProject = await prisma.project.findUnique({
        where: { id: input.id, userId: userIdFilter },
      });

      if (!existingProject) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      return existingProject;
    }),

  getMany: protectedProcedure.query(async ({ ctx }) => {
    const projects = await prisma.project.findMany({
      where: { userId: ctx.auth.userId },
      orderBy: { createdAt: "desc" },
    });
    return projects;
  }),

  create: protectedProcedure
    .input(
      z.object({
        value: z
          .string()
          .min(1, { message: "Value is required" })
          .max(10000, { message: "Value is too long" }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await consumeCredits();
      } catch (error) {
        if (error instanceof Error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Something went wrong" });
        } else {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "You have run out of credits" });
        }
      }

      const createProject = await prisma.project.create({
        data: {
          userId: ctx.auth.userId,
          name: generateSlug(2, { format: "kebab" }),
          messages: {
            create: { content: input.value, role: "USER", type: "RESULT" },
          },
        },
      });

      try {
        assertInngestCanSendEvents();
        await inngest.send({
          name: "code-agent/run",
          data: { value: input.value, projectId: createProject.id },
        });
      } catch (error) {
        console.error("Failed to send Inngest event:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Inngest is not configured on the server. Add INNGEST_EVENT_KEY in Vercel and redeploy.",
        });
      }

      return createProject;
    }),

  cancel: baseProcedure
    .input(z.object({ projectId: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.auth.userId;
      const guestId = ctx.guestId;

      if (!userId && !guestId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
      }

      const userIdFilter = userId ?? `guest_${guestId}`;
      const project = await prisma.project.findUnique({
        where: { id: input.projectId, userId: userIdFilter },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      if (project.cancelled) return;

      await prisma.project.update({
        where: { id: input.projectId },
        data: { cancelled: true },
      });

      await prisma.message.create({
        data: {
          projectId: input.projectId,
          content: "Generation was stopped.",
          role: "ASSISTANT",
          type: "ERROR",
        },
      });

      await refundCredit(userIdFilter);
    }),

  createAsGuest: baseProcedure
    .input(
      z.object({
        value: z
          .string()
          .min(1, { message: "Value is required" })
          .max(10000, { message: "Value is too long" }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const cookieStore = await cookies();
      let guestId = ctx.guestId;

      if (!guestId) {
        guestId = crypto.randomUUID();
        cookieStore.set("wg_guest_id", guestId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });
      }

      try {
        await consumeGuestCredits(guestId);
      } catch {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "You've used all your free generations. Sign in to continue.",
        });
      }

      const project = await prisma.project.create({
        data: {
          userId: `guest_${guestId}`,
          name: generateSlug(2, { format: "kebab" }),
          messages: {
            create: { content: input.value, role: "USER", type: "RESULT" },
          },
        },
      });

      try {
        assertInngestCanSendEvents();
        await inngest.send({
          name: "code-agent/run",
          data: { value: input.value, projectId: project.id },
        });
      } catch (error) {
        console.error("Failed to send Inngest event:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Inngest is not configured on the server. Add INNGEST_EVENT_KEY in Vercel and redeploy.",
        });
      }

      return project;
    }),
});
