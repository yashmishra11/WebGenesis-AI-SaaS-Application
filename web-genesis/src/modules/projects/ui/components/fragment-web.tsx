<<<<<<< HEAD
import { useState } from "react";
import { ExternalLinkIcon, RefreshCcwIcon } from "lucide-react";
import { Fragment } from "@prisma/client";
import { Hint } from "@/components/ui/hint";
import { Button } from "@/components/ui/button";

interface Props {
  data: Fragment;
}
=======
import React, { useState } from "react";
import { ExternalLinkIcon, RefreshCcwIcon } from "lucide-react";

import type { Fragment } from "@prisma/client";
import { Button } from "@/components/ui/button";

type HintProps = {
    text: string;
    side?: "top" | "bottom" | "left" | "right";
    align?: "start" | "center" | "end";
    children: React.ReactNode;
};
function Hint({ text, children }: HintProps) {
    // minimal accessible wrapper that shows the hint via the title attribute
    return (
        <div title={text} className="inline-flex">
            {children}
        </div>
    );
}

interface Props {
    data: Fragment;
};
export function FragmentWeb({ data }: Props) {
    const [copied, setCopied] = useState(false);
    const [fragmentKey, setFragmentKey] = useState(0);

    const onRefresh = () => {
        setFragmentKey((prev) => prev + 1);
    };
>>>>>>> origin/main

export function FragmentWeb({ data }: Props) {
  const [fragmentKey, setFragmentKey] = useState(0);
  const [copied, setCopied] = useState(false);

<<<<<<< HEAD
  const onRefresh = () => {
    setFragmentKey((prev) => prev + 1);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(data.sandboxUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex flex-col w-full h-full ">
      <div className="p-2 border-b bg-sidebar flex items-center gap-x-2 ">
        <Hint text="Refresh" side="bottom" align="start">
          <Button size="sm" variant="outline" onClick={onRefresh}>
            <RefreshCcwIcon />
          </Button>
        </Hint>
        <Hint text="Click to copy" side="bottom">
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
            <ExternalLinkIcon />
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
=======
                <Hint text="Refresh Preview" side="bottom" align="start">

                    <Button size="sm" variant="outline" onClick={onRefresh}>
                        <RefreshCcwIcon />
                    </Button>
                </Hint>
                <Hint text="click to copy" side="bottom">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCop}
                        disabled={!data.sandboxUrl || copied}
                        className="flex-1 justify-start text-start font-normal"
                    >
                        <span className="truncate">
                            {data.sandboxUrl}

                        </span>
                    </Button>
                </Hint>



                <Hint text="Open in new tab" side="bottom" align="start">
                    <Button
                        size="sm"
                        disabled={!data.sandboxUrl}
                        variant="outline"
                        onClick={() => {
                            if (!data.sandboxUrl) return;
                            window.open(data.sandboxUrl, "_blank");
                        }}
                        title="Open in new tab"
                    >
                        <ExternalLinkIcon />
                    </Button>
                </Hint>
            </div>
            <iframe
                key={fragmentKey}

                className="h-full w-full"
                sandbox="allow-forms allow-scripts allow-same-origin"
                loading="lazy"
                src={data.sandboxUrl}


            />

        </div>
    )
}; 
>>>>>>> origin/main
