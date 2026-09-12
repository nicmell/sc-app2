# Audio clock, step 0+1: __global_clock__ da sc-startup + tick /tr come metronomo

## Contesto

Prima tranche di `AUDIO-CLOCK.md` (§6, passi 1-2 parziale): caricare la synth
`__global_clock__` dallo startup sclang e far diventare il suo `/tr` (SendTrig
id 4242, 20 Hz) il METRONOMO del main thread. L'estimatore resta sui
`/clock/sample` (ping a 50ms invariato — il pensionamento del ping è lo step 2,
fuori scope). Branch nuovo **`feat/audio-clock`** da main. Implementazione
interamente mia, nessuna delega ad altri modelli.

Decisioni fissate (erano aperte nel doc):
- **Frequenza 20 Hz** (50ms; margine 2× su zyklus 100ms).
- **Ownership: `scripts/sc-startup.scd`** (attach-mode; la synth vive in testa
  al root group 0, fuori dai session group e dai `gFreeAll`).
- **Payload: solo fase** (com'è nella fixture; l'indice serve allo step 3).
- **Switch DURO**: i callback passano ai tick senza fallback sui sample. Il
  runtime ora RICHIEDE la clock synth — chi gira con uno stack `yarn osc`
  vecchio vedrà header/strudel/autosave fermi finché non lo riavvia.
  Documentato, accettato (pre-release).

## Fatti verificati (scout, file:line)

- **`ADDR_TR = "/tr"` e `Tr { nodeId, triggerId, value }` esistono già**:
  `packages/server-commands/src/replies.ts:26,:38-43`, esportati dal barrel.
  Zero vocabolario nuovo.
- **`CLOCK_TRIGGER_ID`/`PHASE_BUS`/`SHARED_FRAMES` NON esistono in `src/`** —
  il commento "mirrored from src/constants/osc.ts" in
  `sclang_parity.ts:28` è falso: vivono solo nel package
  (fixtures.test.ts:12-14, sclang_parity.ts:29-31, sugar.test.ts:63,71
  hardcoded, e la reference sclang
  `examples/fixtures/global_clock_phase.scd:1-8` a 10 Hz).
- **sc-startup.scd** (47 righe): attach-mode via `s.doWhenBooted` (`:32`),
  `s.notify; s.sync;` a `:34-35`, mount StrudelDirt `:40-42`, failure callback
  `:44-46`. NESSUNA SynthDef oggi. Punto d'inserzione naturale: dopo `s.sync`
  (`:35`). In attach-mode la forma giusta è `.send(s)` (non `.add`).
- **Catena invocazione**: `start-osc.sh:107,115` → `start-strudeldirt.sh:110`
  `exec sclang -l $CONF sc-startup.scd`; **l'e2e usa lo stesso path**
  (`scripts/e2e/stack.mjs:128` boot di start-osc.sh) → la synth arriva
  gratis anche lì.
- **ClockSync.onSample** (`src/lib/clock/ClockSync.ts:80-102`): tre fasi —
  fold estimatore `:81-87`, publish throttled `:89-93`, loop listener
  `:95-101`.
- **OscClient.handleReply** (`src/lib/osc/OscClient.ts:439-467`): branch
  SAMPLE (early return), waiter (fall-through), SCOPE_CHUNK (early return).
  Nessun branch `/tr`.
- **logging.ts:13** `skippedRx` set per address; `:30` lo applica. Un `/tr` a
  20 Hz saturerebbe il log (300 entry) in 15s.
- `yarn parity` (`packages/synthdef-compiler/package.json:20`, tsx) byte-diffa
  la fixture TS contro `global_clock_phase.scd` — **cambiano insieme** (10→20).

## Modifiche

### 0a. `scripts/sc-startup.scd` — la synth
Dentro il blocco `doWhenBooted`, subito dopo `s.sync;` (`:35`), prima del
mount StrudelDirt:
```supercollider
// The global audio clock (AUDIO-CLOCK.md): the engine broadcasts its own
// timeline — Phasor phase on bus 1000, a 20 Hz /tr (id 4242) carrying the
// phase. Head of the root group: session groups sit at its tail and their
// teardown can never touch it.
SynthDef(\__global_clock__, {
    var phase = Phasor.ar(0, 1, 0, 8192, 0);
    Out.ar(1000, phase);
    SendTrig.kr(Impulse.kr(20, 0), 4242, A2K.kr(phase));
}).send(s);
s.sync;
Synth.new(\__global_clock__, nil, RootNode(s), \addToHead);
"global clock running (20 Hz, /tr id 4242)".postln;
```
Grafo identico alla fixture (Phasor→Out→A2K→Impulse→SendTrig), solo freq 20.

### 0b. Costanti — `src/constants/osc.ts`, blocco nuovo "audio clock"
```ts
/** SendTrig id of the __global_clock__ synth (scripts/sc-startup.scd) —
 *  its /tr ticks are the main thread's metronome. Mirrored by the
 *  synthdef-compiler parity fixture. */
export const CLOCK_TRIGGER_ID = 4242;
/** The clock synth's tick rate. Must stay at or below HALF the finest
 *  subscribeClock interval (zyklus asks for 100 ms). Owner of the value:
 *  sc-startup.scd's Impulse.kr — keep in lockstep. */
export const CLOCK_TICK_FREQ_HZ = 20;
```
(PHASE_BUS/SHARED_FRAMES NON entrano in src — nessun consumer app in questo
step; niente costanti morte.)
Aggiornare il commento di `CLOCK_PING_INTERVAL_MS:33-38`: NON è più "anche il
metronomo" — solo cadenza dell'estimatore (il riferimento a zyklus migra sul
commento di `CLOCK_TICK_FREQ_HZ`).

### 0c. Fixture parity 10→20
- `sclang_parity.ts:78` `freq(10)`→`freq(20)`; `:28` commento corretto (il
  mirror è `src/constants/osc.ts` ORA per trigger id e freq — nota che il
  package resta standalone, quindi duplicato consapevole con pointer).
- `examples/fixtures/global_clock_phase.scd:6` `Impulse.kr(10,0)`→`(20,0)`.
- `fixtures.test.ts` / `sugar.test.ts`: aggiornare ogni 10 Hz del global
  clock (grep nel package).

### 1a. `src/lib/clock/ClockSync.ts` — tick = metronomo
- Estrarre il loop listener (`:95-101`) in `private runListeners(now)`.
- `onSample` = SOLO estimatore + publish (perde il loop).
- Nuovo `onTick(): void` — `this.runListeners(Date.now())`. Doc comment: il
  metronomo è il tick del motore audio; i sample restano la misura.
- Header comment del modulo aggiornato (sample = misura, tick = metronomo).

### 1b. `src/lib/osc/OscClient.ts` — routing `/tr`
Nuovo branch in `handleReply`, PRIMA dei waiter, accanto al branch SAMPLE:
```ts
if (reply.address === ADDR_TR && Tr.triggerId(reply) === CLOCK_TRIGGER_ID) {
  this.clock.onTick();
  return;
}
```
`/tr` con altri id CADE ai waiter (i plugin possono `once(ADDR_TR, …)`).
Import: `ADDR_TR`, `Tr` (server-commands), `CLOCK_TRIGGER_ID` (constants).
Doc comment di `subscribeClock:411`: callback azionati dal tick del motore.

### 1c. `src/lib/osc/middlewares/logging.ts` — skip mirato
Il set per-address non basta (solo il NOSTRO id va taciuto):
```ts
const skipRx = (m: OscMessage) =>
  skippedRx.has(m.address) || (m.address === ADDR_TR && m.args[1] === CLOCK_TRIGGER_ID);
```
`:30` usa `skipRx(event.packet)`. `/tr` con id estranei resta loggato.

### 1d. Test
- `ClockSync.test.ts`: i 3 casi callback passano a `onTick()` (Date.now
  mockato avanzante, chiamate ripetute); NUOVO caso che pinna la
  separazione: una raffica di `onSample` NON fa scattare i listener; casi
  estimatore/publish/reset invariati su `onSample`.
- `OscClient.test.ts`: "drives subscribeClock callbacks from the /clock/sample
  stream" → dai `/tr` (`oscMessage("/tr", 99, CLOCK_TRIGGER_ID, 0.5)`);
  NUOVO: `/tr` con triggerId estraneo NON aziona i listener e risolve un
  `once(ADDR_TR, …)` (fall-through ai waiter pinnato).
- `logging.test.ts`: `/tr` id 4242 skippato, `/tr` id 7 loggato.
- Package synthdef-compiler: `yarn vitest` del package dopo il 10→20 (i
  suoi test girano dentro `yarn test` root — workspace già incluso).

### 1e. Sweep docs (stesso commit)
- `docs/clock.md`: §1 (il paragrafo "One message solves both": ora il
  metronomo è il tick del MOTORE, il sample resta la misura — due flussi,
  ciascuno dal suo padrone); §2 aggiungere il flusso `/tr` (con nota: address
  fisso di scsynth, discriminato per triggerId); §5 callbacks: azionati dal
  tick (quantizzazione a 1/20 Hz), requisito della clock synth + nota switch
  duro; §6/§8 ritocchi coerenti.
- `AUDIO-CLOCK.md`: status → "step 0-1 LANDED" con le tre decisioni fissate;
  §5.6 chiuso (20 Hz); §5.3 ownership v1 = sc-startup (first-client-wins
  resta futuro); migration sketch spuntato.
- `src/lib/osc/README.md`: riga ClockSync (callbacks dal tick audio);
  sezione protocollo: nota che il metronomo ora è `/tr` id 4242.
- `TODO.md` roadmap step 0: marcare la tranche fatta, restano step 2-4.

## Cosa NON cambia (guard-rail)
- Ping/pong a 50ms, `/clock/sample`, estimatore, watchdog worker-side,
  `sendAt`, wire Rust: INTOCCATI (step 2+).
- API `subscribeClock` per i consumer: identica.
- La liveness del watchdog copre i tick gratis (regola any-non-pong).

## Verifica
1. `yarn test` + `yarn build` + `yarn lint`.
2. `yarn parity` in packages/synthdef-compiler (skippa se sclang assente;
   con lo stack dev installato sclang c'è).
3. **Lo stack dev VA RIAVVIATO** (`yarn osc`) per caricare il nuovo
   sc-startup — l'attach a quello vecchio lascerebbe i callback muti (lo
   switch è duro). e2e: serve il run completo (`yarn e2e boot`, UDP 57110
   libero → richiede stack dev giù); se il tuo stack resta su, lo segnalo e
   la verifica live resta manuale post-riavvio: header che ticka = tick
   end-to-end.
4. Grep di chiusura: nessun `Impulse.kr(10` residuo nel package; commento
   "mirrored" veritiero; `CLOCK_TICK_FREQ_HZ` referenziato dai doc comment.

## Commit
Branch `feat/audio-clock`, un commit:
`feat: the audio engine's /tr tick becomes the main thread's metronome`.
