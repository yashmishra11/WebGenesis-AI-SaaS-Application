import { Card } from "@/components/ui/card";
import { Fragment, MessageRole, MessageType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";
import { AlertTriangleIcon, Clock3Icon, Code2Icon, CrownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
interface Messagecardprops {
  content: string;
  role: MessageRole;
  fragment: Fragment | null;
  createdAt: Date;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: MessageType;
}

interface Usermessage {
  content: String;
}

interface AssistantMessage {
  content: string;
  fragment: Fragment | null;
  createdAt: Date;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: MessageType;
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

const Fragmentcard = ({
  fragment,
  isActiveFragment,
  onFragmentClick,
}: LocalFragment) => {
  return (
    <button
      className={cn(
        "flex items-start text-start gap-2 border rounded-lg bg-muted w-fit p-3 hover:bg-secondary transition-colors",
        isActiveFragment &&
          "bg-primary text-primary-foreground border-primary hover:bg-primary",
      )}
      onClick={() => onFragmentClick(fragment)}
    >
      {<Code2Icon className="size-4 mt-0.5" />}
      <div className="flex flex-col flex-1">
        <span className="text-sm font-medium line-clamp-1 ">
          {fragment.title}
        </span>

        <span className="text-sm ">Preview</span>
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
}: AssistantMessage) => {
  const { isRateLimit, retryAfter } = parseRateLimitError(content);
  return (
    <div
      className={cn(
        "flex flex-col group px-2 pb-4",
        type === "ERROR" && "text-red-700 dark:text-red-500",
      )}
    >
      <div className="flex items-center gap-2 pl-2 mb-2 ">
        {/* Todo: add logo */}
        <Image
          className="shrink-0"
          src={"/logo.svg"}
          alt="logo"
          width={20}
          height={20}
        />
        <span className="text-sm font-medium ">WebGenesiss</span>
        <span className="text-sm text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          {" "}
          {format(createdAt, "HH:mm 'on' MMM, dd, yyyy")}
        </span>
      </div>

      <div className="pl-8.5 flex flex-col gap-y-4">
        {type === "ERROR" && isRateLimit ? (
          <Card className="border-amber-300/70 bg-amber-50/50 dark:bg-amber-950/20 p-4 max-w-[95%]">
            <div className="flex items-start gap-2">
              <AlertTriangleIcon className="size-4 mt-0.5 text-amber-600" />
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
          <span>{content}</span>
        )}

        {fragment && type === "RESULT" && (
          <Fragmentcard
            fragment={fragment}
            isActiveFragment={isActiveFragment}
            onFragmentClick={onFragmentClick}
          />
        )}
      </div>
    </div>
  );
};

export const Usermessage = ({ content }: Usermessage) => {
  return (
    <div className="flex justify-end pb-4 pr-2 pl-10">
      <Card className="rounded-lg border-none bg-muted p-3 shadow-none max-w-[80%] break-words">
        {content}
      </Card>
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
      />
    );
  }

  return <Usermessage content={content} />;
};
