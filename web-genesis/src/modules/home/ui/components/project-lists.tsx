"use client";
import Link from "next/link";
import Image from "next/image";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@clerk/nextjs";

export const ProjectsList = () => {
  const trpc = useTRPC();
  const { user } = useUser();
  
  // Get query options first
  const queryOptions = trpc.projects.getMany.queryOptions();
  
  // Use useQuery with enabled option
  const {
    data: projects,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    ...queryOptions,
    enabled: !!user,
  });

  // Now it's safe to return early after all hooks are called
  if (!user) return null;

  return (
    <div className="w-full bg-white dark:bg-sidebar rounded-xl p-8 border flex flex-col gap-y-6 sm:gap-y-4">
      <h2 className="text-2xl font-semibold">
        {user?.firstName}&apos;s Saved Genesis
      </h2>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-lg border bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center space-y-2">
          <p className="text-sm font-medium text-destructive">
            Unable to connect to database
          </p>
          <p className="text-xs text-muted-foreground">
            Please configure your valid DATABASE_URL in the .env file.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-1"
          >
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {projects?.length === 0 && (
            <div className="col-span-full text-center ">
              <p className="text-sm text-muted-foreground">No projects found !</p>
            </div>
          )}

          {projects?.map((project) => (
            <Button
              className="font-normal h-auto justify-start w-full text-start p-4 "
              asChild
              key={project.id}
              variant={"outline"}
            >
              <Link href={`/projects/${project.id}`}>
                <div className="flex items-center gap-x-4">
                  <Image
                    src={"/logo.svg"}
                    alt="logo"
                    width={32}
                    height={32}
                    className="object-contain"
                  />

                  <div className="flex flex-col ">
                    <h3 className="truncate font-medium">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(project.updatedAt, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
