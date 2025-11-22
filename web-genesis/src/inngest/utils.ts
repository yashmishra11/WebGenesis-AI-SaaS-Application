import { Sandbox } from "@e2b/code-interpreter";
import { SANDBOX_TIMEOUT } from "./types";

export async function getSandBox(sandboxId: string) {
  const sandbox = await Sandbox.connect(sandboxId);
          await sandbox.setTimeout(SANDBOX_TIMEOUT);
  return sandbox;
}
