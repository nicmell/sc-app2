// Shared unit-test helpers for the sc-elements suites (examples / controls /
// widgets). The duplication these remove: mounting an entry into a connected
// <sc-plugin> host + running the parse engine, the sequential load pass, and
// the scripted-scsynth auto-responder feeding the real handleReply so the
// `once()` waiters gate exactly as against a live server.
//
// Outbound assertions read the WIRE: every recorded send is encoded through
// the real wasm component and flattened back (`{address, args}`), so the
// suites pin what scsynth would actually receive. Inbound fixtures are
// hand-built typed ServerReply values (compile-checked against the
// component's union) fed straight to handleReply.
//
// The Strudel editor mock (vi.mock of @strudel/codemirror / @strudel/transpiler
// / @/lib/strudel/prebake) stays inline in each suite: vi.mock is hoisted above
// imports, so its factory can't reference a shared helper here.

import { vi, type MockInstance } from "vitest";
import {
  encode,
  flattenEncoded,
  type FlatMessage,
  type OscTimetag,
  type ServerMessage,
  type ServerReply,
} from "@sc-app/server-commands";
import { oscClient } from "@/lib/osc/OscClientProxy";
import { workerOscClient } from "./osc-endpoint";
import { adoptEntry } from "@/lib/plugins/PluginManager";
import type { ScElement, ScPlugin } from "@/sc-elements";

/** The session group id the load pass targets (oscClient.sessionGroupId). */
export const SESSION_GROUP = 1;
/** The first node id handed out by the mocked worker client allocator. */
export const FIRST_NODE_ID = 2000;

/** One recorded outbound command: the flattened wire view (what the suites
 *  assert on) plus the typed message that produced it. */
export interface SentMessage extends FlatMessage {
  msg: ServerMessage;
}

/** Wrap a fragment in a minimal XHTML plugin entry (entries use
 *  self-closing tags — they must be parsed as text/xml, not HTML). */
export function wrapXml(xml: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sc-plugin xmlns="http://www.w3.org/1999/xhtml" xmlns:bind="urn:sc-app:bind">${xml}</sc-plugin>`;
}

/** Parse plugin XML into a connected <sc-plugin> host and run the parse engine
 *  (text/xml parse + importNode — the host IS the parsed root), exactly like
 *  the CDP probe. Throws on an XML parse error. */
export function parsePlugin(xml: string): { host: ScPlugin; nodes: Set<ScElement> } {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("XML parse error: " + doc.querySelector("parsererror")!.textContent);
  }
  const host = document.createElement("sc-plugin") as ScPlugin;
  document.body.appendChild(host); // custom elements only upgrade when connected
  adoptEntry(host, doc);
  const nodes = new Set<ScElement>();
  host.id = `test-${Math.random().toString(36).slice(2)}`;
  host.process({ rootNode: host, nodes, scope: [host], path: [] });
  return { host, nodes };
}

/** parsePlugin + await the sequential load pass (needs an installed scsynth
 *  mock to answer the sequenced commands). */
export async function mountPlugin(xml: string): Promise<{ host: ScPlugin; nodes: Set<ScElement> }> {
  const parsed = parsePlugin(xml);
  await parsed.host.load();
  return parsed;
}

/** A typed `/n_go` reply — what scsynth acks node creation with. */
export function nGoReply(nodeId: number): ServerReply {
  return {
    address: "/n_go",
    args: { nodeId, parentId: 1, prevNode: -1, nextNode: -1, isGroup: 0 },
  };
}

/** Flatten one typed message to its single wire view (assertion helper for
 *  suites that re-mock `send` themselves). */
export function flat(msg: ServerMessage): SentMessage {
  return { ...flattenEncoded(encode(msg))[0], msg };
}

/** Script the scsynth side of the sequenced commands. Replies go through the
 *  real handleReply, so the load pass only advances when its `once()` waiter
 *  is satisfied — the sequencing itself is under test:
 *  /g_new → /n_go, /d_recv → its embedded /sync completion → /synced,
 *  /s_new → /n_go. */
export function autoRespond(sent: SentMessage): void {
  const nGo = (nodeId: number) => workerOscClient.handleReply(nGoReply(nodeId));
  switch (sent.address) {
    case "/g_new":
    case "/s_new": {
      nGo((sent.address === "/g_new" ? sent.args[0] : sent.args[1]) as number);
      break;
    }
    case "/d_recv": {
      // The completion blob is a real encoded message — decode it through
      // the component to find the embedded /sync id.
      const completion = flattenEncoded(sent.args[1] as Uint8Array)[0];
      if (completion?.address === "/sync") {
        workerOscClient.handleReply({
          address: "/synced",
          args: { syncId: completion.args[0] as number },
        });
      }
      break;
    }
  }
}

/** Install the scsynth-facing spies for a load-pass test: worker-side send
 *  (and sendBundle — dirt events) into a recording auto-responder, plus
 *  deterministic node ids and session group. Returns the recorded sends and
 *  the spies (re-mock `send` to script a stalled or partial server). Spies
 *  auto-restore between tests via the config's `restoreMocks: true`. */
export function installScsynthMock(): {
  sent: SentMessage[];
  send: MockInstance<(msg: ServerMessage) => void>;
  sendBundle: MockInstance<(time: OscTimetag, msgs: ServerMessage[]) => void>;
} {
  const sent: SentMessage[] = [];
  const record = (msg: ServerMessage) => {
    const entry = flat(msg);
    sent.push(entry);
    autoRespond(entry);
  };
  const send = vi.spyOn(workerOscClient, "send").mockImplementation(record);
  const sendBundle = vi
    .spyOn(workerOscClient, "sendBundle")
    .mockImplementation((_time, msgs) => msgs.forEach(record));
  let nextId = FIRST_NODE_ID;
  vi.spyOn(workerOscClient, "nextNodeId").mockImplementation(() => nextId++);
  vi.spyOn(oscClient, "sessionGroupId", "get").mockReturnValue(SESSION_GROUP);
  return { sent, send, sendBundle };
}
