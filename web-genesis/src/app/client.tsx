"use client";

import { FC } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";

interface ClientProps {
  serverData: string;
}

const ClientComponent: FC<ClientProps> = ({ serverData }) => {
  const query = trpc.createAI.useQuery({ text: "123 " });

  return (
    <div className="flex justify-center items-center flex-col h-[100vh] mt-5 font-bold">
      Hello, NEXTJS
      <Button variant="destructive" className="mt-2">Click Me</Button>

      <div className="mt-4">
        <div>Server Data: {serverData}</div>

        {query.isLoading && "Loading..."}
        {query.error && `Error: ${query.error.message}`}
        {query.data && `Response: ${query.data}`}
      </div>
    </div>
  );
};

export default ClientComponent;
