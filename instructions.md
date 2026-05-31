# Running against a remote scsynth + StrudelDirt (Raspberry Pi)

This walks through pointing sc-app2 at a Raspberry Pi that already runs
**scsynth** as a systemd service, and starting **StrudelDirt** on that same Pi
so the app can drive it over the network.

## Topology

```
┌──────────────── your Mac ────────────────┐        ┌──────────── Raspberry Pi ────────────┐
│  yarn dev (Vite :1420)  ──proxy──▶        │        │                                       │
│  yarn serve (bridge :3000)                │        │  scsynth  (systemd)   UDP :57110 ◀──┐ │
│    strudel peer  ──/dirt/play──────────── UDP ─────────▶ StrudelDirt (sclang)  :57120    │ │
│    scsynth peer  ──/s_new,/notify,…────── UDP ─────────▶ scsynth                :57110    │ │
│  webview: Strudel console                 │        │  sclang attaches locally ───────────┘ │
└───────────────────────────────────────────┘        └───────────────────────────────────────┘
                                                              audio out via JACK → speakers
```

Key idea: **scsynth** is the audio engine. **StrudelDirt** = `sclang` + the
SuperDirt fork; it's a *language-side* layer that must run **on the Pi**,
attaching to the local scsynth and listening for `/dirt/play` on UDP 57120.
Audio comes out of the Pi. Your Mac only runs the app (bridge + frontend) and
forwards OSC to the Pi.

> **One scsynth change is required.** SuperDirt needs many audio buses, and
> scsynth splits its `-a` pool across all `maxLogins` clients (and client 0's
> slice must also hold the hardware I/O buses). With your unit's `-a 1024 -l 32`,
> sclang gets only `(1024/32) − 16 = 16` private audio channels — not enough for
> even 2 orbits. **Raise `-a` to `8192`** in the unit (see [A0](#a0-enlarge-scsynths-audio-bus-pool)).

---

## Part A — On the Raspberry Pi

SSH in (the unit runs as `nick`, so we use that user; adjust if yours differs):

```bash
ssh nick@<pi-host>          # e.g. ssh nick@raspberrypi.local
```

### A0. Enlarge scsynth's audio-bus pool

Edit the scsynth unit and bump `-a 1024` → `-a 8192` on the `ExecStart` line
(leave everything else — including `-l 32` — as is):

```bash
sudo systemctl edit --full scsynth        # change: -a 1024  →  -a 8192
sudo systemctl daemon-reload
sudo systemctl restart scsynth
sudo systemctl status scsynth --no-pager  # confirm it's active
```

This gives sclang (client 0) `(8192/32) − 16 = 240` private audio channels —
enough for SuperDirt's 12 orbits. (Audio buses are cheap; 8192 is fine on a Pi.)

### A1. Make sure `sclang` is installed

scsynth alone isn't enough — StrudelDirt needs the SuperCollider *language*:

```bash
command -v sclang || echo "sclang MISSING"
```

If missing, install it (Raspberry Pi OS / Debian):

```bash
sudo apt-get update && sudo apt-get install -y supercollider
```

(If your scsynth was built from source under `/usr/local/bin`, build/install
`sclang` from that same source tree — it does not require Qt.)

### A2. Install StrudelDirt via Quarks (one-time, canonical)

SuperCollider's package manager (**Quarks**) clones quarks into the standard
extensions path. The StrudelDirt fork does **not** reliably pull its
dependencies, so install all three explicitly — StrudelDirt itself, **Vowel**
(its `SuperDirt:initVowels` step crashes without it), and **Dirt-Samples** (the
sound library). Run `sclang` interactively once:

```bash
sclang
```

At the `sc>` prompt:

```supercollider
Quarks.install("https://github.com/daslyfe/StrudelDirt.git");
Quarks.install("https://github.com/supercollider-quarks/Vowel.git");
Quarks.install("https://github.com/tidalcycles/Dirt-Samples.git");
```

Watch for `Installed Quark 'StrudelDirt'`, `'Vowel'`, and `'Dirt-Samples'`. Then
quit sclang:

```supercollider
0.exit;
```

The quark is now on the class path permanently — the next `sclang` start
recompiles the library with it included (no custom config needed).

> **Verify** it's installed:
> ```bash
> sclang -e "Quarks.installed.collect(_.name).postln; 0.exit;"
> ```
> should list `StrudelDirt` (and `Vowel`, `Dirt-Samples`).

> **sc3-plugins is optional.** Without it you'll see a handful of
> `UGen 'X' not installed` warnings for exotic synths, but **sample playback
> (`s("bd hh sd")`) works fine**. It's compiled UGen binaries (not a class-only
> quark), so install it via apt:
> `sudo apt-get install -y supercollider-sc3-plugins`.

### A3. Create the startup file

This attaches to the running scsynth and mounts StrudelDirt. The option mirror
reflects **your** scsynth's systemd flags (`-i 8 -o 8 -a 1024 -b 262144 -l 32`)
— the bus/buffer/login numbers **must match** the running scsynth, or sclang's
allocators line up against the wrong buses and SuperDirt routes audio to
nowhere.

```bash
cat > ~/sc-startup-pi.scd <<'SCD'
// StrudelDirt — attach to an already-running scsynth on 127.0.0.1:57110.
// Option mirror MUST match the scsynth systemd ExecStart flags, because in
// attach mode these still govern sclang's local allocators (bus/buffer).
(
s.options.numBuffers           = 262144;  // -b
s.options.numAudioBusChannels  = 8192;    // -a   (raised in A0 from 1024)
s.options.numInputBusChannels  = 8;       // -i
s.options.numOutputBusChannels = 8;       // -o
s.options.maxLogins            = 32;      // -l   (must match, or clientID/bus mismatch)
s.newAllocators;                          // rebuild allocators with the values above

s.addr = NetAddr("127.0.0.1", 57110);     // the local scsynth (don't boot a second one)
s.startAliveThread;

// doWhenBooted = wait for the running scsynth to answer (NOT waitForBoot,
// which would start a second server). ~10s timeout (50 x 0.2s).
s.doWhenBooted({
    s.notify;
    s.sync;
    ~dirt = SuperDirt(2, s);     // stereo orbits; StrudelDirt exposes the SuperDirt class
    ~dirt.loadSoundFiles;        // default Dirt-Samples bundled with the quark
    ~dirt.start(57120, 0 ! 12);  // 12 orbits, listen on UDP 57120 (fits with -a 8192)
    "StrudelDirt ready on UDP 57120".postln;
}, 50, {
    "scsynth not reachable on 127.0.0.1:57110 — is the scsynth service running? (systemctl status scsynth)".error;
});
)
SCD
```

### A4. Run it

Because the quark is on the default class path, there's no config to pass —
just point `sclang` at the startup file. Use `tmux` (or `screen`) so it keeps
running after you disconnect and you can watch the log:

```bash
sudo systemctl status scsynth --no-pager   # confirm scsynth is active first
tmux new -s strudeldirt
sclang ~/sc-startup-pi.scd
```

Wait for it to compile the class library, load samples, and print:

```
218 existing sample banks: …
SuperDirt: listening on port 57120
StrudelDirt ready on UDP 57120
```

Detach with `Ctrl-b d` (it keeps running). Reattach: `tmux attach -t strudeldirt`.
Stop it: reattach and press `Ctrl-c` (scsynth keeps running — it's a separate
service).

> Optional — run it persistently as a systemd service instead of tmux: see
> [Appendix](#appendix-run-strudeldirt-as-a-systemd-service).

---

## Part B — On your Mac

### B1. Point the app at the Pi

Edit `config.json` (repo root) and replace `127.0.0.1` with the Pi's IP/host in
**both** route targets:

```json
{
  "port": 3000,
  "routes": [
    {
      "name": "scsynth",
      "pattern": "^/([sngbcdpu]_|notify|status|sync|cmd|dumpOSC|clearSched|error|quit|version)",
      "target": "<pi-ip>:57110"
    },
    {
      "name": "strudel",
      "pattern": "^/(dirt|clock|scope)(/|$)",
      "target": "<pi-ip>:57120"
    }
  ]
}
```

Use the Pi's actual address, e.g. `192.168.1.42:57110` (find it on the Pi with
`hostname -I`). A hostname like `raspberrypi.local:57110` also works.

### B2. Run the app

```bash
yarn serve        # bridge on :3000 — connects both peers to the Pi
# in another terminal:
yarn dev          # Vite on :1420 (proxies /api and /ws to the bridge)
```

On startup the bridge log should show both peers pointed at the Pi:

```
peer socket ready  peer=scsynth  target=<pi-ip>:57110
peer socket ready  peer=strudel  target=<pi-ip>:57120
```

(UDP is connectionless, so "socket ready" just means the target resolved — it
does not confirm the Pi is listening; the playback test below does.)

### B3. Test

Open <http://localhost:1420>. The console should show **connected**. With the
default `s("bd hh*2 sd hh")` loaded, press **Play** — you should hear it from
the **Pi's** audio output.

---

## Verifying & troubleshooting

**Confirm `/dirt/play` packets actually arrive at the Pi.** On the Pi:

```bash
sudo tcpdump -n -i any udp port 57120
```

Press Play on the Mac — you should see packets from `<your-mac-ip>` arriving.
- **Packets arrive but no sound** → a StrudelDirt/scsynth-side issue: check the
  tmux log for errors, confirm JACK is running (`systemctl status jackd`), and
  that the orbit outputs map to live JACK ports.
- **No packets arrive** → network/bridge side: see reachability + firewall below.

**`StrudelDirt`/`SuperDirt` class not found** when running the startup → the
quark didn't get onto the class path. Re-run the `Quarks.install(...)` step
(A2), then start a fresh `sclang` (it recompiles with the quark included).

**`Class 'Vowel' not found` → `Message 'formLib' not understood` in
`SuperDirt:initVowels`** → the Vowel quark is missing; install it (A2) and
restart. Likewise, `IIRFilter`/`sc3plugins ... missing` warnings are harmless
(optional UGens) — sample playback still works; install
`supercollider-sc3-plugins` via apt to silence them.

**Reachability.** `ping <pi-ip>` from the Mac. Both 57110 and 57120 are UDP;
they bind to all interfaces (scsynth via `-B 0.0.0.0`; sclang binds its port on
all interfaces by default).

**Firewall.** Raspberry Pi OS has no firewall by default. If you enabled `ufw`:

```bash
sudo ufw allow from <your-mac-ip> to any port 57110 proto udp
sudo ufw allow from <your-mac-ip> to any port 57120 proto udp
```

**`failed to get an audio bus allocated`** → scsynth's audio-bus pool is too
small for the orbits, once split across `maxLogins` clients. The pool is divided
evenly, and client 0's slice must also contain the hardware I/O buses, so sclang
gets `(-a / maxLogins) − (in + out)` channels: `(1024/32) − 16 = 16` with the
unit's original flags — not even 2 orbits fit. Fix by raising `-a` (step A0):
`-a 8192` → `(8192/32) − 16 = 240` channels, enough for 12 orbits. Keep
`numAudioBusChannels` in `sc-startup-pi.scd` equal to scsynth's `-a`, and
restart both scsynth and sclang after changing it.

**`maxLogins`/bus mismatch.** If sclang's tmux log warns that the server's
`maxLogins` doesn't match, or audio is silent/garbled, the option mirror in
`sc-startup-pi.scd` doesn't match the running scsynth. Re-check it against the
systemd `ExecStart` line (`-i -o -a -b -l`) and restart.

**`No more buffer numbers` while loading samples** → `numBuffers` in the
startup is too small; it must equal scsynth's `-b` (262144 here).

**Real-time memory / allocation-failed errors under heavy patterns** → bump
`-m` in the scsynth systemd unit (it's `26144` KB now) and
`sudo systemctl restart scsynth`.

**Changed `config.json`?** Restart `yarn serve` — routes are read at startup.

---

## Pi audio output — "StrudelDirt is up but I hear nothing"

The audio path is `SuperDirt → scsynth → JACK → ALSA → speakers`. Two isolation
tests pin down where it breaks — run them in order.

### Test A — ALSA + speakers (no JACK, no SuperCollider)

scsynth/JACK hold the sound card exclusively, so stop them to test ALSA directly:

```bash
sudo systemctl stop scsynth jackd        # Requires= means stopping jackd also stops scsynth
aplay -l                                  # find YOUR card number — HDMI is usually 0/1; a DAC is higher
alsamixer                                 # 'M' to unmute; raise Master/PCM/Headphone; F6 selects the card
speaker-test -t sine -f 440 -c 2 -D plughw:2,0   # use your card,device (HiFiBerry = card 2 here)
sudo systemctl start scsynth              # restart the stack (pulls jackd back in)
```

- **Tone plays** → hardware, mixer, and output route are fine. Go to Test B.
- **Silence** → fix this first: wrong card in `-D plughw:X,Y`, muted/low in
  `alsamixer`, or wrong output (`sudo raspi-config` → *System Options → Audio*;
  3.5mm vs HDMI).

### Test B — scsynth (the service) → speakers, via sclang (no SuperDirt)

A bare tone on the hardware out (bus 0) — no samples, orbits, or effect buses, so
it can't hit the bus-allocation limits. Proves the scsynth↔JACK path on its own:

```bash
cat > ~/sc-test-tone.scd <<'SCD'
(
// mirror the scsynth service so we attach cleanly
s.options.numAudioBusChannels  = 8192;
s.options.numInputBusChannels  = 8;
s.options.numOutputBusChannels = 8;
s.options.maxLogins            = 32;
s.newAllocators;
s.addr = NetAddr("127.0.0.1", 57110);
s.startAliveThread;
s.doWhenBooted({
    s.notify; s.sync;
    "scsynth reached — 3s tone on out 1/2".postln;
    x = { SinOsc.ar(440, 0, 0.2) ! 2 }.play;   // bus 0 = hardware out 1/2
    SystemClock.sched(3, { x.free; "done".postln; nil });
}, 50, { "scsynth not reachable on 127.0.0.1:57110".error; });
)
SCD
sclang ~/sc-test-tone.scd        # Ctrl-C to quit after the tone
```

- **Tone plays** → the full scsynth→JACK→speakers path works; the silence is
  upstream — see [If both tests pass](#if-both-tests-pass-but-strudeldirt-is-silent).
- **Silence (but Test A worked)** → JACK wiring: scsynth's out ports aren't
  reaching the speakers. Check and, if needed, connect them:
  ```bash
  jack_lsp -c                                          # as nick
  jack_connect SuperCollider:out_1 system:playback_1
  jack_connect SuperCollider:out_2 system:playback_2
  ```
  (`SC_JACK_DEFAULT_OUTPUTS=system` should do this automatically; if `jack_lsp`
  can't reach the server, run it as the user that owns jackd — `nick`.)

### If both tests pass but StrudelDirt is silent

- **Confirm OSC arrives:** `sudo tcpdump -n -i any udp port 57120`, then Play on
  the Mac — expect packets from your Mac's IP. None → network/bridge side
  (firewall, wrong `config.json` target, or `yarn serve` not restarted).
- **Clock skew (remote-only):** the app stamps each `/dirt/play` bundle with the
  **Mac's** wall clock + 200 ms; SuperDirt schedules it against the **Pi's** clock.
  If they differ by more than that margin, events land in the past (dropped) or
  future (silence). Keep both NTP-synced — on the Pi `timedatectl` should say
  *System clock synchronized: yes*.
- Watch the sclang post window while playing for missing-synth/buffer errors.

### Making the DAC the default card (e.g. HiFiBerry)

On a Pi the HDMI audio devices are cards 0/1, so an add-on DAC (HiFiBerry,
USB, …) lands at card 2+ and isn't the default — that's why `speaker-test`
needs `-D plughw:2,0` and `plughw:0,0` (HDMI) fails with `-524` when no display
is attached.

**Your app doesn't depend on the ALSA default** — scsynth goes through JACK, and
JACK's device is set in `/etc/default/jackd` (`JACK_OPTS`). Reference the card
**by name** there so boot enumeration order can't break it:

```
JACK_OPTS="-R -dalsa -dhw:sndrpihifiberry -r48000 -p1024 -n2"   # not -dhw:2
```

To make it the system-wide default too, pick one:

- **Make it card 0 (recommended for a dedicated audio Pi):** disable HDMI *audio*
  (video unaffected) in `/boot/firmware/config.txt` (older OS: `/boot/config.txt`)
  — change `dtoverlay=vc4-kms-v3d` to `dtoverlay=vc4-kms-v3d,noaudio`, then reboot.
  The DAC becomes card 0 and ALSA's `default` points at it. (If `JACK_OPTS` used
  `hw:2`, switch it to `hw:sndrpihifiberry` — it's now card 0.)

- **Keep HDMI audio:** set the default by name in `/etc/asound.conf`:
  ```
  pcm.!default {
      type plug
      slave.pcm { type hw; card sndrpihifiberry; device 0 }
  }
  ctl.!default { type hw; card sndrpihifiberry }
  ```
  (`type plug` converts stereo → the DAC's native format.)

Verify after reboot: `aplay -l`, then `speaker-test -t sine -c 2` (no `-D` — should
hit the DAC), and `systemctl status scsynth` still showing `out_1..8 →
system:playback_1..8`.

## Appendix: run StrudelDirt as a systemd service

For a persistent setup (survives reboots, no tmux), create a service that
starts after scsynth. On the Pi:

```bash
sudo tee /etc/systemd/system/strudeldirt.service >/dev/null <<'UNIT'
[Unit]
Description=StrudelDirt (sclang + SuperDirt) attached to scsynth
After=scsynth.service
Requires=scsynth.service

[Service]
User=nick
Group=audio
# sclang needs a writable HOME for its quark config + class-library cache.
Environment=HOME=/home/nick
ExecStart=/usr/bin/sclang /home/nick/sc-startup-pi.scd
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now strudeldirt.service
journalctl -u strudeldirt.service -f      # watch until "StrudelDirt ready on UDP 57120"
```

> Adjust `ExecStart` if `sclang` isn't at `/usr/bin/sclang` (`command -v sclang`),
> and name the unit to match your scsynth unit's actual name in the
> `After=`/`Requires=` lines (here assumed `scsynth.service`).
