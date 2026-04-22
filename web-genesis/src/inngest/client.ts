import { Inngest } from "inngest";
import { env } from "@/env";

const eventKey = env.INNGEST_EVENT_KEY;
const signingKey = env.INNGEST_SIGNING_KEY;
const isDev =
  env.INNGEST_DEV === "1" || env.INNGEST_DEV === "true";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "webgenesis-ai",
  ...(isDev ? { isDev: true } : {}),
  ...(eventKey ? { eventKey } : {}),
  ...(signingKey ? { signingKey } : {}),
});

export function assertInngestCanSendEvents() {
  if (env.NODE_ENV !== "production") {
    return;
  }

  if (!eventKey) {
    throw new Error(
      "Missing INNGEST_EVENT_KEY. Add it to your Vercel environment variables and redeploy.",
    );
  }
}
