# `src/osc` (+ `src/worker`) — the OSC transport subsystem

How the app talks OSC to the SuperCollider/Strudel server. Split across two folders:

- **`src/worker/`** — a generic, OSC-unaware **byte transport** that runs the
  WebSocket **off the main thread** in a Web Worker (connect / send / receive raw
  frames). No osc-js here.
- **`src/osc/`** — the **OSC layer** on top: the `OscClient` seam + the client that
  owns the OSC protocol (encode outbound, decode inbound). Depends on `src/worker/`;
  the dependency only ever points that way.

The whole thing sits behind one interface (`OscClient`) that can also be backed by
a `worker_threads` worker so the controllers run **headlessly in Node tests**.

The app code only ever touches `OscClient` (`sendCommand` / `onReply` /
`onError` / `onScopeChunk`). Everything else here is how that interface is
fulfilled in each environment.

## Layer stack (each box has one job; deps point downward)

```
SessionManager (src/session)           orchestrates a session; depends only on ↓
        │
   OscClient (OscClient.ts)            the seam — ready/sendCommand/onReply/onError/onScopeChunk/dispose
        │
        └── WorkerOscClient            the only implementation. OWNS the OSC protocol:
              encodes outbound, decodes inbound (decodeFrame), sends connect/disconnect.

——————————————— the worker boundary (WorkerOscClient ⇄ the relay) ———————————————
   WorkerOscClient.ts  ⇄  [postMessage: raw bytes]  ⇄  transportWorker.ts (runTransportWorker)
        uses WorkerHandle                                 uses MessageEndpoint
                    └── both built by fromEventTarget / fromEventEmitter (messageEndpoint.ts)
                        over the env's worker object (Worker / self / parentPort)
        message shapes: protocol.d.ts  (connect/send/disconnect ↑ / open/message/error/closed ↓)

——————————————————————————— inside the worker ———————————————————————————
   transport.ts (createOscTransport)   a WebSocket: one binary frame in, one out. No OSC.
                                        (the worker imports nothing OSC — no osc-js here)
```

OSC encode/decode happens *above* the boundary: `WorkerOscClient.sendCommand`
calls `encode`, and on each inbound `message` it calls `decodeFrame` (both from
the main-thread `@sc-app/server-commands`). The worker only moves bytes.

## Files

**`src/worker/` — the byte transport (OSC-unaware):**

| file | responsibility |
|---|---|
| `transport.ts` | raw WebSocket: binary in/out, `ready`/`close`. WHATWG API → runs in a browser Worker *and* Node 22. |
| `protocol.d.ts` | the raw byte protocol: `MainToWorker` (connect/send/disconnect), `WorkerToMain` (open/message/error/closed). No OSC types. |
| `messageEndpoint.ts` | `MessageEndpoint<Send,Receive>` (post + onMessage), `WorkerHandle` (+ onError + terminate), and `fromEventTarget` / `fromEventEmitter` — adapt a browser `EventTarget` or a node `EventEmitter` to those interfaces |
| `transportWorker.ts` | `runTransportWorker(endpoint)` — the relay that runs *inside* the worker: drives a `transport` from `MainToWorker`, posts raw frames back as `WorkerToMain`. |
| `worker.ts` | browser worker entry — `runTransportWorker(fromEventTarget(self))`. No osc-js, no `window` shim. |

**`src/osc/` — the OSC layer:**

| file | responsibility |
|---|---|
| `OscClient.ts` | the interface the app/controllers depend on (+ listener types & factory type) |
| `decodeFrame.ts` | `decodeFrame(bytes)` — main-thread OSC decode: `/scope/chunk` → `Float32Array`, else flattened `OscReply`s. Hosts the `OscReply` type. |
| `WorkerOscClient.ts` | the main-thread handle: owns the OSC protocol (connect/disconnect, encode, decodeFrame) and fans replies out to listeners. `createBrowserWorkerClient` spawns the Vite Worker. |
| `listenerGroup.ts` | tiny add/emit/clear fan-out the client uses, one group per event |

(The Node client/entry — `createNodeWorkerClient`, `nodeWorkerEntry` — live in
`test/clients/`, since they're test-only.)

## Trace a message each way (browser)

**Outbound** — `session.send(packet)`:
```
SessionManager.send → WorkerOscClient.sendCommand → encode(packet)=bytes   [main thread]
  → worker.postMessage({type:"send", bytes})
══ worker ══ runTransportWorker → transport.ws.send(bytes) → server
```

**Inbound** — a scope frame:
```
══ worker ══ ws message(bytes) → transport.onMessage
  → posts {type:"message", bytes}   (transferring bytes.buffer, zero-copy)
══ main ══ WorkerOscClient.handle → decodeFrame(bytes) → /scope/chunk → Float32Array
  → scopeChunks.emit → ScopeController.chunkRef
```

## The 2×2 environment split

The boundary has two sides; each comes in a browser (`EventTarget`) and a node
(`EventEmitter`) flavor. The four spots where a real worker object is wrapped:

| | browser (EventTarget) | node (EventEmitter) |
|---|---|---|
| **main side** → `WorkerHandle` | `createBrowserWorkerClient`: `fromEventTarget(Worker)` + onError/terminate | `createNodeWorkerClient`: `fromEventEmitter(Worker)` + onError/terminate |
| **worker side** → `MessageEndpoint` | `worker.ts`: `fromEventTarget(self)` | `nodeWorkerEntry.ts`: `fromEventEmitter(parentPort)` |

The two adapters absorb the `addEventListener`-vs-`.on` difference, so
`WorkerOscClient` and `runTransportWorker` are each written once.

## Why these seams exist

- **`OscClient` seam** — the controllers don't know whether there's a worker; that's
  what lets the same code run in the browser and in headless Node tests.
- **The worker is OSC-unaware** — a generic WebSocket-over-postMessage relay. All OSC
  knowledge (encode + `decodeFrame`) lives on the main thread in `WorkerOscClient`,
  so the worker pulls in no osc-js and the protocol is pure bytes. The trade: the
  scope `Float32Array` is allocated on the main thread (~47 cheap frames/s).
- **`transport` is OSC-free** — a reusable, independently testable WebSocket pipe.

## Tests

`test/client.test.ts` runs the suite over the `worker_threads` client against an
in-process mock bridge: the mock emits raw OSC bytes, the relay forwards them, and
`decodeFrame` on the client turns the scripted `/scope/chunk` into `chunkRef`.
`test/scenarios/*` are opt-in `tsx` runs against the real Rust `serve` + a fake
scsynth.
