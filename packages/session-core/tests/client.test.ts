// Hermetic integration test for the package's reusable layer: each Node OscClient
// (in-process + worker_threads) connecting to an in-process mock bridge, plus a
// ScopeController landing a scripted /scope/chunk in its chunkRef. No Rust, no
// scsynth. Running both clients also pins the worker_threads postMessage +
// ArrayBuffer-transfer path (NodeWorkerOscClient).

import { describe, it, expect } from "vitest";
import { ScopeController, IdAllocator, type OscClient, type OscReply } from "@sc-app/session-core";
import { InProcessOscClient, NodeWorkerOscClient } from "@sc-app/session-core/node";
import { MockBridge } from "./fixtures/mockBridge";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const clients: Array<{ name: string; make: (url: string) => OscClient }> = [
  { name: "InProcessOscClient", make: (u) => new InProcessOscClient(u) },
  { name: "NodeWorkerOscClient", make: (u) => new NodeWorkerOscClient(u) },
];

describe.each(clients)("$name", ({ make }) => {
  it("connects, fans out replies, and drives a ScopeController", async () => {
    const bridge = new MockBridge();
    const url = await bridge.url;
    const client = make(url);

    try {
      await client.ready;

      // Reply fan-out: an emitted /fail reaches onReply.
      const replies: OscReply[] = [];
      client.onReply((r) => replies.push(r));
      bridge.emitFail("/s_new", "SynthDef not found");
      await delay(80);
      const fail = replies.find((r) => r.address === "/fail");
      expect(fail).toBeTruthy();
      expect(fail!.args.slice(0, 2)).toEqual(["/s_new", "SynthDef not found"]);

      // ScopeController: a scripted /scope/chunk (half-amplitude sine) lands in chunkRef.
      const scope = new ScopeController(client, 1000, new IdAllocator(1001, 100), 0);
      scope.start();
      await delay(50);

      const frames = 8;
      const interleaved: number[] = [];
      for (let i = 0; i < frames; i++) {
        const v = Math.sin((i / frames) * Math.PI * 2) * 0.5;
        interleaved.push(v, v); // stereo
      }
      bridge.emitScopeChunk(interleaved);
      await delay(80);

      const chunk = scope.chunkRef.current;
      expect(chunk).toBeTruthy();
      expect(chunk!.channels).toBe(2);
      expect(chunk!.frameCount).toBe(frames);
      const peak = Math.max(...Array.from(chunk!.data).map((v) => Math.abs(v)));
      expect(peak).toBeGreaterThan(0.1);

      scope.dispose();
    } finally {
      client.dispose();
      await bridge.close();
    }
  });
});
