// import { getQueryClient, trpc} from "@/trpc/server";
// import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
// import ClientComponent from "./client";

// export default async function Page() {
//   // Server-side fetch
//   const queryClient = getQueryClient();
//   void queryClient.prefetchQuery(trpc.createAI.queryOptions({ text: "Antonio" }));

//   // //const serverData = await queryClient.fetchQuery(
//   //   serverTrpc.createAI.queryOptions({ text: "hello world!" })
//   // );

//   return (<HydrationBoundary state={dehydrate(queryClient)}>
//     <div>
      
//     <ClientComponent/>
    
//     </div>
//     </HydrationBoundary>
//   )
// }
