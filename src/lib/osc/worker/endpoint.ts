/** Composition seam shared by the real worker entry and the synchronous test loopback. */
import { MessageDispatcher } from "../protocol/dispatcher";
import {
  bannerMessage,
  closedMessage,
  logMessage,
  openMessage,
  replyErrorMessage,
  replyOkMessage,
  scopeChunkMessage,
  statusMessage,
} from "../protocol/messages";
import type { ProtocolPort } from "../protocol/port";
import type { OscCommand, OscRequest } from "@/types/osc";
import { OscClient } from "./OscClient";
import type { WorkerTransport } from "./transport";

const post = (port: ProtocolPort, built: { msg: unknown; transfer?: Transferable[] }) =>
  port.postMessage(built.msg, built.transfer);
export function createOscEndpoint(port: ProtocolPort, transport?: WorkerTransport): OscClient {
  const client = new OscClient(
    {
      open: () => post(port, openMessage()),
      closed: (code, reason) => post(port, closedMessage(code, reason)),
      log: (entries) => post(port, logMessage(entries)),
      banner: (address, message, variant) => post(port, bannerMessage(address, message, variant)),
      status: (status) => post(port, statusMessage(status)),
      scopeChunk: (subId, chunk) => post(port, scopeChunkMessage(subId, chunk)),
    },
    transport,
  );
  const dispatcher = new MessageDispatcher<OscRequest | OscCommand>();
  const rpc =
    <T extends OscRequest>(handler: (msg: T) => Promise<unknown>) =>
    (msg: T) => {
      void handler(msg).then(
        (result) => post(port, replyOkMessage(msg.id, result)),
        (error) =>
          post(
            port,
            replyErrorMessage(msg.id, error instanceof Error ? error.message : String(error)),
          ),
      );
    };
  dispatcher.register(
    "connect",
    rpc((m) => client.connect(m.url, m.session)),
  );
  dispatcher.register(
    "createGroup",
    rpc((m) => client.createGroup(m.targetId)),
  );
  dispatcher.register(
    "createSynth",
    rpc((m) => client.createSynth(m.defName, m.targetId, m.controls, m.arrayControls)),
  );
  dispatcher.register(
    "sendSynthDef",
    rpc((m) => client.sendSynthDef(m.bytes)),
  );
  dispatcher.register("setControl", (m) => client.setControl(m.nodeId, m.name, m.value));
  dispatcher.register("setControln", (m) => client.setControln(m.nodeId, m.name, m.values));
  dispatcher.register("setNodeRun", (m) => client.setNodeRun(m.nodeId, m.flag));
  dispatcher.register("freeSynth", (m) => client.freeSynth(m.nodeId));
  dispatcher.register("freeGroup", (m) => client.freeGroup(m.groupId));
  dispatcher.register("freeSynthDef", (m) => client.freeSynthDef(m.name));
  dispatcher.register("subscribeScope", (m) =>
    client.subscribeScope(m.subId, m.scope, m.channels, m.chunkSize),
  );
  dispatcher.register("unsubscribeScope", (m) => client.unsubscribeScope(m.subId));
  dispatcher.register("sendDirt", (m) => client.sendDirt(m.event, m.timetag));
  dispatcher.register("close", () => client.close());
  port.onMessage((msg) => dispatcher.dispatch(msg as OscRequest | OscCommand));
  return client;
}
