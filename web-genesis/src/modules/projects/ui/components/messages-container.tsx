"use client";

import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Messagecard } from "./message-card";
import { Messageform } from "./message.form";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { MessageLoading } from "./message-loading";
import { Fragment } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Loader2Icon, SquareIcon } from "lucide-react";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const SLOW_GENERATION_MS = 45_000;
const PENDING_TIMEOUT_MS = 5 * 60_000;

interface Props {
  projectId: string;
  activeFragment: Fragment | null;
  setActiveFragment: (fragment: Fragment | null) => void;
}

export const MessagesContainer = ({
  projectId,
  activeFragment,
  setActiveFragment,
}: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const clerk = useClerk();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const statusMessageRef = useRef<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeVersionMap, setActiveVersionMap] = useState<Record<string, number>>({});

  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.messages.getMany.queryOptions({ projectId })
        );
        queryClient.invalidateQueries(trpc.usage.status.queryOptions());
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

  const handleRegenerate = (stylePrompt?: string) => {
    const prompt =
      stylePrompt ||
      "Regenerate a creative design variation of this webpage. Keep the exact same features and functionality, but redesign the visual aesthetic: vary the color palette, typography hierarchy, component alignment, and layout arrangement for a fresh look.";
    createMessage.mutate({
      projectId,
      value: prompt,
    });
  };

  const cancelGeneration = useMutation(
    trpc.projects.cancel.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.messages.getMany.queryOptions({ projectId })
        );
        queryClient.invalidateQueries(trpc.usage.status.queryOptions());
      },
    })
  );

  const { data: messages } = useSuspenseQuery(
    trpc.messages.getMany.queryOptions(
      {
        projectId,
      },
      {
        refetchInterval: (query) => {
          const currentMessages = query.state.data;
          if (!currentMessages?.length) return false;

          const latestMessage = currentMessages[currentMessages.length - 1];
          return latestMessage.role === "USER" ? 1000 : false;
        },
      },
    ),
  );

  type MessageItem = (typeof messages)[number];

  interface Turn {
    id: string;
    baseUserMessage: MessageItem;
    variations: {
      userMessage: MessageItem;
      assistantMessage?: MessageItem;
    }[];
  }

  // Group messages into conversation turns with variations
  const turns = useMemo(() => {
    const result: Turn[] = [];
    let currentTurn: Turn | null = null;

    for (const message of messages) {
      if (message.role === "USER") {
        const isRegen =
          message.content.trim().toLowerCase().startsWith("regenerate") &&
          currentTurn !== null;

        if (isRegen && currentTurn) {
          currentTurn.variations.push({ userMessage: message });
        } else {
          currentTurn = {
            id: message.id,
            baseUserMessage: message,
            variations: [{ userMessage: message }],
          };
          result.push(currentTurn);
        }
      } else if (message.role === "ASSISTANT") {
        if (currentTurn) {
          const lastVariation =
            currentTurn.variations[currentTurn.variations.length - 1];
          if (lastVariation) {
            lastVariation.assistantMessage = message;
          }
        } else {
          result.push({
            id: message.id,
            baseUserMessage: {
              ...message,
              role: "USER",
              content: "Initial setup",
            } as MessageItem,
            variations: [
              {
                userMessage: {
                  ...message,
                  role: "USER",
                  content: "Initial setup",
                } as MessageItem,
                assistantMessage: message,
              },
            ],
          });
        }
      }
    }

    return result;
  }, [messages]);

  const handleVersionChange = (turnId: string, versionIndex: number, turn: Turn) => {
    setActiveVersionMap((prev) => ({
      ...prev,
      [turnId]: versionIndex,
    }));

    const variation = turn.variations[versionIndex];
    if (variation?.assistantMessage?.fragment) {
      setActiveFragment(variation.assistantMessage.fragment);
    }
  };

  useEffect(() => {
    const lastMessage = messages.findLast(
      (message) => message.role === "ASSISTANT",
    );

    if (lastMessage?.fragment && lastMessage.id !== lastMessageIdRef.current) {
      setActiveFragment(lastMessage.fragment);
      lastMessageIdRef.current = lastMessage.id;
    }
  }, [messages, setActiveFragment]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages.length]);

  const lastMessage = messages[messages.length - 1];
  const isLastMessageFromUser = lastMessage?.role === "USER";
  const pendingDuration = isLastMessageFromUser
    ? now - new Date(lastMessage.createdAt).getTime()
    : 0;
  const isSlow =
    isLastMessageFromUser && pendingDuration > SLOW_GENERATION_MS;
  const isTimedOut =
    isLastMessageFromUser && pendingDuration > PENDING_TIMEOUT_MS;

  useEffect(() => {
    if (!isLastMessageFromUser) return;

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [isLastMessageFromUser]);

  useEffect(() => {
    const latest = messages[messages.length - 1];
    if (!latest) return;
    if (latest.id === statusMessageRef.current) return;

    statusMessageRef.current = latest.id;

    if (latest.role === "ASSISTANT") {
      const nextMessage =
        latest.type === "ERROR" ? latest.content : "Generation completed.";
      setStatusMessage(nextMessage);

      const timer = setTimeout(
        () => {
          setStatusMessage(null);
        },
        latest.type === "ERROR" ? 8000 : 3500,
      );

      return () => clearTimeout(timer);
    }

    if (latest.role === "USER") {
      setStatusMessage(null);
    }
  }, [messages]);

  return (
    <div className="flex flex-col flex-1 min-h-0 ">
      <div className="flex-1 min-h-0 overflow-y-auto  ">
        <div className="pt-2 pr-1">
          {turns.map((turn, turnIndex) => {
            const isLatestTurn = turnIndex === turns.length - 1;
            const totalVersions = turn.variations.length;
            const selectedIndex =
              activeVersionMap[turn.id] !== undefined
                ? activeVersionMap[turn.id]
                : totalVersions - 1;
            const clampedIndex = Math.min(
              Math.max(0, selectedIndex),
              totalVersions - 1,
            );
            const activeVariation = turn.variations[clampedIndex];

            return (
              <div key={turn.id} className="flex flex-col">
                {/* User Prompt with version switcher */}
                <Messagecard
                  content={turn.baseUserMessage.content}
                  role="USER"
                  fragment={null}
                  createdAt={turn.baseUserMessage.createdAt}
                  isActiveFragment={false}
                  onFragmentClick={() => {}}
                  type={turn.baseUserMessage.type}
                  totalVersions={totalVersions}
                  currentVersion={clampedIndex + 1}
                  onVersionChange={(newIdx) =>
                    handleVersionChange(turn.id, newIdx, turn)
                  }
                />

                {/* Assistant response for the active variation */}
                {activeVariation?.assistantMessage && (
                  <Messagecard
                    content={activeVariation.assistantMessage.content}
                    role="ASSISTANT"
                    fragment={activeVariation.assistantMessage.fragment}
                    createdAt={activeVariation.assistantMessage.createdAt}
                    isActiveFragment={
                      activeFragment?.id ===
                      activeVariation.assistantMessage.fragment?.id
                    }
                    onFragmentClick={() =>
                      setActiveFragment(
                        activeVariation.assistantMessage?.fragment ?? null,
                      )
                    }
                    type={activeVariation.assistantMessage.type}
                    onRegenerate={isLatestTurn ? handleRegenerate : undefined}
                    isGenerating={
                      isLastMessageFromUser || createMessage.isPending
                    }
                  />
                )}
              </div>
            );
          })}

          {isLastMessageFromUser && (
            <MessageLoading isSlow={isSlow} isTimedOut={isTimedOut} />
          )}

          <div ref={bottomRef} />
        </div>
      </div>
      {/* Message Form */}
      <div className="relative p-3 pt-1 ">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background/70 pointer-events-none" />
        {statusMessage && (
          <div className="mb-2 px-3 py-1.5 rounded-md text-xs bg-muted/80 text-muted-foreground text-center">
            {statusMessage}
          </div>
        )}
        {isLastMessageFromUser && (
          <div className="flex justify-center mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => cancelGeneration.mutate({ projectId })}
              disabled={cancelGeneration.isPending}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              {cancelGeneration.isPending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <SquareIcon className="size-3.5 fill-current" />
              )}
              {cancelGeneration.isPending ? "Stopping..." : "Stop generation"}
            </Button>
          </div>
        )}
        <Messageform projectId={projectId} />
      </div>
    </div>
  );
};
