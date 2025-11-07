"use client";

import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useState } from "react";
import { useTRPC } from "@trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

const Page = () => {
  const [value, setValue] = useState("");


  const trpc = useTRPC();
  const {data: messages } = useQuery (trpc.messages.getMany.queryOptions());
  const createMessage = useMutation(trpc.message.create.mutationOptions({
    onSuccess: () => {
    toast.success("Message created");
  }
}));


  // const invoke = trpc.invoke.useMutation({
  //   onSuccess: () => {
  //     toast.success("Event sent successfully!");
  //   },
  //   onError: (error) => {
  //     toast.error(`Error: ${error.message}`);
  //   },
  // });

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Input value={value} onChange={(e) => setValue(e.target.value)} />
      <Button

        //disabled={invoke.isPending}
        disabled={createMessage.isPending}
        onClick={() => createMessage.mutate({ value: value })}
        className="px-4 mt-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {createMessage.isPending ? "Loading..." : "Create Message"}
      </Button>
      {JSON.stringify(messages, null, 2)}
    </div>
  );
};

export default Page;
