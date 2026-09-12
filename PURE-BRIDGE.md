# Il bridge puro — clock in sclang, StrudelDirt patchato, endpoint intelligenti

Stato: **direzione decisa; §3.1 (infrastruttura: deps come submodule
pinnati + la classlib sclang del repo) LANDED** — il resto non
implementato (TODO roadmap 1).
Documento in italiano per scelta. Compagni: `AUDIO-CLOCK.md` (il transport
audio-clock, §5.2 è il gate che questo documento scioglie), `docs/clock.md`
(lo stato corrente del clock). I fatti in §2 sono stati verificati su
sorgenti SuperCollider 3.14.1 (l'installazione locale), sul quark
StrudelDirt installato e sul codice Rust del repo — ogni claim porta la
sua fonte.

## 1. Motivazione: separazione dei ruoli

Il bridge Rust deve diventare **routing + sessioni e basta**: ogni
"cervello di protocollo" appartiene agli endpoint — il frontend da un
lato, sclang dall'altro. Oggi il bridge possiede tre ruoli che non sono
routing:

1. il **responder del clock** (`/clock/ping` intercettato nel pump WS,
   `core/clock.rs` risponde con SystemTime);
2. i **propri messaggi verso scsynth** (la registrazione `/notify`,
   l'heartbeat `/status` a 1 Hz del supervisor);
3. la **pipeline scope** (lettore SHM + la famiglia `/scope/*` +
   staging a 5 ms).

La motivazione NON è la precisione: bridge, sclang e scsynth girano sullo
stesso host e leggono lo stesso orologio di sistema (§2.1) — spostare il
responder non avvicina nessuno al clock "vero" di scsynth (il cristallo
del DAC), che è già misurato dal tick `/tr` (AUDIO-CLOCK, TickTracker).
La motivazione è architetturale: un bridge che non interpreta nessun
messaggio è più piccolo, più testabile e non va toccato quando i
protocolli evolvono.

## 2. Fatti verificati

### 2.1 I clock dei tre processi

- **Stesso host, stesso orologio**: i peer sono `127.0.0.1:57110`
  (scsynth) e `127.0.0.1:57120` (sclang/StrudelDirt); sc-startup.scd
  attacca sclang a `127.0.0.1:57110`. `SystemTime::now()` (Rust,
  `core/clock.rs`) e `Date.getDate` (sclang) leggono lo stesso
  `CLOCK_REALTIME` del kernel. Differenza tra i due responder candidati:
  nanosecondi.
- **`Date.getDate.rawSeconds` è un orologio Unix assoluto sub-µs**: il
  primitive legge `std::chrono::system_clock::now()` e riempie
  `rawSeconds` come double frazionario (`PyrUnixPrim.cpp`; a grandezze
  epoch la granularità della mantissa è ~0.5 µs). Legge il clock **al
  momento della chiamata** — non passa per l'offset dei timetag.
- **I timetag di sclang passano per `gElapsedOSCoffset`**, un offset
  elapsed→NTP risincronizzato contro `gettimeofday` solo **ogni 20 s**
  (`PyrSched.cpp`): uno step NTP resta invisibile ai timetag sclang fino
  a 20 s. L'offset non è esposto al linguaggio. (Il bridge invece legge
  SystemTime a ogni ping.)
- **Gli handler OSC di sclang girano sotto `gLangMutex`** nel thread
  unico dell'interprete (`OSCData.cpp`): un responder si serializza
  dietro qualunque cosa l'interprete stia facendo (es. il processing
  eventi di SuperDirt).
- **sclang non defer-a mai un bundle sul suo timetag**: i messaggi sono
  dispatchati all'arrivo e il timetag convertito è solo l'argomento
  `time` dell'handler (`OSCData.cpp: PerformOSCBundle`). Schedulare
  contro il timetag è interamente compito della classe ricevente.
- **Nessuna classe di timing sclang vede il clock del DAC**:
  `SystemClock`/`TempoClock` aspettano su `high_resolution_clock` host;
  `LinkClock` è Ableton Link (tempo+fase musicale via LAN, sopra lo
  stesso clock host); `Server.latency` è una costante fissa. L'unico
  osservabile DAC esportato è `actualSampleRate` nel `/status.reply` —
  un RATE smussato (pollato a ~0.7 s), non una fase. La mappa
  wall→sample vive DENTRO scsynth (suo `gOSCoffset`, anch'esso
  risincronizzato ogni 20 s) ed è invisibile a tutti i client.

### 2.2 Meccanica del bridge

- L'intercettazione è un solo match arm nel pump WS
  (`router/ws.rs:130-146`): `srv` catturato PRIMA di ogni await, pong
  risposto inline **sulla stessa WebSocket che ha pingato**. Mai tocca
  UDP né fan-out.
- **Routing a sclang = solo config**: tolto il match arm, il ping cade in
  `bridge.dispatch_command`; i peer sono `PeerConfig` puri
  (config.json). Morirebbero: il match arm, `core/clock.rs` intero (unico
  consumatore è ws.rs) col suo byte-test.
- **I socket peer sono UDP connected**: accettano solo datagrammi che
  originano dall'indirizzo target. La risposta di sclang DEVE partire da
  `127.0.0.1:57120` (il langPort) — `addr.sendMsg` da un OSCdef va bene;
  una porta di ricezione aggiuntiva (`thisProcess.openUDPPort`) NON va
  bene come target del peer, perché `sendMsg` risponde comunque dal
  socket principale.
- **Il ritorno passa dal fan-out broadcast**: il recv task del peer
  pubblica ogni datagramma, senza leggere l'address, sull'unico canale
  broadcast che OGNI pump WS inoltra integralmente (`peer.rs`,
  `ws.rs`). Ogni client vedrebbe i pong di tutti; l'attribuzione è persa
  già a monte perché tutte le sessioni pingano dall'unico socket peer
  condiviso.
- **La collisione dei seq è strutturale**: ClockSync matcha il pong per
  solo `seq`, ogni client parte da 0, e tutti i client cavalcano lo
  STESSO stream di tick broadcast (primo ping al primo tick, poi ogni
  40): client connessi nello stesso periodo di ping restano seq-collisi
  per sempre, e i campioni corrotti (srv altrui + rtt piccolo) sono
  esattamente quelli che il filtro min-RTT seleziona. La soluzione
  giusta è un **client id sul wire** (§3.4), non un filtro nel bridge.
- **`NetAddr` sclang emette float32**: un f64 Unix-ms crudo
  quantizzerebbe a ~2 minuti (mantissa 24 bit). Un pong sclang deve
  cambiare formato: `[clientId:i, seq:i, secs:i, fracMs:f]` (float32 è
  sub-µs sotto 1000 ms).

### 2.3 StrudelDirt: deployment e comportamento

- **Vendoring [RISOLTO con §3.1]**: StrudelDirt, Vowel e Dirt-Samples
  sono submodule git pinnati in `deps/` (StrudelDirt upstream
  `daslyfe/StrudelDirt` @ `d75c45b`); `setup-deps.sh` = submodule init +
  il fetch della release binaria sc3-plugins. Il support folder di SC
  non è più una dipendenza (l'incoerenza storica setup-deps ⇄ start
  script è chiusa).
- **Il repo controlla la classlib [FATTO con §3.1]**:
  `start-strudeldirt.sh` GENERA la config `-l` di sclang con
  `includePaths` espliciti — oggi: SCClassLibrary, deps/StrudelDirt,
  deps/Vowel, deps/sc3-plugins e `scripts/sc-classes/` (la classlib
  repo-owned, classi `ScApp*`). Nessun fork da mantenere. L'e2e boota
  l'intero `start-osc.sh`, quindi le estensioni entrano anche lì gratis.
  Fatto scoperto implementando: sclang compila le dir `Extensions/` del
  support folder IMPLICITAMENTE, a prescindere dagli `includePaths` —
  senza contromisura, un SC3plugins ancora installato lì duplica ogni
  classe di deps/sc3-plugins e la compilazione fallisce. La config
  generata quindi le mette in `excludePaths` (user + system): è QUELLO,
  non gli includePaths, a isolare davvero il nostro sclang
  dall'installazione personale.
- **Il timetag di `/dirt/play` è onorato dal CODICE di classe, non dal
  layer di ricezione**: `SuperDirt.sc` (playFunc) calcola
  `latency = time − thisThread.seconds` (clampa solo il caso >42 s a
  0.2, con warning) e `DirtEvent` RI-STAMPA un bundle nuovo verso
  scsynth via `server.makeBundle(~latency)` — il timetag wall del
  frontend viene comunque "lavato" nel dominio sclang, con
  `server.latency = 0.3` aggiunto. Un timetag nel passato non è
  clampato: scsynth azzera l'offset negativo e suona al blocco
  successivo.
- **sclang riceve GIÀ i `/tr` a 20 Hz e li scarta**: sc-startup.scd fa
  `s.notify` (client registrato → scsynth manda i `/tr` a tutti i
  client registrati) e nessun responder li consuma. Il quark usa già
  l'identico pattern OSCFunc-dal-server per `/n_end`. E il synth del
  clock lo installa sclang stesso: possiede l'origine del tick.

## 3. Gli archi

### 3.1 Infrastruttura: estensioni sclang repo-owned + pin [LANDED]

`scripts/sc-classes/` è negli `includePaths` generati (le classi lì
dentro compilano nella classlib e possono aggiungere OSCdef,
subclassare o estendere `+ SuperDirt {}`; `ScApp.banner` è la prova di
compilazione a ogni boot). Il pin è strutturale: StrudelDirt, Vowel e
Dirt-Samples sono submodule git (gitlink = versione; `shallow = true`;
opt-in via `yarn deps`), sc3-plugins resta la release binaria pinnata.
Gli script di start leggono SOLO `deps/`.

### 3.2 Livello 1 — `/dirt/play/in` a delta relativo [LANDED]

`ScAppDirt` (scripts/sc-classes) registra `/dirt/play/in`
(`[deltaMs:f, k1, v1, …]`): `~latency = delta/1000` direttamente, poi la
stessa pipeline DirtEvent via i soli accessor pubblici del quark. Il
frontend manda il delta che GIÀ calcola (`targetTimeSecs − audioTime()`).
`sendIn` e l'intera pipeline `at`/timetag del boundary sono morti (era
l'unico produttore); AUDIO-CLOCK §5.2 risolto. Il wall clock resta come
àncora NON musicale (header/diagnostica — §3.5). Costo onesto: il delta
consumato all'arrivo eredita il jitter di consegna uplink (il timetag
assoluto lo assorbiva fino al lookahead) — su loopback sono millisecondi
contro un `server.latency` di 0.3 s; in serve-mode remoto serve il
Livello 2.

### 3.3 Livello 2 — target audio-domain (la forma finale)

Un `TickAnchor` sclang-side: OSCdef su `/tr` id 4242 (stream che sclang
già riceve), mappa tick↔`thisThread.seconds` con ancora a residuo minimo
su finestra (la versione minima del TickTracker: stesso host, gli basta).
`/dirt/play/in` porta il target in **tempo audio** (lo stesso dominio di
`audioTime()`), sclang lo converte in `~latency` con la SUA mappa.
Frontend e sclang ancorati alla stessa timeline fisica — il cristallo del
DAC; il wall clock esce dall'intera pipeline musicale: immune agli step
NTP, e il jitter uplink torna assorbito (il target è assoluto nel dominio
audio). È la chiusura naturale di AUDIO-CLOCK: un solo clock, il motore,
condiviso end-to-end.

### 3.4 Session ↔ client id, 1:1

Un piccolo client id per sessione, mintato accanto al blocco node-id
(`core/blocks.rs`) e portato in `SessionInfo`. Ogni traffico per-sessione
sul fan-out condiviso diventa attribuibile SENZA filtri nel bridge: il
ping lo porta, il pong lo echoa, il frontend filtra il suo. Utile a
prescindere dall'arco clock (qualunque protocollo futuro sul fan-out ha
lo stesso problema).

### 3.5 Il responder clock in sclang (piano B)

Solo se dopo il Livello 1/2 un'àncora wall deve ancora sopravvivere (es.
l'orologio dell'header in serve-mode remoto). Design mappato:

```supercollider
// scripts/sc-classes/ — repo-owned
OSCdef(\scAppClockPing, { |msg, time, addr|
    var d = Date.getDate.rawSeconds;           // system_clock live, sub-µs
    addr.sendMsg('/clock/pong',
        msg[1], msg[2],                        // clientId, seq (echo)
        d.trunc.asInteger,                     // secs:i
        (d.frac * 1000));                      // fracMs:f
}, '/clock/ping');
```

- Peer nuovo in config: `^/clock(/|$)` → `127.0.0.1:57120` (il langPort:
  vincolo del socket connected, §2.2).
- Wire: ping `[clientId, seq]`, pong `[clientId, seq, secs, fracMs]` —
  da ri-pinnare il fixture TS; il byte-test Rust muore col modulo.
- Costi accettati: bias `srv` da serializzazione `gLangMutex` (il
  min-RTT non lo rimuove — misurarlo contro il responder bridge prima
  dello switch); l'àncora muore con sclang (coerente col watchdog
  tick-only: se sclang muore, muore comunque il clock synth).

### 3.6 Scope senza bridge (prospettico, gated su fattibilità)

Sostituire la pipeline SHM + `/scope/*` con letture di buffer
frontend-PACED (`/b_getn` — `/b_read` è il loader da disco) temporizzate
dal clock audio sincronizzato. Ostacoli onesti da quantificare PRIMA di
decidere: limiti di taglia delle reply `/b_getn` e dei datagrammi UDP,
~190 KB/s per scope 2ch alla cadenza chunk attuale, gestione delle
perdite — il design SHM esiste esattamente per questi motivi. Serve un
feasibility pass vero, non uno swap. Nota collegata: anche a bridge
"puro" resta aperta la questione di CHI si registra `/notify` (il
fan-out esiste perché il bridge è il client notificato di scsynth) e di
chi origina l'heartbeat `/status` che alimenta il footer — da risolvere
nell'arco, non assumere gratis.

### 3.7 Investigazioni ulteriori

- **LinkClock** (Ableton Link): tempo + fase di battuta tra app e
  macchine — il candidato naturale per lo shared-transport-origin
  (fase musicale condivisa tra client e DAW esterne); sclang lo espone
  gratis. Il tick dà il tempo fisico, Link darebbe la griglia musicale.
- **`actualSampleRate`** dal `/status.reply` come feed di rate per
  raffinare/validare lo skew del TickTracker.

## 4. Sequenza raccomandata

1. **[LANDED] Infrastruttura** (§3.1): directory estensioni + pin via
   submodule.
2. **[LANDED] Livello 1** (§3.2): morte di `sendIn` e dell'intera
   pipeline `at`/timetag; il wire ping/pong RESTA come àncora wall NON
   musicale — la sua migrazione in sclang (con morte di `core/clock.rs`
   e dell'intercettazione) è il punto 5.
3. **Client id 1:1** (§3.4) — indipendente, utile comunque.
4. **Livello 2** (§3.3).
5. **Responder sclang** (§3.5): solo se al punto 2 resta un consumatore
   wall reale. Farlo prima del punto 2 significherebbe costruire in
   sclang una cosa da demolire.

Go/no-go del punto 2: misurare il jitter di consegna uplink reale
(loopback e serve-mode) contro il margine `server.latency`; se il remoto
degrada, il Livello 2 è il fix, non il ritorno al timetag.

## 5. Il ledger finale del bridge

A regime il bridge tiene: HTTP/sessioni, il pump WS, il routing peer da
config, il fan-out broadcast, (aperto: `/notify` + `/status` — §3.6).
Ha perso: `core/clock.rs` e l'intercettazione (col Livello 1), la
famiglia `/scope/*` e il lettore SHM (se §3.6 passa il feasibility
pass). Ogni interpretazione di messaggi vive negli endpoint.
