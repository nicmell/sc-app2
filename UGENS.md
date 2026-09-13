# UGens — custom e sc3-plugins: le idee buone

Stato: **analisi, niente implementato**. Documento in italiano per scelta.
Due assi indipendenti: (A) UGens NOSTRE (richiedono la toolchain
cmake/C++ + header SC); (B) adozione nel synthdef-compiler di UGens GIÀ
caricate da sc3-plugins (zero toolchain — i binari girano già, manca
solo il registry). Compagni: `AUDIO-CLOCK.md` (§5.1 è il vincolo che
motiva la prima custom), `PURE-BRIDGE.md` (§3.6 scope), `TODO.md`
(roadmap 3 buffer family; "rate inference for authored ugens").

## A. UGens custom

### Il fatto abilitante e il gate

Un UGen custom = ~100 righe C++ + build cmake con `-DSC_PATH` verso i
sorgenti SuperCollider (gli header dell'API plugin NON sono nella app
distribuita) + Xcode CLT. La toolchain entra SOLO quando decidiamo di
volere il Tier 1 — mai in `build.rs` (appesantirebbe cargo/CI per
tutti): script separato, e al momento del packaging un
`beforeBundleCommand`. Un UGen consumato solo da synthdef COMPILATI DA
NOI non richiede nemmeno la classe sclang (il binario referenzia per
nome; la classe serve solo ai grafi costruiti in sclang — e il clock
synth potrebbe a quel punto diventare compiler-authored: la parity
fixture esiste già).

### Tier 1 — giustificano da soli la toolchain

1. **[SUPERATO] `ScAppTick`** — il tick con address custom e payload
   ricco. Realizzato SENZA toolchain: il synth è sclang-authored, quindi
   SendReply è disponibile — `/clock/tick [PulseCount, phase]` consegna
   address custom e indice assoluto (vedi PURE-BRIDGE §3.3). Resta qui
   come storia; il payload double (sample time nativo) resterebbe
   l'unico residuo che solo un UGen può dare. Testo originale:
   Il vincolo che ha plasmato il design del clock è AUDIO-CLOCK §5.1:
   il compiler non codifica SendReply (address string), quindi SendTrig
   — UN float32, address `/tr` fisso, discriminazione per trigger id,
   fase su ring 8192 perché f32 non regge di più. Con l'UGen nostro:
   - contatore campioni ASSOLUTO in double → niente ring, niente
     unwrap, niente `matchK`/heuristiche di resync: `TickTracker`
     collassa a pura regressione (il grosso della sua complessità
     esiste per compensare il payload povero);
   - address dedicato → `/tr` torna interamente ai plugin;
     `isClockTick` diventa un match d'address; la discriminazione per
     id sparisce da routing, log-skip e watchdog;
   - payload estensibile gratis (sample rate effettivo, beat phase…).

2. **`ScAppWaveWriter`** — envelope min/max decimato in un buffer
   circolare (il rendering waveform dei DAW, fatto server-side).
   Serve DIRETTAMENTE `sc-waveform` (TODO roadmap 3) e l'arco "scope
   senza bridge" (PURE-BRIDGE §3.6): il problema di bandwidth del
   `/b_getn` frontend-paced esiste perché si leggerebbero campioni RAW;
   con la decimazione nel motore il client legge alla SUA cadenza, a
   risoluzione display, senza perdere picchi tra un poll e l'altro. Il
   feasibility pass di §3.6 probabilmente passa da "dubbio" a "sì" con
   questo pezzo.

### Tier 2 — interessanti, dopo

3. **Spettro-in-buffer**: magnitudini FFT scritte in un buffer, client
   polla — modalità spectrum per sc-scope senza spedire audio.
4. **Transport musicale server-side**: beat counter + tempo su bus,
   fase condivisa NEL motore — lo shared-transport-origin fatto UGen
   (fase musicale identica per N client per costruzione; alternativa
   in-engine a LinkClock).

### Tier 3 — non giustificano nulla

Metering (Amplitude.kr + SendTrig bastano); utility per-bus; probe di
latenza wall↔sample dentro il motore (syscall nel thread RT = pratica
sporca — respinto).

### Costi strutturali (onesti)

Binario per piattaforma/arch e distribuzione (vedi il discorso
packaging: bundle da `deps/`, sidecar, GPL); pin degli header SC
compatibili con la versione installata; entry nel registry del
synthdef-compiler per ogni UGen (adiacente al TODO "rate inference for
authored ugens").

## B. sc3-plugins già caricati — adozione nel registry

**Fatto abilitante**: gli sc3-plugins (release 3.13.0 pinnata in
`deps/`, caricati da scsynth via `-U`) oggi NON sono raggiungibili
dagli autori di plugin — il registry del compiler copre solo UGen
stock; li usa solo Dirt via synthdef sclang. Adottarne uno costa:
entry di registry + spec + (dove ha senso) parity fixture — zero
toolchain, zero binari nuovi.

### Effetti seri (il buco più grosso dello stock)

- **JPverb / Greyhole** (DEIND) — riverberi di qualità vera (lo stock
  ha solo FreeVerb/GVerb); già in RAM per Dirt.
- **NHHall** — hall stereo eccellente, alternativa.
- **SwitchDelay** — feedback delay con switching dei tap.
- **MoogLadder, DFM1, RLPFD** — filtri modellati analogici; MoogLadder
  è IL filtro che lo stock non ha.
- **Decimator/SmoothDecimator, CrossoverDistortion, SineShaper** +
  **Squiz/WaveLoss** (MCLD) — palette lo-fi/glitch.

### Strumenti "istantanei" (demo, esempi, sc-keyboard)

- **MdaPiano** — un pianoforte completo in UN UGen: sc-keyboard +
  MdaPiano = plugin demo con dieci righe di markup.
- **DWGPlucked/DWGBowed**, **OteyPiano** — corde/piano fisici via
  waveguide; famiglia **Stk** più datata ma vasta.
- **MembraneCircle/MembraneHexagon** — percussioni a membrana.

### Analisi → UI reattiva (la sinergia architetturale)

Feature audio su bus di controllo → tap/`bind:` → l'interfaccia
REAGISCE al suono:
- **Tartini / Qitch** — pitch tracking realtime (tuner, UI bound al
  pitch);
- zoo **FFT*** di MCLD (FFTCentroid/Crest/Spread, SpectralEntropy,
  **SensoryDissonance**, Chromagram) + **KeyClarity/KeyMode** (SCMIR);
- **OnsetsDS / Coyote** — onset detection; **AutoTrack** — beat
  tracker (prospettico: tempo Strudel da input live).

### Aggancio diretto alla roadmap

- **LoopBuf** — playback loopato con crossfade: il player giusto per
  il futuro `sc-buffer` (roadmap 3), meglio di PlayBuf per quel caso.
- **Gendy4/5, TGrains2/3**, ChaosUGens (Henon/Lorenz/Standard2D,
  GravityGrid, DoubleWell) — generativi che sposano l'expression
  language (`bind:` su parametri caotici).

### Fuori per ora

VBAP/ATK/HOA (l'app è `-o 2`; rilevante solo con un futuro panner
multicanale); AuditoryModeling/SCMIR pesanti; LadspaUGen (host senza
caso d'uso).

### Il primo batch proposto (8 entry)

`JPverb`, `Greyhole`, `MoogLadder`, `DFM1`, `Decimator`, `MdaPiano`,
`LoopBuf`, `Tartini` — due riverberi, due filtri, una distorsione, uno
strumento-demo, il player per sc-buffer, un analizzatore. Copertura
massima per sforzo minimo; tutte stabili da anni (rilevante perché su
Linux la versione arriva da apt, non pinnata come la 3.13.0 macOS).
