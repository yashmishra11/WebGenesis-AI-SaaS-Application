import { Inngest } from "inngest";

const eventKey = process.env.INNGEST_EVENT_KEY;
const signingKey = process.env.INNGEST_SIGNING_KEY;

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "webgenesis-ai",
  ...(eventKey ? { eventKey } : {}),
  ...(signingKey ? { signingKey } : {}),
});

export function assertInngestCanSendEvents() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  if (!eventKey) {
    throw new Error(
      "Missing INNGEST_EVENT_KEY. Add it to your Vercel environment variables and redeploy.",
    );
  }
}
