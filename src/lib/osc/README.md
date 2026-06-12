# `src/lib/osc` — the OSC transport subsystem

How the app talks OSC to the SuperCollider/Strudel bridge. Built on
[osc-js](https://github.com/adzialocha/osc-js): one `OSC` instance does all
encode/decode/dispatch; a custom transport plugin rides the worker-backed
WebSocket transport (`src/lib/worker/`) so socket traffic stays off the main
thread.

## Layer stack (each box has one job; deps point downward)

```
SessionManager / sc-elements
        │   import { oscClient } — the global instance
   OscClient (OscClient.ts)            connect/close/send/on/off/status — mirrors the osc-js OSC class
        │   composes `new OSC({ plugin })`
   OscWorkerPlugin.ts            osc-js Plugin impl: adapts the transport's events onto
        │                              osc-js's `notify` (osc-js does all decode/dispatch)
        │   workerClient: WorkerTransport — { open, close, send, onEvent, status }
   ../worker/WorkerClient.ts           the main-thread proxy: owns THE worker (spawned once,
        │                              in its constructor), tracks status, relays the protocol
        │   postMessage (types/osc.d.ts): TransportCommand ↓ / TransportEvent ↑
   ../worker/worker.ts                 the Web Worker entry — wires the protocol to the transport
        │   createWsTransport(): WorkerTransport — the same interface, in-worker
   ../worker/transport.ts              the raw WebSocket: binary frames in/out
```

## Files

| file | responsibility |
|---|---|
| `OscClient.ts` | the client class + the global `oscClient` instance. `connect(url)` resolves once the socket is open; `send(packet)` takes the `OSC.Message`/`OSC.Bundle` packets the `@sc-app/server-commands` constructors build (and logs each message as `tx`); `on(address, cb)` subscribes to inbound messages (osc-js address patterns, `*` for all) and to `'open'`/`'close'`/`'error'`. The client also **owns the OSC telemetry** — the app store's `osc` slice: the bounded tx/rx console log, the `/fail`–`/late` banners, scsynth's `/status.reply` load, and the `connected` signal the plugin lifecycle arms on — and **terminates its own connection** on a critical transport error or a missed `/status.reply` heartbeat (the SessionManager only observes the close). It is also the sc-elements' whole scsynth vocabulary: the sequenced command methods (createGroup/createSynth/sendSynthDef/…), the scope-slot allocator over the session's span, and the decoded `onScopeChunk` stream. |
| `OscWorkerPlugin.ts` | the osc-js transport plugin — a thin adapter: implements the Plugin contract over the `workerClient` singleton and maps its events onto `notify` — osc-js unpacks and dispatches inbound frames. |
| `../worker/WorkerClient.ts` | the `WorkerClient` class + the `workerClient` singleton — the main-thread proxy to the worker: spawns the one permanent worker in its constructor (at import time; connections come and go over it via open/close), tracks the status (numbering mirrors `OSC.STATUS`), and synthesizes the single `close` event on an orderly close. |
| `../worker/worker.ts` | Web Worker entry: wires the postMessage protocol to the in-worker transport (inbound frames transferred zero-copy). No osc-js here. |
| `../worker/transport.ts` | the shared `WorkerTransport` interface (`{ open, close, send, onEvent, status }`) + `createWsTransport()` — the raw `WebSocket`, running inside the worker; `open` silently disposes a previous socket, an orderly `close` emits no event (the client synthesizes it), and a real socket close carries its code/reason up for diagnostics. |
| `types/osc.d.ts` (in `@/types`) | the WorkerClient ⇄ worker protocol (`TransportCommand` / `TransportEvent`). |

## Trace a message each way

**Outbound** — `oscClient.send(packet)`:
```
oscClient.send (tx log) → OSC.send → packet.pack()                     [main thread]
  → plugin.send(bytes) → worker.postMessage({type:"send"}, transfer)
══ worker ══ ws.send(bytes) → bridge
```

**Inbound** — e.g. a `/scope/chunk`:
```
══ worker ══ ws message → postMessage({type:"message", data}, transfer)   (zero-copy)
══ main ══ plugin.notify(bytes) → osc-js unpacks + dispatches by address
  → handleReply → parseScopeChunkArgs → the sc-scopes' onScopeChunk
    subscribers (each filters on its own subId) → chunkRef
```

`/scope/chunk` is an ordinary OSC message — no special-casing anywhere in the
transport; the client decodes it once in `handleReply` and fans it out to the
`onScopeChunk` subscribers. Bundles are dispatched
per-element by osc-js (future timetags are honored with delayed dispatch).
