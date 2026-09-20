import { ProjectView } from "@/modules/projects/ui/views/project-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";

export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery(
      trpc.messages.getMany.queryOptions({ projectId })
    ),
    queryClient.prefetchQuery(
      trpc.projects.getOne.queryOptions({ id: projectId })
    ),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary
        fallback={
          <div className="flex h-screen items-center justify-center p-6 text-center">
            <div className="max-w-md space-y-3">
              <p className="text-lg font-medium text-destructive">Failed to load project</p>
              <p className="text-sm text-muted-foreground">The project may not exist or you might not have access to it.</p>
            </div>
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="flex h-screen items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading project...</p>
              </div>
            </div>
          }
        >
          <ProjectView projectId={projectId} />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
