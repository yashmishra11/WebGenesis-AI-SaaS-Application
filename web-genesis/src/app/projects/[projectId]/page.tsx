import { ProjectView } from "@/modules/projects/ui/views/project-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";

interface Props {
  params: {
    projectId: string;
  };
}

const Page = async ({ params }: Props) => {
  const { projectId } = params;
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery(
      trpc.messages.getMany.queryOptions({
        projectId,
      })
    ),
    queryClient.prefetchQuery(
      trpc.projects.getOne.queryOptions({
        id: projectId,
      })
    ),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary fallback={<p>Something went wrong.</p>}>
        <Suspense fallback={<p>Loading...</p>}>
        <ProjectView projectId={projectId} />
      </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
};

export default Page;
