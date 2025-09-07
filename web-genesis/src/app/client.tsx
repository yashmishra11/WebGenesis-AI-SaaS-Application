"use client";

import { trpc } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export const Client = () => {
  const [ data ] = trpc.createAI.useSuspenseQuery({ text: "yash PREFETCH" });

  useEffect(() => {
    // Add any side effects here
  }, []);

  const [state, setState] = useState("");

  return (
    <div>
      <h1>WebGenesis AI SaaS</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};