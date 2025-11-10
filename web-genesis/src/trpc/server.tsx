import "server-only";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";

export const getQueryClient = cache(makeQueryClient);

const createStaticContext = async () => {
  const req = new Request("http://localhost/api/trpc"); // dummy request
  const resHeaders = new Headers();

  return createTRPCContext({ req, resHeaders, info: {} as any });
};

export const trpc = createTRPCOptionsProxy({
  ctx: createStaticContext,
  router: appRouter,
  queryClient: getQueryClient,
});
