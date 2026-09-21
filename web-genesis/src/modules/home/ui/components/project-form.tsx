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
import { useClerk, useUser } from "@clerk/nextjs";
import { AuthGateModal } from "./auth-gate-modal";

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
  const { isSignedIn } = useUser();

  const [isFocused, setFocused] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { value: "" },
  });

  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
        queryClient.invalidateQueries(trpc.usage.status.queryOptions());
        router.push(`/projects/${data.id}`);
      },
      onError: (error) => {
        toast.error(error.message);
        if (error?.data?.code === "UNAUTHORIZED") clerk.openSignIn();
        if (error.data?.code === "TOO_MANY_REQUESTS") router.push("/pricing");
      },
    })
  );

  const createGuestProject = useMutation(
    trpc.projects.createAsGuest.mutationOptions({
      onSuccess: (data) => {
        router.push(`/projects/${data.id}`);
      },
      onError: (error) => {
        if (error.data?.code === "TOO_MANY_REQUESTS") {
          setShowAuthGate(true);
        } else {
          toast.error(error.message);
        }
      },
    })
  );

  const isPending = createProject.isPending || createGuestProject.isPending;
  const isButtonDisabled = isPending || !form.formState.isValid;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (isSignedIn) {
        await createProject.mutateAsync({ value: values.value });
      } else {
        await createGuestProject.mutateAsync({ value: values.value });
      }
    } catch {
      // Error is handled by onError callback in useMutation
    }
  };

  const onSelect = (content: string) => {
    form.setValue("value", content, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });
  };

  return (
    <>
      <AuthGateModal open={showAuthGate} onClose={() => setShowAuthGate(false)} />
      <Form {...form}>
        <section className="space-y-6">
          <form
            className={cn(
              "relative border p-4 pt-2 rounded-2xl bg-card/80 backdrop-blur-md transition-all duration-200 shadow-sm hover:border-primary/40",
              isFocused && "ring-2 ring-primary/20 border-primary shadow-lg shadow-primary/5"
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
                  minRows={3}
                  maxRows={8}
                  className="pt-2 resize-none border-none w-full outline-none bg-transparent text-sm md:text-base leading-relaxed placeholder:text-muted-foreground/60"
                  placeholder="What would you like to build? (e.g. A modern SaaS dashboard with analytics charts and dark mode)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      form.handleSubmit(onSubmit)();
                    }
                  }}
                />
              )}
            />

            <div className="flex gap-x-2 items-end justify-between pt-2">
              <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5 flex-wrap">
                <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  Enter
                </kbd>
                <span>to submit</span>
                <span className="text-muted-foreground/40">·</span>
                <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  Shift + Enter
                </kbd>
                <span>for new line</span>
              </div>
              <Button
                disabled={isButtonDisabled}
                className={cn(
                  "size-8 rounded-full transition-transform active:scale-95",
                  isButtonDisabled && "bg-muted-foreground border opacity-50"
                )}
              >
                {isPending ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <ArrowUpIcon className="size-4" />
                )}
              </Button>
            </div>
          </form>

          <div className="flex-wrap justify-center gap-2 hidden md:flex max-w-3xl">
            {PROJECT_TEMPLATES.map((template) => (
              <Button
                variant="outline"
                size="sm"
                className="bg-card/70 backdrop-blur-xs hover:border-primary/50 hover:bg-muted/80 transition-all duration-200 text-xs font-medium rounded-full px-3.5 shadow-xs"
                key={template.title}
                onClick={() => onSelect(template.prompt)}
              >
                <span className="mr-1.5">{template.emoji}</span>
                {template.title}
              </Button>
            ))}
          </div>
        </section>
      </Form>
    </>
  );
};
