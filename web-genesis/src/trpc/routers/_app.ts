import { usageRouter } from "@/modules/usage/server/procedures";
import { z } from "zod";
import { createTRPCRouter } from "../init";
import { baseProcedure } from "../../trpc/init";
import { messagesRouter } from "@/modules/messages/server/procedures";
import { inngest } from "@/inngest/client";
import { projectsRouter } from "@/modules/projects/server/procedures";

export const appRouter = createTRPCRouter({
  usage: usageRouter,
  messages: messagesRouter,
  projects: projectsRouter,

  invoke: baseProcedure
    .input(
      z.object({
        value: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await inngest.send({
        name: "test/hello.world",
        data: {
          value: input.value,
        },
      });
      return { ok: "success" };
    }),

  createAI: baseProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
});

export type AppRouter = typeof appRouter;
