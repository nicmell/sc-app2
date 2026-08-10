// Shared unit-test helpers for the sc-elements suites (examples / controls /
// widgets). The duplication these remove: parsing an entry into an offline,
// explicitly upgraded <sc-plugin> host, the sequential load pass, and
// the scripted-scsynth auto-responder feeding the real handleReply so the
// `once()` waiters gate exactly as against a live server.
//
// The Strudel editor mock (vi.mock of @strudel/codemirror / @strudel/transpiler
// / @/lib/strudel/prebake) stays inline in each suite: vi.mock is hoisted above
// imports, so its factory can't reference a shared helper here.

import { vi, type MockInstance } from "vitest";
import { isMessage, type OscMessage, type OscPacket } from "@sc-app/server-commands";
import { oscClient } from "@/lib/osc/OscClient";
import { adoptEntry } from "@/lib/plugins/PluginManager";
import type { ScElement, ScPlugin } from "@/sc-elements";

/** The session group id the load pass targets (oscClient.sessionGroupId). */
export const SESSION_GROUP = 1;
/** The first node id handed out by the mocked oscClient.nextNodeId. */
export const FIRST_NODE_ID = 2000;

/** Wrap a fragment in a minimal XHTML plugin entry (entries use
 *  self-closing tags — they must be parsed as text/xml, not HTML). */
export function wrapXml(xml: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sc-plugin xmlns="http://www.w3.org/1999/xhtml" xmlns:bind="urn:sc-app:bind">${xml}</sc-plugin>`;
}

/** Parse plugin XML into a disconnected, explicitly upgraded <sc-plugin> host
 *  and run the parse engine (text/xml parse + importNode — the host IS the
 *  parsed root), exactly like production. Throws on an XML parse error. */
export function parsePlugin(xml: string): { host: ScPlugin; nodes: Set<ScElement> } {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("XML parse error: " + doc.querySelector("parsererror")!.textContent);
  }
  const host = document.createElement("sc-plugin") as ScPlugin;
  host.id = `test-${Math.random().toString(36).slice(2)}`;
  adoptEntry(host, doc);
  customElements.upgrade(host);
  const nodes = new Set<ScElement>();
  host.process({ rootNode: host, nodes, scope: [host], path: [] });
  return { host, nodes };
}

/** parsePlugin + connect the parsed tree + await the sequential load pass
 *  (needs an installed scsynth mock to answer the sequenced commands). */
export async function mountPlugin(xml: string): Promise<{ host: ScPlugin; nodes: Set<ScElement> }> {
  const parsed = parsePlugin(xml);
  document.body.appendChild(parsed.host);
  // Let firstUpdated start the production pass, then join that in-flight load.
  await parsed.host.updateComplete;
  await parsed.host.load();
  return parsed;
}

/** Script the scsynth side of the sequenced commands. Replies go through the
 *  real handleReply, so the load pass only advances when its `once()` waiter
 *  is satisfied — the sequencing itself is under test:
 *  /g_new → /n_go, /d_recv → its embedded /sync completion → /synced,
 *  /s_new → /n_go. */
export function autoRespond(msg: OscMessage): void {
  const nGo = (nodeId: number) =>
    oscClient.handleReply({ address: "/n_go", args: [nodeId, 1, -1, -1, 0] });
  switch (msg.address) {
    case "/g_new":
    case "/s_new": {
      nGo(msg.address === "/g_new" ? (msg.args[0] as number) : (msg.args[1] as number));
      break;
    }
    case "/d_recv": {
      const completion = msg.args[1];
      if (
        typeof completion === "object" &&
        !(completion instanceof Uint8Array) &&
        isMessage(completion) &&
        completion.address === "/sync"
      ) {
        oscClient.handleReply({ address: "/synced", args: [completion.args[0]] });
      }
      break;
    }
  }
}

/** Install the scsynth-facing spies for a load-pass test: oscClient.send into
 *  a recording auto-responder, plus deterministic node ids and session group.
 *  Returns the recorded sends and the `send` spy (re-mock it to script a
 *  stalled or partial server). Spies auto-restore between tests via the
 *  config's `restoreMocks: true`. */
export function installScsynthMock(): {
  sent: OscMessage[];
  send: MockInstance<(packet: OscPacket) => void>;
} {
  const sent: OscMessage[] = [];
  const send = vi.spyOn(oscClient, "send").mockImplementation((packet) => {
    const msg = packet as OscMessage;
    sent.push(msg);
    autoRespond(msg);
  });
  let nextId = FIRST_NODE_ID;
  vi.spyOn(oscClient, "nextNodeId").mockImplementation(() => nextId++);
  vi.spyOn(oscClient, "sessionGroupId", "get").mockReturnValue(SESSION_GROUP);
  return { sent, send };
}
