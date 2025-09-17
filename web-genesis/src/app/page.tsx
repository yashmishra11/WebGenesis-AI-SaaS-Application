"use client";

import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Page = () => {
  const [value, setValue] = useState("");
  const invoke = trpc.invoke.useMutation({
    onSuccess: () => {
      toast.success("Event sent successfully!");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Input value={value} onChange={(e) => setValue(e.target.value)} />
      <Button
        disabled={invoke.isPending}
        onClick={() => invoke.mutate({ value: value })}
        className="px-4 mt-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {invoke.isPending ? "Loading..." : "Invoke bg job"}
      </Button>
    </div>
  );
};

export default Page;
