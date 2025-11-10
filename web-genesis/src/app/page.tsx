"use client";

import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

const Page = () => {
  const [value, setValue] = useState("");
  const router = useRouter();
  const trpc = useTRPC();

  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: (data) => {
        router.push(`/projects/${data.id}`);
      },
    })
  );

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="max-w-7xl mx-auto flex items-center flex-col gap-y-4 ">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type your message..."
        />

        <Button
          disabled={createProject.isPending}
          onClick={() => createProject.mutate({ value: value })}
          className="px-4 mt-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {createProject.isPending ? "Loading..." : "Submit"}
        </Button>
      </div>
    </div>
  );
};

export default Page;
