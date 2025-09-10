import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("taking the input", "5s");

    await step.sleep("processing the input", "5s");

    await step.sleep("finalizing", "5s");

    return { message: `Hello ${event.data.email}!` };
  }
);
