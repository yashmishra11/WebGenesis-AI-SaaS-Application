"use client";

import { trpc } from "@/trpc/client";
import { toast } from "sonner";

const Page = () => {
  // ✅ Use the mutation directly - this should now work
  const invoke = trpc.invoke.useMutation({
    onSuccess: () => {
      toast.success("Event sent successfully!");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <button
        disabled={invoke.isPending}
        onClick={() => invoke.mutate({ text: "Hello World" })}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {invoke.isPending ? "Loading..." : "Invoke bg job"}
      </button>
    </div>
  );
};

export default Page;