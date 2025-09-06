import { getQueryClient, trpc} from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
// import ClientComponent from "./client";

  return (<HydrationBoundary state={dehydrate(queryClient)}>
    <div>
      
    {/* <{JSON.stringify(dehydrate(queryClient))}>  
     */}
    </div>
    </HydrationBoundary>
  )
}
 