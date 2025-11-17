"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import z from "zod";
import { Form, FormField } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PROJECT_TEMPLATES } from "../../constants/constant";
import { useClerk } from "@clerk/nextjs";

const formSchema = z.object({
  value: z
    .string()
    .min(1, { message: "Value is required" })
    .max(10000, { message: "Value is too long" }),
});

export const ProjectForm = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const router = useRouter();
  const clerk = useClerk();

  const [isFocused, setFocused] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: "",
    },
  });

  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());

        router.push(`/projects/${data.id}`);

        // Todo: Invalidate usage status
      },

      onError: (error) => {
        // Todo: Redirect to pricing page if specific error
        toast.error(error.message);

        if (error?.data?.code === "UNAUTHORIZED") {
          clerk.openSignIn();
        }
      },
    })
  );
  const isPending = createProject.isPending;
  const isButtonDisabled = isPending || !form.formState.isValid;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createProject.mutateAsync({
      value: values.value,
    });
  };

  const onSelect = (content: string) => {
    form.setValue("value", content, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });
  };

  return (
    <Form {...form}>
      <section className="space-y-6">
        <form
          className={cn(
            "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all ",
            isFocused && "shadow-xs "
          )}
          onSubmit={form.handleSubmit(onSubmit)}
          action=""
        >
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <TextareaAutosize
                disabled={isPending}
                {...field}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                minRows={2}
                maxRows={8}
                className="pt-4 resize-none border-none w-full outline-none bg-transparent "
                placeholder="What would you like to build"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    form.handleSubmit(onSubmit)(e);
                  }
                }}
              />
            )}
          />

          <div className="flex gap-x-2 items-end justify-between pt-2">
            <div className="text-[10px] text-muted-foreground font-mono">
              <kbd className="ml-auto pointer-events-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span>&#8984;</span>Enter
              </kbd>
              &nbsp; to submit
            </div>
            <Button
              disabled={isButtonDisabled}
              className={cn(
                "size-8 rounded-full",
                isButtonDisabled && "bg-muted-foreground border "
              )}
            >
              {isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <ArrowUpIcon />
              )}
            </Button>
          </div>
        </form>

        <div className="flex-wrap justify-center gap-2 hidden md:flex max-w-3xl">
          {PROJECT_TEMPLATES.map((template) => (
            <Button
              variant={"outline"}
              size="sm"
              className="bg-white dark:bg-sidebar"
              key={template.title}
              onClick={() => {
                onSelect(template.prompt);
              }}
            >
              {template.emoji} {template.title}
            </Button>
          ))}
        </div>
      </section>
    </Form>
  );
};
