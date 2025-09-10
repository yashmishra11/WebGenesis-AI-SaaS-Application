// app/api/trpc/[...trpc]/route.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";
import { appRouter } from "@/trpc/routers/_app";

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: ({ req }) => ({
      userId: "", // Replace with logic to extract userId if available
      req,
    }),
  });

export { handler as GET, handler as POST };