// sclang's own consumer of the global clock (PURE-BRIDGE.md §3.3): maps
// the ABSOLUTE tick axis (/clock/tick's self-locating index — the same
// stream the frontend's TickTracker counts) onto sclang's logical time,
// so /dirt/play/at targets convert to scheduling latencies in the
// receiver's own domain. Anchor = the minimum of (arrival − tick·P)
// over a sliding window (one-way min-filter: delivery delay only ever
// adds); P is the NOMINAL tick period — the host↔DAC skew (~100 ppm)
// amounts to ~20 µs over a 200 ms lookahead, ignorable. A non-increasing
// tick means the engine or synth restarted: the window empties and
// re-fills (~3.2 s at 20 Hz).
ScAppTickAnchor {
    classvar window, lastTick;
    classvar <period = 0.05;    // 1 / CLOCK_TICK_FREQ_HZ — lockstep with sc-startup
    classvar <windowSize = 64;

    *start {
        window = List.new;
        lastTick = -1;
        OSCdef(\scAppTickAnchor, { |msg, time|
            var tick = msg[3];
            if(tick <= lastTick) { window = List.new };
            lastTick = tick;
            window.add(time - (tick * period));
            if(window.size > windowSize) { window.removeAt(0) };
        }, '/clock/tick');
    }

    // Seconds from now (this thread's logical time) until absolute tick
    // target `tick + frac` — nil while the window is empty (no ticks
    // seen yet).
    *latencyFor { |tick, frac = 0|
        if(window.isNil or: { window.isEmpty }) { ^nil };
        ^window.minItem + ((tick + frac) * period) - thisThread.seconds;
    }
}
