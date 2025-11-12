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

  const handleSubmit = () => {
    if (!value.trim()) {
      toast.error("Please enter a message");
      return;
    }
    createProject.mutate({ value: value.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !createProject.isPending) {
      handleSubmit();
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="max-w-7xl mx-auto flex items-center flex-col gap-y-4">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={createProject.isPending}
          className="w-full"
        />

        <Button
          disabled={createProject.isPending || !value.trim()}
          onClick={handleSubmit}
        >
          {createProject.isPending ? "Creating..." : "Create Project"}
        </Button>
      </div>
    </div>
  );
};

export default Page;