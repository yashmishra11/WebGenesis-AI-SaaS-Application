import { useSuspenseQuery } from "@tanstack/react-query";
import { Messagecard } from "./message-card";
import { Messageform } from "./message.form";
import { useEffect, useRef } from "react";
import { useTRPC } from "@/trpc/client";
<<<<<<< HEAD
=======
import type { Fragment } from "@prisma/client";
>>>>>>> origin/main
import { MessageLoading } from "./message-loading";
import { Fragment } from "@prisma/client";

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const { data: messages } = useSuspenseQuery(
    trpc.messages.getMany.queryOptions(
      {
        projectId,
      },
      //TODO: temporary live message update
      { refetchInterval: 5000 }
    )
  );

  useEffect(() => {
    const lastMessage = messages.findLast(
      (message) => message.role === "ASSISTANT"
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
          {isLastMessageFromUser && <MessageLoading />}

          <div ref={bottomRef} />
        </div>
      </div>
      {/* Message Form */}
      <div className="relative p-3 pt-1 ">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background/70 pointer-events-none" />{" "}
        <Messageform projectId={projectId} />
      </div>
    </div>
  );
};
