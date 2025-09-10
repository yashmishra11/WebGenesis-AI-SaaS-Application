// trpc/client.tsx
"use client";

import type { AppRouter } from "../trpc/routers/_app";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useState } from "react";
import superjson from "superjson";

// 👉 this gives you typed hooks (trpc.something.useQuery / useMutation)
export const trpc = createTRPCReact<AppRouter>();

// ✅ Create query client function
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
      },
    },
  });
}

export function TRPCReactProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => makeQueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: process.env.NODE_ENV === 'production' 
            ? 'https://yourdomain.com/api/trpc' 
            : 'http://localhost:3000/api/trpc',
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}

// ✅ Fix: Return the trpc instance directly, not useContext
export const useTRPC = () => trpc;