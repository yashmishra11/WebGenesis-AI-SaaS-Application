import "server-only";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";

// Create a stable query client for React Query
export const getQueryClient = cache(makeQueryClient);

// ✅ Create minimal valid FetchCreateContextFnOptions
const createStaticContext = async () => {
  const req = new Request("http://localhost/api/trpc"); // dummy request
  const resHeaders = new Headers();

  // ⛔️ remove 'info' — it's not always part of FetchCreateContextFnOptions
  return createTRPCContext({ req, resHeaders, info: {} as any });
};

export const trpc = createTRPCOptionsProxy({
  ctx: createStaticContext, // ✅ this now matches expected type
  router: appRouter,
  queryClient: getQueryClient,
});
