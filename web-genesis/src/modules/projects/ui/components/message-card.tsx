import { Card } from "@/components/ui/card";
import { Fragment, MessageRole, MessageType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";
import { Code2, Code2Icon } from "lucide-react";

interface Messagecardprops {
  content: string;
  role: string;
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
          "bg-primary text-primary-foreground border-primary hover:bg-primary"
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
  return (
    <div
      className={cn(
        "flex flex-col group px-2 pb-4",
        type === "ERROR" && "text-red-700 dark:text-red-500"
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
        <span className="text-sm font-medium ">WebGenesis</span>
        <span className="text-sm text-muted-foreground opacity-0 transition-opactiy group-hover:opacity-100">
          {format(createdAt, "HH:mm 'on' MMM, dd, yyyy")}
        </span>
      </div>

      <div className="pl-8.5 flex flex-col gap-y-4">
        <span>{content}</span>

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
  if (role === "ASSISTANT") {
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
