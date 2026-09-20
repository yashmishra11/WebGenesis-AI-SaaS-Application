// app/api/trpc/[...trpc]/route.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/trpc/routers";
import { createTRPCContext } from "@/trpc/init";

export const runtime = "nodejs";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
    onError({ error, path }) {
      console.error(`❌ tRPC error on ${path ?? "<no-path>"}:`, error);
    },
  });

export { handler as GET, handler as POST };
