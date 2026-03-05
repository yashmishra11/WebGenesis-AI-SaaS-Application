import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { codeAgentFunction } from "@/inngest/functions";

export default serve({
  client: inngest,
  functions: [codeAgentFunction],
});
