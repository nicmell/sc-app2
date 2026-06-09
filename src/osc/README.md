# `src/osc` — the OSC transport subsystem

How the app talks OSC to the SuperCollider/Strudel server: a WebSocket + all OSC
encode/decode, run **off the main thread** in a Web Worker, behind an interface
(`OscClient`) that can also be backed by an in-process or `worker_threads` client
so the controllers run **headlessly in Node tests**.

The app code only ever touches `OscClient` (`sendCommand` / `onReply` /
`onError` / `onScopeChunk`). Everything else here is how that interface is
fulfilled in each environment.

## Layer stack (each box has one job; deps point downward)

```
SessionManager (src/lib/sessions)      orchestrates a session; depends only on ↓
        │
   OscClient (OscClient.ts)            the seam — ready/sendCommand/onReply/onError/onScopeChunk/dispose
        │
        └── WorkerOscClient            the only implementation — real Worker, browser AND node worker_threads

——————————————— the worker boundary (only WorkerOscClient crosses it) ———————————————
   WorkerOscClient.ts  ⇄  [postMessage]  ⇄  oscWorkerMain.ts (runOscWorker)
        uses WorkerHandle                       uses MessageEndpoint
                    └── both built by fromEventTarget / fromEventEmitter (messageEndpoint.ts)
                        over the env's worker object (Worker / self / parentPort)
        message shapes: protocol.d.ts  (MainToWorker ↑ / WorkerToMain ↓)  [in src/types]

——————————————————————— inside the worker (or in-process) ———————————————————————
   bridge.ts (createOscBridge)         owns a transport + ALL OSC decode; talks via callbacks
        │
   transport.ts (createOscTransport)   a WebSocket: one binary frame in, one out. No OSC.
```

## Files

| file | responsibility |
|---|---|
| `OscClient.ts` | the interface the app/controllers depend on (+ the listener types & factory type) |
| `transport.ts` | raw WebSocket: binary in/out, `ready`/`close`. WHATWG API → runs in a browser Worker *and* Node 22. |
| `bridge.ts` | `createOscBridge(url, callbacks)` — owns a transport + OSC decode. `/scope/chunk` → `Float32Array` (`onScopeChunk`); everything else → flattened `OscReply`s (`onReply`). Knows nothing about workers. |
| `../types/protocol.d.ts` | the two postMessage message shapes: `MainToWorker` (connect/send/disconnect), `WorkerToMain` (ready/reply/scopeChunk/error/closed) |
| `messageEndpoint.ts` | `MessageEndpoint<Send,Receive>` (post + onMessage), `WorkerHandle` (+ onError + terminate), and `fromEventTarget` / `fromEventEmitter` — adapt a browser `EventTarget` or a node `EventEmitter` to those interfaces |
| `oscWorkerMain.ts` | `runOscWorker(endpoint)` — the code that runs *inside* the worker: drives a bridge from `MainToWorker`, posts `WorkerToMain` back |
| `WorkerOscClient.ts` | the main-thread handle: posts `MainToWorker`, fans `WorkerToMain` out to listeners. `createBrowserWorkerClient` spawns the Vite Worker. |
| `worker.ts` | browser worker entry — `runOscWorker(fromEventTarget(self))` (+ the osc-js `window` shim) |
| `listenerGroup.ts` | tiny add/emit/clear fan-out the clients use, one group per event |

(The Node client/entry — `createNodeWorkerClient`, `nodeWorkerEntry` — live in
`test/clients/`, since they're test-only.)

## Trace a message each way (browser)

**Outbound** — `session.send(packet)`:
```
SessionManager.send → WorkerOscClient.sendCommand → encode(packet)=bytes
  → worker.postMessage({type:"send", bytes})
══ worker ══ runOscWorker → bridge.send(bytes) → transport.ws.send → server
```

**Inbound** — a scope frame:
```
══ worker ══ ws message(bytes) → transport.onMessage → bridge decode → /scope/chunk → Float32Array
  → runOscWorker posts {type:"scopeChunk", chunk}   (transferring chunk.data.buffer, zero-copy)
══ main ══ WorkerOscClient.onMessage → handle → scopeChunks.emit → ScopeController.chunkRef
```

## The 2×2 environment split

The boundary has two sides; each comes in a browser (`EventTarget`) and a node
(`EventEmitter`) flavor. The four spots where a real worker object is wrapped:

| | browser (EventTarget) | node (EventEmitter) |
|---|---|---|
| **main side** → `WorkerHandle` | `createBrowserWorkerClient`: `fromEventTarget(Worker)` + onError/terminate | `createNodeWorkerClient`: `fromEventEmitter(Worker)` + onError/terminate |
| **worker side** → `MessageEndpoint` | `worker.ts`: `fromEventTarget(self)` | `nodeWorkerEntry.ts`: `fromEventEmitter(parentPort)` |

The two adapters absorb the `addEventListener`-vs-`.on` difference, so
`WorkerOscClient` and `runOscWorker` are each written once.

## Why these seams exist

- **`OscClient` seam** — the controllers don't know whether there's a worker; that's
  what lets the same code run in the browser and in headless Node tests.
- **`bridge` takes callbacks, not the worker protocol** — it stays a self-contained
  OSC core (transport + decode) that knows nothing about the worker boundary, so the
  worker runtime is a thin adapter over it and the bridge is independently testable.
- **`transport` is OSC-free** — a reusable, independently testable WebSocket pipe.

## Tests

`test/client.test.ts` runs the suite over the `worker_threads` client against an
in-process mock bridge (the faithful postMessage + transfer path the browser
client mirrors). `test/scenarios/*` are opt-in `tsx` runs against the real Rust
`serve` + a fake scsynth.
