"use client";

import { useState } from "react";
import {
  ChevronDownIcon,
  ExternalLinkIcon,
  Loader2Icon,
  MoonIcon,
  PaletteIcon,
  RefreshCcwIcon,
  ShuffleIcon,
  SparklesIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { Fragment } from "@prisma/client";
import { Hint } from "@/components/ui/hint";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface Props {
  data: Fragment;
  projectId?: string;
  isGenerating?: boolean;
}

const VARIATION_PRESETS = [
  {
    id: "surprise",
    label: "Surprise Variation",
    description: "Creative mix of new colors, fonts, and layout",
    icon: ShuffleIcon,
    prompt:
      "Regenerate a creative design variation of this webpage. Keep all core features, functionality, and data structure identical, but redesign the visual presentation: vary the color palette, typography hierarchy, component alignment, and layout arrangement for a fresh aesthetic.",
  },
  {
    id: "colors",
    label: "New Color Palette",
    description: "Distinctive new theme and vibrant accent colors",
    icon: PaletteIcon,
    prompt:
      "Regenerate a variation of this webpage with an entirely different, striking color palette and theme (new primary/secondary accents, updated contrast, and stylized component colors) while preserving all existing functionality and structure.",
  },
  {
    id: "layout",
    label: "Alternative Layout & Placement",
    description: "Reorganized columns, cards, and navigation",
    icon: SlidersHorizontalIcon,
    prompt:
      "Regenerate a variation of this webpage with an alternative layout structure and component placement (e.g. rearrange cards into a dynamic bento grid, alter sidebar/header placement, or modify visual hierarchy) while keeping all functionality intact.",
  },
  {
    id: "dark",
    label: "Sleek Dark Mode",
    description: "Deep tones with glowing neon accents",
    icon: MoonIcon,
    prompt:
      "Regenerate a sleek dark mode variation of this webpage featuring dark slate/zinc background surfaces, high-contrast typography, vibrant neon accent highlights, and subtle borders while preserving all functionality.",
  },
  {
    id: "minimal",
    label: "Minimalist & Clean",
    description: "Generous whitespace and crisp typography",
    icon: SparklesIcon,
    prompt:
      "Regenerate a minimalist, high-end editorial variation of this webpage with clean typography, crisp borders, generous whitespace, and restrained monochrome accents while keeping all functionality intact.",
  },
];

export function FragmentWeb({ data, projectId, isGenerating }: Props) {
  const [fragmentKey, setFragmentKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const clerk = useClerk();

  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        toast.success("Regenerating design variation...");
        if (projectId) {
          queryClient.invalidateQueries(
            trpc.messages.getMany.queryOptions({ projectId })
          );
          queryClient.invalidateQueries(trpc.usage.status.queryOptions());
        }
      },
      onError: (error) => {
        if (error?.data?.code === "UNAUTHORIZED") {
          clerk.openSignIn();
          return;
        }
        toast.error(error.message);
        if (error.data?.code === "TOO_MANY_REQUESTS") {
          router.push("/pricing");
        }
      },
    })
  );

  const isPending = createMessage.isPending || !!isGenerating;

  const onRefresh = () => {
    setFragmentKey((prev) => prev + 1);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(data.sandboxUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = (promptText?: string) => {
    if (!projectId || isPending) return;
    const prompt = promptText || VARIATION_PRESETS[0].prompt;
    createMessage.mutate({
      projectId,
      value: prompt,
    });
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">
        <Hint text="Reload Preview" side="bottom" align="start">
          <Button size="sm" variant="outline" onClick={onRefresh}>
            <RefreshCcwIcon className="size-4" />
          </Button>
        </Hint>

        <Hint text="Click to copy URL" side="bottom">
          <Button
            className="flex-1 justify-start text-start font-normal"
            size="sm"
            variant="outline"
            onClick={handleCopy}
            disabled={!data.sandboxUrl || copied}
          >
            <span className="truncate">{data.sandboxUrl}</span>
          </Button>
        </Hint>

        {/* Regenerate Variation Action */}
        {!!projectId && (
          <div className="inline-flex items-center rounded-md border bg-background shadow-xs">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleRegenerate()}
              disabled={isPending}
              className="gap-1.5 px-2.5 h-8 text-xs font-medium hover:bg-muted text-foreground"
              title="Regenerate this page with a fresh design variation"
            >
              {isPending ? (
                <Loader2Icon className="size-3.5 animate-spin text-primary" />
              ) : (
                <SparklesIcon className="size-3.5 text-primary" />
              )}
              <span>{isPending ? "Regenerating..." : "Regenerate"}</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  className="px-1.5 h-8 border-l rounded-l-none hover:bg-muted"
                  aria-label="Choose variation style"
                >
                  <ChevronDownIcon className="size-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Generate Variation
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {VARIATION_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <DropdownMenuItem
                      key={preset.id}
                      onClick={() => handleRegenerate(preset.prompt)}
                      disabled={isPending}
                      className="flex items-start gap-2.5 py-2 cursor-pointer"
                    >
                      <Icon className="size-4 mt-0.5 text-primary shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium leading-none">
                          {preset.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground mt-1 leading-snug">
                          {preset.description}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <Hint text="Open in a new tab" side="bottom" align="start">
          <Button
            onClick={() => {
              if (!data.sandboxUrl) return;
              window.open(data.sandboxUrl, "_blank");
            }}
            variant="outline"
            size="sm"
            disabled={!data.sandboxUrl}
          >
            <ExternalLinkIcon className="size-4" />
          </Button>
        </Hint>
      </div>

      <iframe
        key={fragmentKey}
        sandbox="allow-forms allow-scripts allow-same-origin"
        className="h-full w-full"
        loading="lazy"
        src={data.sandboxUrl}
      />
    </div>
  );
}