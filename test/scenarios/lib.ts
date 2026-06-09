// Shared helpers for the opt-in Tier-2 scenarios (real Rust `serve`).
import type { BootstrapResult } from "../../src/session/bootstrapTypes";

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Bootstrap a session against a running serve: POST /api/session, build the WS URL. */
export function httpBootstrap(base: string): () => Promise<BootstrapResult> {
  return async () => {
    const res = await fetch(`${base}/api/session`, { method: "POST" });
    if (!res.ok) throw new Error(`POST /api/session → ${res.status} ${await res.text()}`);
    const info = (await res.json()) as Omit<BootstrapResult, "wsUrl">;
    const wsUrl = `${base.replace(/^http/, "ws")}/ws?session=${info.sessionId}`;
    return { ...info, wsUrl };
  };
}

/** Poll until `GET ${base}/api/config` answers 200 (serve is up), or time out. */
export async function waitForServe(base: string, timeoutMs = 60000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`${base}/api/config`)).ok) return;
    } catch {
      /* not up yet */
    }
    await delay(500);
  }
  throw new Error(`serve at ${base} did not come up within ${timeoutMs}ms`);
}

export function ok(cond: boolean, msg: string): void {
  if (!cond) {
    console.error("✗ " + msg);
    process.exitCode = 1;
  } else {
    console.log("✓ " + msg);
  }
}
