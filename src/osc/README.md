# `src/osc` — the OSC transport subsystem

How the app talks OSC to the SuperCollider/Strudel bridge. Built on
[osc-js](https://github.com/adzialocha/osc-js): one `OSC` instance does all
encode/decode/dispatch; a custom transport plugin runs the WebSocket in a Web
Worker so socket traffic stays off the main thread.

## Layer stack (each box has one job; deps point downward)

```
SessionManager / ScopeController / sc-elements
        │   import { oscClient } — the global instance
   OscClient (OscClient.ts)            connect/close/send/on/off/status — mirrors the osc-js OSC class
        │   composes `new OSC({ plugin })`
   WebsocketWorkerPlugin.ts            osc-js Plugin impl: relays packed bytes ⇄ the worker,
        │                              reports open/close/error through osc-js's `notify`
        │   postMessage (protocol.ts): {open url | send | close} ↓ / {open | message | error | close} ↑
   worker.ts                           the Web Worker that owns the WebSocket — a dumb byte relay
```

## Files

| file | responsibility |
|---|---|
| `OscClient.ts` | the client class + the global `oscClient` instance. `connect(url)` resolves once the socket is open; `send(packet)` takes the `OSC.Message`/`OSC.Bundle` packets the `@sc-app/server-commands` constructors build; `on(address, cb)` subscribes to inbound messages (osc-js address patterns, `*` for all) and to `'open'`/`'close'`/`'error'`. |
| `WebsocketWorkerPlugin.ts` | the osc-js transport plugin. Spawns the worker lazily on `open({url})`, forwards packed binary out, and feeds inbound frames to `notify` — osc-js unpacks and dispatches them. |
| `worker.ts` | Web Worker entry: owns the `WebSocket` (binary frames in/out, transferred zero-copy). No osc-js here. |
| `protocol.ts` | the plugin ⇄ worker message types. |

## Trace a message each way

**Outbound** — `session.send(packet)`:
```
SessionManager.send → oscClient.send → OSC.send → packet.pack()        [main thread]
  → plugin.send(bytes) → worker.postMessage({type:"send"}, transfer)
══ worker ══ ws.send(bytes) → bridge
```

**Inbound** — e.g. a `/scope/chunk`:
```
══ worker ══ ws message → postMessage({type:"message", data}, transfer)   (zero-copy)
══ main ══ plugin.notify(bytes) → osc-js unpacks + dispatches by address
  → ScopeController's on('/scope/chunk') → parseScopeChunkArgs → chunkRef
```

`/scope/chunk` is an ordinary OSC message — no special-casing anywhere in the
transport; consumers just subscribe to its address. Bundles are dispatched
per-element by osc-js (future timetags are honored with delayed dispatch).
