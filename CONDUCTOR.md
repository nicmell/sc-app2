# Il Conductor — tempo musicale, transport e metronomo

Stato: **design concordato, NIENTE implementato** — questo documento è
l'handoff completo (fatti verificati + decisioni + disegno) per
l'implementazione. Il branch `feat/transport` precedente è stato
SCARTATO (main non lo contiene); le sue lezioni sono qui. In italiano
per scelta. Compagni: `docs/clock.md` (il clock fisico), `PURE-BRIDGE.md`.

## 1. Obiettivo

Header della dashboard con: **play/pause/stop** (stile DAW, governa il
session group E i widget Strudel), un **timer di posizione**, e un
**metronomo two-way** (il tempo si imposta dall'header O da un pattern
Strudel via `setcps` — stesso stato, aggiornamento bidirezionale).

## 2. Decisioni prese (utente)

- **Nome modulo**: NON "transport". Proposta: **`Conductor`**
  (`src/lib/conductor/`, singleton `conductor` — parallelo a
  `session`/`oscClient`). Alternative se non piace: `Maestro`,
  `Timeline`. Da confermare a inizio implementazione.
- **Misura interna del tempo: cps** (cicli/secondo, nativo Strudel).
  **L'header MOSTRA BPM**: `bpm = cps · 60 · beatsPerCycle`, con
  `beatsPerCycle = 4` come costante (convenzione Strudel `setcpm(bpm/4)`
  in 4/4) — costante documentata, configurabile in futuro.
- **Tempo di SESSIONE**, non per-widget: un solo cps condiviso; le
  relazioni tra pattern si esprimono con `.fast/.slow` (tempo-relativo
  idiomatico). `setcps` in QUALUNQUE pattern aggiorna la sessione
  (ultimo che scrive vince — documentare).
- **Stopped al connect** (boot DAW-puro): il session group nasce in
  pausa; silenzio finché play.
- **Stop = kill voci + rewind**: riusa il ciclo `unload()`/`load()` dei
  plugin (API pubbliche su `<sc-plugin>`; enumerazione
  `document.querySelectorAll` — light DOM, funziona).
- **Pause ferma anche Strudel**, e il resume riprende DALLO STESSO
  PUNTO (requisito duro — risolto, §4).
- **Timer client-side** (niente synth di transport, niente wire): il
  primo tentativo usava un synth `__transport__` con SendReply
  `/transport/pos` — scartato come complessità evitabile.

## 3. Fatti verificati — scsynth (sorgenti 3.14.1)

- `/n_run 0` su un GRUPPO sgancia la calc-func: TUTTO l'interno (anche
  annidato) congela **bit-esatto** (contatori, envelope a metà, delay
  line) e riprende esattamente da lì. Run-flag dei figli intatti.
- `t_trig` settato su nodo in pausa PERSISTE e scatta al resume (il
  TrigControl si azzera solo nella calc del nodo).
- Granularità `/n_run` non timestampato = hardware buffer (~12 ms);
  click di pausa documentato (SC docs) — accettato.
- `PulseCount.kr(trig, reset)`: reset azzera e VINCE sul trig; MA se
  l'input reset è scalar/costante viene scelta la calc-func senza
  reset → il reset DEVE essere un control.
- SendReply: layout binario `[trig, replyID, strLen, …charASCII,
  …values]` (char = costanti f32, 0 output) — **il compiler PUÒ
  emetterlo**; il commit `feat: the compiler learns SendReply` del
  branch morto era verde (59 test) e RECUPERABILE (cherry-pick) se mai
  servirà: fixture parity `global_clock_reply` che specchia il grafo di
  produzione del clock. Non serve al Conductor.

## 4. Fatti verificati — Strudel (dist installati @strudel/core, cyclist.mjs/zyklus.mjs/repl.mjs)

- **`Cyclist.pause()` ESISTE ma è inutilizzabile**: `zyklus.pause()` fa
  solo `clearInterval` lasciando `phase` stale; al `start()` un
  catch-up loop (`while (phase < lookahead)`) avanza `lastEnd` di un
  tick per ogni 50 ms di pausa → il pattern riprende
  **fast-forwardato** della durata della pausa.
- **`stop()` resetta la posizione**: `lastEnd = 0` + zyklus
  `tick=0/phase=0` → riparte dal ciclo 0. (Giusto per STOP, sbagliato
  per pause — è ciò che il vecchio design faceva: restart.)
- **`setCps(0)` È la pausa esatta** (cyclist.mjs:37-50): al primo tick
  dopo il cambio il ciclo si RI-ANCORA (`num_cycles_at_cps_change =
  lastEnd`) e l'avanzamento è `Δt·cps = 0` — `lastEnd` congelato; il
  restore ri-ancora dallo stesso punto → resume ESATTO. Niente
  `onToggle`, niente `reset_state`, drawer vivo, `now()` congelato
  senza crash.
  - **Hazard**: se il punto di freeze cade esattamente su un onset, la
    query zero-width ritorna quel hap a OGNI tick (100 ms) con
    `targetTime = 0/0 = NaN` e `duration = ∞` (divisioni per cps a
    cyclist.mjs:65-66). **Mitigazione**: il `defaultOutput` è NOSTRO
    (sc-strudel) → early-return mentre siamo congelati (flag
    `frozenCps !== null`).
  - Coda lookahead: ~0.3 s di eventi già spediti suonano dopo la
    pausa (zyklus window + latency 0.1) — accettato.
  - `.cpm()` nei pattern divide per `scheduler.cps` (repl.mjs:207) →
    Infinity con cps 0 — caso raro, documentare.
- **setCps path**: `repl.setCps` / eval-scope `setcps` →
  `scheduler.setCps(v)` (early-return se invariato). NESSUN evento
  emesso al cambio → per osservare Strudel→app serve un seam.
- **Superficie**: `mirror.repl` è pubblico (repl.mjs:292 ritorna
  `{scheduler, pause, setCps, …}`) ma NON tipizzato nel nostro shim
  (`src/lib/strudel/strudel.d.ts` — da estendere:
  `repl: { scheduler: { cps: number; setCps(v: number): void } }`).
  `mirror.stop()` = `scheduler.stop()`. Lettura del cps vivo:
  `mirror.repl.scheduler.cps`.
- Bug upstream noto: `repl.toggle()` chiama `scheduler.toggle()` che
  su Cyclist non esiste (throw) — non usarlo.
- Il cps di default è 0.5; nessun nostro codice chiama oggi setcps.
- Stub di test (`src/lib/utils/test/stubs/strudel-codemirror.ts`):
  registra i mirror in `strudelMirrors` con spy stop/evaluate/… — da
  estendere con `repl.scheduler` fake per i test del two-way.

## 5. NeoCyclist (valutato, rimandato)

Scheduler alternativo (`sync: true` + SharedWorker disponibile,
fallback automatico a Cyclist — happy-dom cade su Cyclist da solo):
clock in uno SharedWorker condiviso tra istanze e tab; ha
**`setCycle()`** (il seek che a Cyclist manca → allineamento di fase
pattern↔Conductor possibile) ma niente `pause()` (irrilevante: pausa =
cps 0 su entrambi). **Incognita bloccante da verificare prima di
adottarlo**: il worker usa quasi certamente il SUO clock, bypassando il
nostro `getTime` (audioTime rate-locked) e lo shim setInterval
tick-driven → regressione della disciplina engine-rate e
dell'immunità al throttling. Decisione: **v1 su Cyclist**; NeoCyclist
come spike/investigazione registrata (si sposa con l'idea
shared-transport-origin di AUDIO-CLOCK/PURE-BRIDGE §3.7).

## 6. Il disegno

```
 header UI ◄──────► conductor (lib/conductor) ◄──────► sc-strudel (N widget)
                     lo STATO MUSICALE della sessione:
                     • state: stopped | playing | paused
                     • cps   (interno; header mostra BPM ·4·60)
                     • cycle (posizione in CICLI) + secondi derivati
                            │ avanza leggendo
                            ▼
              oscClient.clock.audioTime()   (substrato rate-locked sul DAC;
                            │                è GIÀ il getTime di Strudel)
                    /n_run session group    (la pausa dell'audio)
```

- **Posizione**: `cycle = cycleAncora + (audioTime() − anchor) · cps`,
  ri-ancorata a ogni cambio di tempo/stato — la STESSA matematica
  interna di Cyclist sulla STESSA timebase: coerenza per costruzione.
  Accumulatore secondi separato per il display `M:SS.d` (i cambi tempo
  non falsano l'orologio); posizione primaria in cicli.
- **Store**: slice dedicata (`SliceName.CONDUCTOR`):
  `{ state, cps, cycleBase, secondsBase, anchorAudioTime | null }` +
  hook `useConductor`; reset a idle su disconnect (subscribe a
  `oscClient.connected`).
- **Play/Pause audio**: `setNodeRun(sessionGroupId, 1|0)`; boot: in
  `OscClient.connect`, `nRunOne(group, 0)` SUBITO dopo il `/g_new`
  (i plugin caricano nel gruppo in pausa: voci nate congelate; il
  primo play parte tutto su un blocco).
- **Stop**: `setNodeRun(group, 0)` + `unload()` su ogni `<sc-plugin>`
  (gFreeAll → kill voci; ferma anche i mirror via tree) + posizione 0;
  play da stopped: `await Promise.all(load())` poi `n_run 1`. Costo
  documentato: d_recv+/synced per synthdef a ogni stop→play, node id
  bruciati (blocco 65535, monotonic).
- **Pausa/tempo Strudel — il cps effettivo è DERIVATO**:
  `schedulerCps = paused ? 0 : conductor.cps`; una sola funzione
  `applyTempo(mirror)` per play/pausa/cambio tempo. `transportPause`/
  `transportResume` (o nomi Conductor-coerenti) su ScStrudel: freeze =
  salva cps vivo + `setCps(0)` + flag per il gate del defaultOutput;
  resume = `setCps(conductor.cps)`; unload/stop = restore PRIMA di
  `mirror.stop()`.
- **Two-way metronomo**: alla costruzione del mirror (sc-strudel),
  WRAP di `mirror.repl.scheduler.setCps` — inoltra e notifica
  `conductor.onCpsFromStrudel(v)` con guardia di rientranza (ignora i
  nostri stessi set e lo 0 della pausa). Header→app→tutti i mirror;
  pattern→app→header+altri mirror. (Alternativa scartata: polling di
  `scheduler.cps` a 100 ms.)
- **Limite dichiarato**: fase del ciclo pattern↔Conductor non forzata
  (Cyclist non ha setCycle); un widget avviato a metà parte dal SUO
  ciclo 0. Futuro: NeoCyclist/setCycle (§5).
- **Skew onesto**: timer congela alla chiamata, voci al blocco in cui
  `/n_run` arriva (~ms) — display, accettato.

## 7. Piano di implementazione (sessione nuova)

Branch nuovo da main, ~3 commit:
1. **Modulo conductor** + boot-paused in OscClient.connect + slice
   store + seam ScStrudel (freeze/resume/two-way wrap + gate
   defaultOutput + shim d.ts + stub test esteso). Test: state machine
   (n_run/unload/load sequenze), timer (audioTime mockato), freeze con
   posizione (setCps(0)/restore sullo stub), two-way (wrap notifica,
   rientranza), reset a disconnect.
2. **UI header**: play/pause toggle + stop (Phosphor `play/pause/stop`,
   precedente iconOnly nel Drawer) + timer + metronomo BPM (input
   numerico; `Button`/`Chip` di `@/components/ui`).
3. Sweep docs (architecture, clock.md §6 consumer, TODO, questo file →
   stato LANDED) + e2e completo a stack giù + verifica manuale: pausa →
   resume DALLO STESSO PUNTO; BPM da header → pattern cambia velocità;
   `setcps` nel pattern → header si aggiorna; stop → 0 e voci morte.

Vincoli permanenti: implementazione personale (niente delega ad altri
modelli), branch dedicato, plan mode per fase, merge --no-ff su main.
