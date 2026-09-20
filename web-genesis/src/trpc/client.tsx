"use client";
// ^-- to make sure we can mount the Provider from a server component
import superjson from "superjson";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState } from "react";
import { makeQueryClient } from "./query-client";
import type { AppRouter } from "./routers";
export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();
let browserQueryClient: QueryClient;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: make a new query client if we don't already have one
  // This is very important, so we don't re-make a new client if React
  // suspends during the initial render. This may not be needed if we
  // have a suspense boundary BELOW the creation of the query client
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

function getUrl() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/trpc`;
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    `http://localhost:${process.env.PORT ?? 3000}`;

  return `${base}/api/trpc`;
}

export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>
) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          transformer: superjson,
          url: getUrl(),
          fetch: async (url, options) => {
            const res = await fetch(url, options);
            const contentType = res.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
              const text = await res.text();
              const cleanText = text
                .replace(/<[^>]*>?/gm, " ")
                .replace(/\s+/g, " ")
                .trim();
              return new Response(
                JSON.stringify([
                  {
                    error: {
                      json: {
                        message: `Server returned non-JSON response (${res.status}): ${cleanText.slice(0, 160) || res.statusText || "Unexpected response"}`,
                        code: -32603,
                        data: {
                          code: "INTERNAL_SERVER_ERROR",
                          httpStatus: res.status,
                        },
                      },
                    },
                  },
                ]),
                {
                  status: res.status,
                  headers: { "Content-Type": "application/json" },
                }
              );
            }
            return res;
          },
        }),
      ],
    })
  );
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
