"use client";

import Link from "next/link";
import { EyeIcon, CodeIcon, CrownIcon } from "lucide-react";
// import { useSuspenseQuery } from "@tanstack/react-query";
import type { Fragment } from "@prisma/client";
import { useAuth } from "@clerk/nextjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { MessagesContainer } from "../components/messages-container";
import { Suspense, useState } from "react";
import { ProjectHeader } from "../components/project-header";
import { FragmentWeb } from "../components/fragment-web";
import { Button } from "@/components/ui/button";
import { FileExplorer } from "@/components/file-explorer";
import { Profile } from "@/components/user-control";
import { ErrorBoundary } from "react-error-boundary";
interface Props {
  projectId: string;
}

export const ProjectView = ({ projectId }: Props) => {
  const { has } = useAuth();
  const hasProAccess = has?.({ plan: "pro" });
  // const isFreeTier = has?.({ plan: "free_user" });

  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
  const [tabState, setTabState] = useState<"preview" | "code">("preview");
  //   const { data: project } = useSuspenseQuery(
  //     trpc.projects.getOne.queryOptions({
  //       id: projectId,
  //     })
  //   );

  return (
    <div className="h-screen ">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex flex-col min-h-0"
        >
          <ErrorBoundary fallback={<p>project header error...</p>}>
            <Suspense fallback={<p>Loading Project...</p>}>
              <ProjectHeader projectId={projectId} />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary fallback={<p>Messages error...</p>}>
            <Suspense fallback={<p>Loading Messages...</p>}>
              <MessagesContainer
                projectId={projectId}
                activeFragment={activeFragment}
                setActiveFragment={setActiveFragment}
              />
            </Suspense>
          </ErrorBoundary>
        </ResizablePanel>
        <ResizableHandle className="hover:bg-primary transition-colors" />
        <ResizablePanel defaultSize={65} minSize={50}>
          <Tabs
            className="h-full gap-y-0"
            defaultValue="preview"
            value={tabState}
            onValueChange={(value) => setTabState(value as "preview" | "code")}
          >
            <div className="w-full flex items-center p-2 border-b gap-x-2">
              <TabsList className="h-8 p-0 border rounded-md">
                <TabsTrigger value="preview" className="rounded-md">
                  <EyeIcon /> <span>Demo</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="rounded-md">
                  <CodeIcon /> <span>Code</span>
                </TabsTrigger>
              </TabsList>

              <div className="ml-auto flex items-center gap-x-2">
                {!hasProAccess && (
                  <Button asChild size="sm" variant="tertiary">
                    <Link href="/pricing">
                      <CrownIcon /> Upgrade
                    </Link>
                  </Button>
                )}
                <Profile />
              </div>
            </div>
            <TabsContent value="preview">
              {!!activeFragment && <FragmentWeb data={activeFragment} />}
            </TabsContent>
            <TabsContent value="code" className="min-h-0">
              {!!activeFragment?.files && (
                <FileExplorer
                  files={activeFragment.files as { [path: string]: string }}
                />
              )}
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
