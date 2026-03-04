import Image from "next/image";
import { useState, useEffect } from "react";

const ShimmerMessages = () => {
  const messages = [
    "Thinking...",
    "Loading...",
    "Generating...",
    "Analyzing your request ...",
    "Building your website ...",
    "Crafting components ...",
    "Optimizing layout ...",
    "Adding final touches ...",
    "Almost ready ...",
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex items-center gap-2">
      <span className="text-base text-muted-foreground animate-pulse">
        {messages[currentMessageIndex]}
      </span>
    </div>
  );
};

interface MessageLoadingProps {
  isTimedOut?: boolean;
}

export const MessageLoading = ({ isTimedOut = false }: MessageLoadingProps) => {
  return (
    <div className="flex flex-col group px-2 pb-4">
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Image
          src="/logo.svg"
          alt="vibe"
          width={18}
          height={18}
          className="shrink-0"
        />
        <span className="text-sm font-medium">WebGenesis</span>
      </div>
      <div className="pl-8 flex flex-col gap-y-4">
        {isTimedOut ? (
          <div className="flex items-center gap-2 bg-red-100 p-4 rounded">
            <span className="text-sm text-destructive">
              Generation timed out. Please retry. If the issue persists, check
              the latest error message above.
            </span>
          </div>
        ) : (
          <ShimmerMessages />
        )}
      </div>
    </div>
  );
};
