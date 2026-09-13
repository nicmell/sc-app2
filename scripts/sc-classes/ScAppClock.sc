// THE sclang half of the app clock (PURE-BRIDGE.md §3.3/§3.5) — the
// mirror of the frontend's ClockSync: one class owns the whole sync
// story on this side.
//
//   *start(server)  installs and runs the \__global_clock__ synth (the
//                   engine broadcasting its own timeline: Phasor phase
//                   on bus 1000, a 20 Hz SendReply /clock/tick carrying
//                   [PulseCount, phase] — the ABSOLUTE, self-locating
//                   index every consumer counts on), arms the tick
//                   ANCHOR (mapping the absolute tick axis onto sclang's
//                   logical time), and registers the OPTIONAL NTP-style
//                   wall responder.
//   *latencyFor     converts a /dirt/play/at target into a scheduling
//                   latency in sclang's own domain — ScAppDirt's seam.
//
// Anchor = min(arrival − tick·P) over a sliding window (one-way
// min-filter: delivery delay only ever adds); P is the NOMINAL period —
// host↔DAC skew (~100 ppm) is ~20 µs over a 200 ms lookahead, ignorable.
// A non-increasing tick (engine/synth restart, f32 rollover past 2^24)
// empties the window (~3.2 s refill). The NTP responder answers
// /clock/ntp/ping with a live system_clock read (Date.getDate — NOT the
// 20 s-resynced timetag offset), split as int seconds + float32
// fractional ms (NetAddr cannot emit an OSC double; i32 seconds roll
// over in 2038 — accepted). clientId/seq echo verbatim: peer replies
// broadcast to every session, the id picks them apart. Wire pinned by
// packages/server-commands (commands/clock.ts + the codec.test.ts
// fixture). The synth sits at the HEAD of the root group so session
// teardown can never touch it; SendReply is available because this
// graph is sclang-authored (the synthdef-compiler cannot express it).
ScAppClock {
    classvar window, lastTick;
    classvar <period = 0.05;    // 1 / CLOCK_TICK_FREQ_HZ — lockstep with the SynthDef below
    classvar <windowSize = 64;

    *start { |server|
        SynthDef(\__global_clock__, {
            var phase, pkr, tick;
            phase = Phasor.ar(0, 1, 0, 8192, 0);
            Out.ar(1000, phase);
            pkr = A2K.kr(phase);
            tick = Impulse.kr(20, 0);
            SendReply.kr(tick, '/clock/tick', [PulseCount.kr(tick), pkr]);
        }).send(server);
        server.sync;
        Synth.new(\__global_clock__, nil, RootNode(server), \addToHead);

        window = List.new;
        lastTick = -1;
        OSCdef(\scAppClockTick, { |msg, time|
            var tick = msg[3];
            if(tick <= lastTick) { window = List.new };
            lastTick = tick;
            window.add(time - (tick * period));
            if(window.size > windowSize) { window.removeAt(0) };
        }, '/clock/tick');

        OSCdef(\scAppClockNtpPing, { |msg, time, addr|
            var d = Date.getDate.rawSeconds;
            addr.sendMsg('/clock/ntp/pong', msg[1], msg[2], d.trunc.asInteger, (d.frac * 1000));
        }, '/clock/ntp/ping');
    }

    // Seconds from now (this thread's logical time) until absolute tick
    // target `tick + frac` — nil while the window is empty (no ticks
    // seen yet).
    *latencyFor { |tick, frac = 0|
        if(window.isNil or: { window.isEmpty }) { ^nil };
        ^window.minItem + ((tick + frac) * period) - thisThread.seconds;
    }
}
