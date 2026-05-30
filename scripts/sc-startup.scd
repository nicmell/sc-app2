// sclang startup — attach mode.
//
// scsynth's lifecycle is OUTSIDE sclang's control (start-osc.sh boots it
// first; this script attaches to it). So we use `s.doWhenBooted` (polls
// serverRunning) rather than `s.waitForBoot` (which would s.boot a SECOND
// scsynth on top of the external one).
//
// This script just attaches and mounts StrudelDirt on UDP 57120. The
// sample path comes from SC_APP_DIRT_SAMPLES (set by start-strudeldirt.sh
// to deps/Dirt-Samples/*).

(
// scsynth option mirror + allocator rebuild. In attach mode sclang doesn't
// push these to scsynth, but they STILL govern sclang's local allocators
// (numBuffers drives the bufferAllocator) — without this, Dirt-Samples
// loading fails partway with "No more buffer numbers". `newAllocators`
// rebuilds them with the values set here. MUST match start-osc.sh's
// scsynth flags.
s.options.numBuffers = 1024 * 256;        // -b 262144
s.options.memSize = 8192 * 32;            // -m 262144 KB
s.options.numWireBufs = 2048;             // -w 2048
s.options.maxNodes = 1024 * 32;           // -n 32768
s.options.maxLogins = 8;                  // -l 8
s.options.numInputBusChannels = 2;        // -i 2
s.options.numOutputBusChannels = 2;       // -o 2
s.newAllocators;

s.addr = NetAddr("127.0.0.1", 57110);
s.startAliveThread;

// Wait up to ~10 s (50 ticks x 0.2 s) for scsynth's first /status reply.
s.doWhenBooted({
    // Register for async notifications and wait for /done /notify.
    s.notify;
    s.sync;

    // 12 orbits routing to bus 0 (stereo). StrudelDirt exposes the same
    // `SuperDirt` class as upstream SuperDirt. Listens on UDP 57120 — the
    // bridge's `/dirt/* -> 127.0.0.1:57120` route forwards `/dirt/play`.
    ~dirt = SuperDirt(2, s);
    ~dirt.loadSoundFiles("SC_APP_DIRT_SAMPLES".getenv);
    ~dirt.start(57120, 0 ! 12);
    "StrudelDirt ready on UDP 57120".postln;
}, 50, {
    "scsynth not reachable on 127.0.0.1:57110 after 10s.\n  Start it first: yarn osc (boots both scsynth + StrudelDirt).".error;
});
)
