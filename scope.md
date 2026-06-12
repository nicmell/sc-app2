# The scope pipeline — scsynth SHM → bridge → `<sc-scope>`

How audio on a scsynth bus becomes a waveform on a dashboard canvas, with no
`/b_getn` round-trips: a `ScopeOut2` tap synth writes into scsynth's
shared-memory scope buffers, the Rust bridge mmaps that segment and polls it,
and the frontend receives `/scope/chunk` OSC messages over the session
WebSocket. Companion docs: `architecture.md` (the full-stack picture),
`src/lib/osc/README.md` (transport), `src/sc-elements/README.md` (elements).

```
scsynth                      Rust bridge                      browser
───────                      ───────────                      ───────
ScopeOut2 (tap synth)        mmap of the Boost SHM segment    <sc-scope>
  └─ writes scope_buffer[i]    └─ ScopeSubscription.poll()      └─ load(): tap +
     (triple-buffered slots)      every 5 ms per subId             slot + subscribe
        ║ shared memory              │ fresh _stage? copy slot       │
        ╚════════════════════════════╡ /scope/chunk (WS binary) ─────┤ onScopeChunk
                                     │                               └─ chunkRef → RAF
```

## 1. scsynth level

### The shared-memory segment

scsynth creates a Boost.Interprocess managed shared-memory segment at boot,
named after its UDP port:

- **macOS**: `/tmp/boost_interprocess/SuperColliderServer_<port>` (a regular
  file Boost mmaps)
- **Linux**: `/dev/shm/SuperColliderServer_<port>` (POSIX `shm_open`)

The segment holds the control buses and **128 `scope_buffer` instances**
(`src-tauri/src/core/scope/layout.rs` pins this count as
`EXPECTED_SCOPE_BUFFER_COUNT`; `core/blocks.rs` mirrors it as
`SCOPE_BUFFER_COUNT`). The buffers are scattered by Boost's allocator; a
`bi::vector<offset_ptr<scope_buffer>>` inside the segment is the index → buffer
map. All pointers in the segment are Boost `offset_ptr`s — self-relative
offsets (`target = field_address + stored_offset`, with the stored value `1`
meaning null), which is what makes the segment readable from another process
at a different base address.

### `scope_buffer` layout (SuperCollider's `common/scope_buffer.hpp`)

```cpp
class scope_buffer {
    atomic<int> _status;        // 4B @ 0   free=0 | initialized=1
    unsigned int _size;         // 4B @ 4   max frames per slot
    unsigned int _channels;     // 4B @ 8
    offset_ptr<float> _data;    // 8B @ 16  the backing allocation
    atomic<int> _stage;         // 4B @ 24  most-recently-COMPLETED slot (0|1|2)
    int _in;                    // 4B @ 28  the writer's current slot
    int _out;                   // 4B @ 32  the (in-process) reader's slot
    struct data_desc {          // _state[3] @ 40, stride 16
        offset_ptr<float> data; // 8B @ +0  this slot's float region
        unsigned int frames;    // 4B @ +8  frames currently in the slot
        atomic<bool> changed;   // 1B @ +12 (+padding)
    } _state[3];
};
```

This is a **triple buffer**: the writer (the `ScopeOut2` UGen) fills the
`_in` slot sample by sample; once `scopeFrames` frames have accumulated it
*pushes* — swapping `_in` with `_stage`, so `_stage` always names the
most-recently-completed slot and the writer continues into the slot that was
previously staged. SuperCollider's own IDE reader takes the third role
(swapping `_out` with `_stage` under the `changed` flag); **our bridge reader
deliberately does not** — see §3.

### The tap: `ScopeOut2`

`ScopeOut2.ar(inputArray, scopeNum, maxFrames, scopeFrames)` acquires
`scope_buffer[scopeNum]`, configures it (`_size = maxFrames`,
`_channels = len(inputArray)`), and writes the inputs **planar** into the
slots — one contiguous run per channel, channel `c` at byte offset
`c × _size × 4` within the slot (verified empirically: a stereo sine/saw tap
shows the sine in the first `frames` floats and the saw in the next; the
"interleaved lanes" of the same chunk correlate at 0.99, i.e. they are
adjacent samples of one waveform). Because our taps bake
`maxFrames = scopeFrames`, the per-channel stride equals the chunk's frame
count and the slot is exactly `frames × channels` contiguous floats.
It must run at **audio rate** — a control-rate ScopeOut2
writes one value per 64-sample block and the scope looks frozen. When the
synth is freed, the buffer is released (`_status` back to free).

The app's tap synthdef is compiled in the browser
(`src/lib/scope/scopeTapSynthDef.ts`) per `(channels, chunkSize)` pair and
cached by name:

```
name:      scopeTap<channels>ch_<chunkSize>        e.g. scopeTap2ch_1024
graph:     In.ar(inBus, channels) → ScopeOut2.ar(sigs, scopeNum, chunkSize, chunkSize)
controls:  inBus (first bus to read), scopeNum (the SHM slot index)
```

Two conventions are load-bearing:

- **One slot = one chunk**: `maxFrames = scopeFrames = chunkSize` (1024, from
  `SCOPE_CHUNK_SIZE` in `src/constants/osc.ts`), so every push completes
  exactly one displayable chunk (~21 ms at 48 kHz → ~47 pushes/s).
- **Channels are baked into the def** (the `In.ar` width and the ScopeOut2
  input array), while `inBus`/`scopeNum` stay synth controls — one def per
  channel count serves any bus and any slot.

The tap synth is created at the **tail of the session group**, so it reads
the bus after everything mounted at that moment has written it (`In.ar` sees
only same-cycle content written by earlier nodes). Caveat: plugin groups
mounted *later* append after the tap, so a master-out tap won't see them
until it is re-created (e.g. by a reconnect). SuperDirt's nodes live before
the session group in the root, so the master out always scopes Strudel.

## 2. Session conventions: scope-slot spans

Each session (one per browser tab / WebSocket) owns an **aligned span of 8
SHM slots** out of the 128 (`SCOPE_SPAN`, `src-tauri/src/core/blocks.rs`):
`base = ((sessionIndex - 1) * 8) % 128` — 16 concurrent sessions before spans
wrap onto each other (the same accepted collision model as the node-id wrap).
A compile-time guard pins that the span divides the pool, so a span never
straddles the boundary.

The span travels in the session payload (`scopeIndexBase` /
`scopeIndexCount`, `src-tauri/src/core/router/session.rs` →
`src/types/api.d.ts`), and the frontend allocates one slot per mounted
`<sc-scope>` from it (`oscClient.allocScopeIndex()` — a free-list allocator,
re-armed on every connect; freed slots are reused, and exhaustion past 8
live scopes throws). The bridge **enforces** the span: a `/scope/subscribe`
naming a slot outside the session's block is logged and ignored
(`SessionBlock::owns_scope_index`, gated in `SessionScopes::subscribe`).

## 3. The bridge (`src-tauri/src/core/scope/`, `core/router/ws.rs`, `core/server.rs`)

### Opening the segment

`Server::scope_shm()` lazily mmaps the segment (read-only, `MAP_SHARED`) on
the first subscribe and caches it per **scsynth registration generation** —
a scsynth restart recreates the segment, so the cache is invalidated when
the supervisor re-registers (an old mapping points at a dead inode). A
failure (scsynth without SHM support, file missing) is cached within the
generation so repeated subscribes don't spam errors; subscriptions then
exist but stream nothing.

`find_scope_buffer_array` locates the index vector heuristically: it scans
the segment for `scope_buffer`-shaped structures (`_status` ∈ {0,1} and the
`(_stage,_in,_out)` triple a permutation of {0,1,2} — true from boot, the
constructors initialize them), then finds the longest run of consecutive
8-byte `offset_ptr`s resolving to one of them. That run **is** the
`bi::vector` data array, giving `slot index → absolute byte offset`.

### Reading a slot (non-mutating)

The bridge reader is **read-only by construction** (PROT_READ): it cannot
take the triple buffer's reader role (no `_out` swap, no `changed`
handshake). Instead it samples `_stage` and copies `_state[stage]`:

1. `read_scope_stage` — a 4-byte peek of `_stage`. If it equals the value at
   the last emitted chunk, nothing new completed → done (the cheap common
   case, ~99% of polls).
2. `read_scope_slot` — re-checks `_status`/`_size`/`_channels`, resolves
   `_state[stage].data` by offset_ptr math, bounds-checks
   `frames × channels × 4` against the segment, and memcpys the slot's raw
   native-endian bytes out (the wire encoder byte-swaps them to big-endian
   in its single pass).

Consequences of being a non-participant reader:

- **Cross-process ordering is explicit**: `_status` and `_stage` are read
  with acquire loads (`MmapRegion::read_i32_acquire`), pairing with the
  writer's C++ release stores — the published slot's samples and header are
  guaranteed visible after the load, on weakly-ordered hosts too (Apple
  Silicon), not just by x86 habit.
- **Freshness detection is `_stage` equality**, not the `changed` flag.
- **Torn reads are detected, not prevented**: a push swaps `_in` ↔ `_stage`,
  so the slot being copied becomes the writer's next target — a push landing
  during the ~µs copy could mix two chunks' samples. `read_scope_slot`
  therefore re-reads `_stage` after the copy and discards the data when it
  moved (`NoData` — the next 5 ms poll emits the freshly completed slot
  instead). Vanishingly rare in practice (pushes are ~21 ms apart), and the
  cost of the guard is one extra 4-byte read.

### Per-WebSocket subscriptions and the poll pump

All the per-session scope state lives on one type, `scope::SessionScopes` —
the subId-keyed subscriptions (one per mounted `<sc-scope>`), the span-gated
subscribe/unsubscribe frame handling, and the latest-only chunk staging. The
WS task **owns** it (a session lives exactly as long as its socket, so the
state needs no locking and drops with the task); `core/router/ws.rs` itself stays
pure transport — it only peeks addresses to claim `/scope/*` frames and
ferries bytes. A 5 ms `tokio::interval` arm (gated on `is_active()`) runs
`poll()`: a `_stage` peek per subscription, with only fresh slots paying the
copy + encode. Chunks ride the same binary WS frames as every other OSC
reply, but **never delay them**: `poll()` only stages encoded frames into a
latest-only pending map (a newer chunk replaces an unsent older one — chunks
are disposable, control replies are not), and a `biased` select drains one
pending chunk per pass, ranked beneath uplink commands and bridge replies —
so a slow socket degrades the scope's frame rate, never the
`/n_go`/`/synced` acks the load pass gates on.

`/scope/subscribe` and `/scope/unsubscribe` are **bridge-internal**: the WS
pump claims them by address peek before bridge dispatch — they are never
routed to a UDP peer. Subscribing an existing subId replaces the
subscription (fresh `_stage` cursor); unsubscribing an unknown subId is a
logged no-op (normal when racing a socket close).

Each `ScopeSubscription` tracks: `last_stage` (freshness cursor, `-1` until
the first frame), `tick` (a monotonic per-subscription chunk counter echoed
to the client), and the shared `Arc<ScopeShm>`.

## 4. Wire protocol (the cross-language contract)

Defined twice, kept in sync by a golden test
(`scope/mod.rs::encode_scope_chunk_round_trips_with_be_blob` ↔
`packages/server-commands/src/commands/scope.ts`):

| message | args | direction | notes |
|---|---|---|---|
| `/scope/subscribe` | `subId:i32, scope:i32, channels:i32, chunkSize:i32` | client → bridge | `scope` is the SHM slot index (validated against the session span). `channels`/`chunkSize` are **informational** — the SHM header carries the real counts; the tap def bakes the requested ones. |
| `/scope/unsubscribe` | `subId:i32` | client → bridge | drops that subscription only |
| `/scope/chunk` | `subId:i32, tickIndex:i32, isGap:i32, channels:i32, data:blob` | bridge → client | one completed slot |

Blob format: `frames × channels` IEEE-754 **float32, big-endian**,
**planar** (`L L … L R R … R` — the SHM slot's own layout, passed through
verbatim; the renderer indexes `data[c * frames + i]`). Big-endian for
consistency with OSC's
`,f` type; the client byte-swaps in `decodeBlobFloatsBE` (the blob arrives
as raw bytes — a host-native `Float32Array` view would be wrong on LE
hosts... and is exactly why the swap is explicit). `frameCount` is derived
from the blob length, never trusted from a header.

Conventions:

- **`subId`** is minted by the client (`OscClient.subscribeScope`),
  **monotonically per connection and never reused**, so a late chunk from a
  torn-down subscription can never be misattributed to a new one. The bridge
  treats it as an opaque key and echoes it on every chunk.
- **`tickIndex`** is the bridge's per-subscription chunk counter
  (diagnostics/ordering; the client currently ignores it).
- **`isGap` is reserved**: the bridge always sends `0`. It was meant to flag
  missed slots, but the `_stage` cursor can't detect them: with no
  participating reader (no `_out` rotation), a push only ever swaps `_in` ↔
  `_stage`, so `_stage` **alternates between two slot values** — an even
  number of pushes between two polls reads as "no change" (chunks silently
  skipped), an odd number as one. At a 5 ms poll vs ~21 ms push cadence
  that needs a ≥40 ms stall; harmless for a live view.

## 5. The frontend (`src/lib/osc/OscClient.ts`, `src/sc-elements/widgets/sc-scope.ts`)

`OscClient` is the elements' entire scope vocabulary:

- `allocScopeIndex()` / `freeScopeIndex(i)` — the span free-list (armed on
  connect from the session payload).
- `subscribeScope(scope, channels, chunkSize, onChunk): { subId, off }` —
  one call wires the whole stream: the handler is registered under the
  minted subId *before* the subscribe is sent (no arrival race), and `off`
  both drops it and sends `/scope/unsubscribe`. `/scope/chunk` is decoded
  **once** in `handleReply` (`parseScopeChunkArgs`) and dispatched by subId
  (a map lookup, no fan-out filtering); the message is kept out of the
  console log (it streams at ~47 Hz per scope). `handleReply` is also the
  unit-test seam — tests feed chunks straight into it. The handler map is
  cleared on connect (fresh subId space).

### `<sc-scope>` props

Tap props (change what scsynth runs — the def is compiled per
`(channels, frames)`):

| prop | default | meaning |
|---|---|---|
| `bus` | `0` | first audio bus the tap reads (0 = master out L) |
| `channels` | `2` | consecutive buses read from `bus`; also the lane count |
| `frames` | `1024` (≤ 16384) | samples per chunk = the visible window (`frames/sampleRate` seconds). The slot completes — and the view refreshes — at the inverse rate, so bigger windows page rather than flow; the SHM slot is allocated at this size, hence the ceiling |

Display props (renderer-only — the tap, wire and bridge are untouched; all
enforced by the element's `validate()`):

| prop | default | meaning |
|---|---|---|
| `trigger` | `auto` | the scope-literature trigger mode. A free-running scope draws each chunk from sample 0, so the trace's phase drifts (or ghosts into N superimposed copies at near-rational `freq × frames / sampleRate`). Triggered modes pin the drawn window to a level crossing instead: `auto` = trigger when a crossing is found, free-run the chunk otherwise; `normal` = hold the last *triggered* trace otherwise (clean for periodic signals, freezes on silence); `off` = always free-run |
| `slope` | `rising` | trigger slope: the crossing direction |
| `level` | `0` | trigger level: the threshold to cross (sample units, pre-`gain`) |
| `gain` | `1` | vertical scale: sample × gain maps ±1 to the lane height (a 0.9 padding stays internal); over-gained lanes clip in `split`, overflow in `overlay` |
| `layout` | `overlay` | `overlay` superimposes all lanes around one midline; `split` stacks per-channel bands, each with its own zero line and clip rect |

Trigger internals (`src/lib/scope/trigger.ts`, pure + unit-tested): the
**source is lane 0** — all lanes draw at the found offset so they stay
time-aligned, like a bench scope sweeping every channel off ch 1. The search
uses the chunk's **first quarter as headroom** and displays the remaining ¾
from the crossing, so a trigger exists only for periods ≤ `frames/4` samples
(at 1024/48 kHz: ≥ ~187 Hz — raise `frames` to lock lower pitches). A fixed
**hysteresis** (±0.02 full-scale) arms the trigger — the signal must retreat
past the margin before a crossing fires — so noise riding near the level
can't false-trigger. `off` draws the full `frames`; triggered modes draw
¾ × `frames`, in both fallback and pinned traces, so the time scale doesn't
jump between chunks.

### Lifecycle

`<sc-scope>` owns the tap through the element load pass:

```
load():   slot = allocScopeIndex()
          sendSynthDef(scopeTap<channels>ch_1024)        → awaits /synced
          tap = createSynth(def, sessionGroup tail,
                            { inBus: bus, scopeNum: slot }) → awaits /n_go
          stream = subscribeScope(slot, channels, 1024,
                                  chunk → chunkRef.current)

unload(): stream.off()   [drops the handler + /scope/unsubscribe]
          freeSynth(tap); freeScopeIndex(slot); chunkRef.current = null
```

Because this rides the standard load/unload pass, taps re-arm automatically
across disconnect/reconnect (fresh slot, fresh subId, fresh tap in the new
session group), and the teardown sends drop harmlessly on a dead socket.
A canvas RAF loop draws `chunkRef.current` (devicePixelRatio-scaled,
per-channel polylines); it runs for the element's whole DOM lifetime,
independent of the OSC lifecycle.

## 6. End-to-end trace

```
<sc-scope bus="0" channels="2"> mounts (plugin load pass)
  → allocScopeIndex() = 8                        [session span 8..16]
  → /d_recv scopeTap2ch_1024 + /sync N           → /synced N
  → /s_new scopeTap2ch_1024 <id> 1 <sessionGroup> inBus 0 scopeNum 8 → /n_go
  → /scope/subscribe 1 8 2 1024                  [bridge: span check → insert]

every ~21 ms (scsynth):  ScopeOut2 fills a slot → push → _stage advances
every 5 ms   (bridge):   peek _stage[8] → fresh? copy slot → encode BE blob
                         → /scope/chunk 1 <tick> 0 2 <8 KB blob>  (WS binary)
on arrival   (client):   handleReply → parseScopeChunkArgs → onScopeChunk
                         → subId 1 matches → chunkRef.current = chunk
next RAF     (client):   canvas redraw

unmount / disconnect:
  → /scope/unsubscribe 1   [bridge: remove from map]
  → /n_free <tap>          [ScopeOut2 released → slot _status = free]
  → slot 8 back to the free list (reused by the next mount; subIds are not)
```

## 7. Known limitations & deliberate trade-offs

- **Identical taps are not shared**: every `<sc-scope>` owns its own tap,
  so two elements watching the same `(bus, channels)` — e.g. two boxes both
  scoping the master out — run two ScopeOut2 synths, two SHM slots, and two
  chunk streams of identical samples. Deliberate: a refcounted share keyed
  by `(bus, channels)` would halve that, but it reintroduces exactly the
  shared-controller lifecycle the per-element design removed (who frees the
  tap, who survives whose unload). Revisit only if real dashboards show
  duplicate taps are common; the budget (8 slots/session) prices the
  duplication in.
- **Tap ordering**: a master-out tap created before later plugin mounts
  won't hear them (node-tree order); re-created on reconnect, or remount the
  scope's plugin.
- **Span wrap**: session 17 reuses session 1's slots (as before, when slot 1
  was reused by session 129).
- **scsynth without SHM** (e.g. supernova differences, exotic builds): the
  bridge logs `scope SHM unavailable` once per registration and the scope
  stays dark; everything else works.
