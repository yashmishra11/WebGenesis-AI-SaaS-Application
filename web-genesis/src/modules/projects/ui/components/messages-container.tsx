import { useSuspenseQuery } from "@tanstack/react-query";
import { Messagecard } from "./message-card";
import { Messageform } from "./message.form";
import { useEffect, useRef } from "react";
import { useTRPC } from "@/trpc/client";

interface Props {
  projectId: string;
}

export const MessagesContainer = ({ projectId }: Props) => {
  const trpc = useTRPC();
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: messages } = useSuspenseQuery(
    trpc.messages.getMany.queryOptions({
      projectId,
    })
  );

  useEffect(() => {
    const lastAssistentMessage = messages.findLast((message) => {
      message.role = "ASSISTANT";
    });

    if (lastAssistentMessage) {
      // Todo: set active fragment
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages.length]);

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
              isActiveFragment={false}
              onFragmentClick={() => {}}
              type={msg.type}
            />
          ))}
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
