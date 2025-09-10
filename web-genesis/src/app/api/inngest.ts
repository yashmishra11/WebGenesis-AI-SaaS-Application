import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { helloWorld } from "@/inngest/functions";

export default serve({
  client: inngest,
  functions: [helloWorld],
});