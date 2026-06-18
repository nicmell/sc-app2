// StrudelDirt attach-mode startup for the Raspberry Pi systemd service.
//
// Attaches to the ALREADY-RUNNING scsynth on UDP 57110 (the scsynth.service
// unit) and mounts SuperDirt on UDP 57120 — it never boots its own scsynth.
// Run headless by strudeldirt.service via:
//   tail -f /dev/null | sclang scripts/rpi/strudeldirt-attach.scd
// (the `tail` keeps sclang's stdin open so it doesn't quit on EOF — there is
// no TTY under systemd). Uses the user's default sclang config, so the
// installed Vowel + StrudelDirt quarks are on the class path.
//
// The option mirror below MUST match scsynth.service's flags. In ATTACH mode
// sclang doesn't push these to scsynth, but they still drive sclang's LOCAL
// bus/buffer allocators — a mismatch makes SuperDirt hand out "private" audio
// buses that overlap scsynth's real hardware outs, or fail buffer allocation.
(
s.options.numInputBusChannels  = 8;       // -i 8
s.options.numOutputBusChannels = 8;       // -o 8
s.options.numAudioBusChannels  = 8192;    // -a 8192
s.options.numBuffers           = 262144;  // -b 262144
s.options.memSize              = 26144;   // -m 26144 (KB)
s.options.maxLogins            = 32;      // -l 32
s.newAllocators;

s.addr = NetAddr("127.0.0.1", 57110);
s.startAliveThread;

// Wait up to ~20 s (100 ticks x 0.2 s) for scsynth's first /status reply.
s.doWhenBooted({
    s.notify;
    s.sync;
    "scsynth reached + /notify registered (clientID=%)".format(s.clientID).postln;

    ~dirt = SuperDirt(2, s);
    // Optional sample library — set SC_APP_DIRT_SAMPLES in the service unit
    // (e.g. /path/to/Dirt-Samples/*) to enable sample-based events.
    "SC_APP_DIRT_SAMPLES".getenv !? { |glob| ~dirt.loadSoundFiles(glob) };
    ~dirt.start(57120, 0 ! 12);           // 12 orbits -> bus 0 (stereo)
    "STRUDELDIRT_READY on UDP 57120 (12 orbits)".postln;
}, 100, {
    // Let systemd Restart=on-failure retry until scsynth is reachable.
    "STRUDELDIRT_FAIL: scsynth not reachable on 127.0.0.1:57110".error;
    1.exit;
});
)
