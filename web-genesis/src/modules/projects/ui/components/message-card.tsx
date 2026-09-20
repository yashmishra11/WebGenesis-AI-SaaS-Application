"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Fragment, MessageRole, MessageType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";
import {
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Clock3Icon,
  Code2Icon,
  CrownIcon,
  Loader2Icon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/hint";
import Link from "next/link";

interface Messagecardprops {
  content: string;
  role: MessageRole;
  fragment: Fragment | null;
  createdAt: Date;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: MessageType;
  onRegenerate?: (stylePrompt?: string) => void;
  isGenerating?: boolean;
  totalVersions?: number;
  currentVersion?: number;
  onVersionChange?: (versionIndex: number) => void;
}

interface UsermessageProps {
  content: string;
  totalVersions?: number;
  currentVersion?: number;
  onVersionChange?: (versionIndex: number) => void;
}

interface AssistantMessageProps {
  content: string;
  fragment: Fragment | null;
  createdAt: Date;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: MessageType;
  onRegenerate?: (stylePrompt?: string) => void;
  isGenerating?: boolean;
}

interface LocalFragment {
  fragment: Fragment;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
}

function parseRateLimitError(content: string) {
  const lower = content.toLowerCase();
  const isRateLimit =
    lower.includes("rate limit") || lower.includes("rate_limit_exceeded");
  const retryMatch = content.match(/try again in\s+([^.]+)/i);

  return {
    isRateLimit,
    retryAfter: retryMatch?.[1]?.trim() ?? null,
  };
}

function getCleanSummary(text: string) {
  const isVerbose = /[*#•-]/.test(text) || text.length > 120;
  if (!isVerbose) {
    return { summary: text, hasMore: false };
  }

  // Find the first clean sentence before any markdown headings or bullet lists
  const firstBlock = text.split(/\n\s*[-*•]|\n\s*#{1,6}|\n\s*\*\*/)[0]?.trim();
  const sentenceMatch = firstBlock?.match(/^([^.!?\n]+[.!?])/);
  const summary =
    sentenceMatch?.[1]?.trim() ||
    firstBlock?.slice(0, 95)?.trim() ||
    "Here is your updated webpage.";

  return { summary, hasMore: true };
}

const Fragmentcard = ({
  fragment,
  isActiveFragment,
  onFragmentClick,
}: LocalFragment) => {
  return (
    <button
      className={cn(
        "flex items-center text-start gap-3 border rounded-lg bg-muted px-4 h-14 hover:bg-secondary transition-colors cursor-pointer",
        isActiveFragment &&
          "bg-primary text-primary-foreground border-primary hover:bg-primary",
      )}
      onClick={() => onFragmentClick(fragment)}
      title="Click to preview in demo tab"
    >
      <Code2Icon className="size-4 shrink-0" />
      <div className="flex flex-col justify-center min-w-0">
        <span className="text-sm font-medium truncate">
          {fragment.title}
        </span>
        <span className="text-xs opacity-70 leading-none mt-0.5">Preview</span>
      </div>
    </button>
  );
};

const AssistantMessage = ({
  content,
  fragment,
  createdAt,
  isActiveFragment,
  onFragmentClick,
  type,
  onRegenerate,
  isGenerating,
}: AssistantMessageProps) => {
  const { isRateLimit, retryAfter } = parseRateLimitError(content);
  const [showDetails, setShowDetails] = useState(false);
  const { summary, hasMore } = useMemo(() => getCleanSummary(content), [content]);

  return (
    <div
      className={cn(
        "flex flex-col group px-2 pb-4",
        type === "ERROR" && "text-red-700 dark:text-red-500",
      )}
    >
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Image
          className="shrink-0"
          src={"/logo.svg"}
          alt="logo"
          width={20}
          height={20}
        />
        <span className="text-sm font-medium">WebGenesiss</span>
        <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          {format(createdAt, "HH:mm 'on' MMM, dd, yyyy")}
        </span>
      </div>

      <div className="pl-8.5 flex flex-col gap-y-3">
        {type === "ERROR" && isRateLimit ? (
          <Card className="border-amber-300/70 bg-amber-50/50 dark:bg-amber-950/20 p-4 max-w-[95%]">
            <div className="flex items-start gap-2">
              <AlertTriangleIcon className="size-4 mt-0.5 text-amber-600 shrink-0" />
              <div className="space-y-2 w-full">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Rate limit reached
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Too many tokens were used in your current Groq quota.
                </p>
                {!!retryAfter && (
                  <div className="inline-flex items-center gap-1 rounded-md border border-amber-300/80 px-2 py-1 text-xs text-amber-800 dark:text-amber-200">
                    <Clock3Icon className="size-3.5" />
                    Retry in {retryAfter}
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <Button asChild size="sm" variant="tertiary">
                    <Link href="/pricing">
                      <CrownIcon className="size-4" /> Upgrade Plan
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Or wait for quota reset and retry.
                  </p>
                </div>
                <details className="pt-1">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    View technical details
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-background p-2 text-xs">
                    {content}
                  </pre>
                </details>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-1">
            <p className="text-sm leading-relaxed text-foreground">
              {summary}
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setShowDetails((prev) => !prev)}
                  className="ml-2 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 cursor-pointer"
                >
                  {showDetails ? "Hide details" : "Details"}
                </button>
              )}
            </p>
            {showDetails && hasMore && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-md whitespace-pre-wrap leading-relaxed max-w-[95%]">
                {content}
              </div>
            )}
          </div>
        )}

        {fragment && type === "RESULT" && (
          <div className="flex items-center gap-2 pt-1">
            <Fragmentcard
              fragment={fragment}
              isActiveFragment={isActiveFragment}
              onFragmentClick={onFragmentClick}
            />

            {onRegenerate && (
              <Hint text="Regenerate" side="top">
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-14 w-14 rounded-lg border bg-muted hover:bg-secondary transition-colors shrink-0",
                    isGenerating && "opacity-60 cursor-not-allowed",
                  )}
                  onClick={() => onRegenerate()}
                  disabled={isGenerating}
                  aria-label="Regenerate"
                >
                  {isGenerating ? (
                    <Loader2Icon className="size-4 animate-spin text-primary" />
                  ) : (
                    <SparklesIcon className="size-4 text-primary" />
                  )}
                </Button>
              </Hint>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const Usermessage = ({
  content,
  totalVersions,
  currentVersion = 1,
  onVersionChange,
}: UsermessageProps) => {
  const hasMultipleVersions = typeof totalVersions === "number" && totalVersions > 1;

  return (
    <div className="flex flex-col items-end pb-4 pr-2 pl-10 gap-1.5">
      <Card className="rounded-lg border-none bg-muted p-3 shadow-none max-w-[80%] break-words">
        {content}
      </Card>

      {hasMultipleVersions && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md select-none">
          <Button
            variant="ghost"
            size="icon"
            className="size-5 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
            disabled={currentVersion <= 1}
            onClick={() => onVersionChange?.(currentVersion - 2)}
            title="Previous variation"
            aria-label="Previous variation"
          >
            <ChevronLeftIcon className="size-3" />
          </Button>

          <span className="tabular-nums px-1 font-medium text-[11px]">
            {currentVersion} / {totalVersions}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="size-5 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
            disabled={currentVersion >= totalVersions}
            onClick={() => onVersionChange?.(currentVersion)}
            title="Next variation"
            aria-label="Next variation"
          >
            <ChevronRightIcon className="size-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export const Messagecard = ({
  content,
  role,
  fragment,
  createdAt,
  isActiveFragment,
  onFragmentClick,
  type,
  onRegenerate,
  isGenerating,
  totalVersions,
  currentVersion,
  onVersionChange,
}: Messagecardprops) => {
  if (role === MessageRole.ASSISTANT) {
    return (
      <AssistantMessage
        content={content}
        fragment={fragment}
        createdAt={createdAt}
        isActiveFragment={isActiveFragment}
        onFragmentClick={onFragmentClick}
        type={type}
        onRegenerate={onRegenerate}
        isGenerating={isGenerating}
      />
    );
  }

  return (
    <Usermessage
      content={content}
      totalVersions={totalVersions}
      currentVersion={currentVersion}
      onVersionChange={onVersionChange}
    />
  );
};
