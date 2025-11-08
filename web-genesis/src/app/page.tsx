"use client";

import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Page = () => {
  const [value, setValue] = useState("");

  // ✅ Fetch all messages
  const { data: messages, isLoading } = trpc.messages.grtMany.useQuery();

  // ✅ Create message mutation
  const createMessage = trpc.messages.create.useMutation({
    onSuccess: () => {
      toast.success("Message created");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleCreate = () => {
    if (!value.trim()) {
      toast.error("Please enter a message");
      return;
    }
    createMessage.mutate({ value });
    setValue("");
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type your message..."
      />

      <Button
        disabled={createMessage.isPending}
        onClick={handleCreate}
        className="px-4 mt-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {createMessage.isPending ? "Loading..." : "Create Message"}
      </Button>

      <pre className="mt-4 bg-gray-100 p-3 rounded text-sm overflow-x-auto">
        {isLoading ? "Loading messages..." : JSON.stringify(messages, null, 2)}
      </pre>
    </div>
  );
};

export default Page;
