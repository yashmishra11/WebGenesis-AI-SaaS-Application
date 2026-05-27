import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Messagecard } from "./message-card";
import { Messageform } from "./message.form";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { MessageLoading } from "./message-loading";
import { Fragment } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Loader2Icon, SquareIcon } from "lucide-react";

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const statusMessageRef = useRef<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
  const latestAssistantError = useMemo(
    () =>
      [...messages]
        .reverse()
        .find(
          (message) => message.role === "ASSISTANT" && message.type === "ERROR",
        ),
    [messages],
  );

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
          {messages.map((msg) => (
            <Messagecard
              key={msg.id}
              content={msg.content}
              role={msg.role}
              fragment={msg.fragment}
              createdAt={msg.createdAt}
              isActiveFragment={activeFragment?.id === msg.fragment?.id}
              onFragmentClick={() => setActiveFragment(msg.fragment)}
              type={msg.type}
            />
          ))}
          {isLastMessageFromUser && (
            <MessageLoading isSlow={isSlow} isTimedOut={isTimedOut} />
          )}

          <div ref={bottomRef} />
        </div>
      </div>
      {/* Message Form */}
      <div className="relative p-3 pt-1 ">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background/70 pointer-events-none" />
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
