import { initTRPC } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";

// Updated context function for fetch adapter
export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  console.log("🔧 Creating tRPC context");

  return {
    userId: "user_123",
    req: opts.req, // Include request if needed
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// Initialize tRPC with context type
const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
  errorFormatter({ shape, error }) {
    console.error("tRPC Error:", error);
    return shape;
  },
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
