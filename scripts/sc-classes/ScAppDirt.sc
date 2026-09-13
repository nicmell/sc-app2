// The repo's dirt entry points (PURE-BRIDGE.md §3.2/§3.3): dirt events
// scheduled WITHOUT wall-clock timetags, feeding the quark's own
// DirtEvent pipeline through its public accessors only — the quark
// stays untouched. ONE deliberate difference from the quark's playFunc:
// no `replyAddr` collection (getter-only upstream, and the Tidal reply
// channel has no consumer on our side).
//
// Wire:
//   /dirt/play/in  delta:f  k1 v1 …          delta in ms from arrival
//   /dirt/play/at  tick:i frac:f  k1 v1 …    ABSOLUTE audio-domain target
// `/at` converts through ScAppClock's tick anchor (the shared
// /clock/tick axis) —
// delivery jitter does not move the event; `/in` is the pre-lock
// fallback and the simple path.
ScAppDirt {
    *start { |dirt|
        OSCdef(\scAppDirtPlayIn, { |msg|
            this.play(dirt, msg[1] / 1000, msg[2..]);
        }, '/dirt/play/in');
        OSCdef(\scAppDirtPlayAt, { |msg|
            var latency = ScAppClock.latencyFor(msg[1], msg[2]);
            if(latency.isNil) {
                "ScAppDirt: /dirt/play/at before any /clock/tick — using 0.2".warn;
                latency = 0.2;
            };
            this.play(dirt, latency, msg[3..]);
        }, '/dirt/play/at');
    }

    // The quark playFunc's body, latency already resolved.
    *play { |dirt, latency, pairs|
        var event = (), index;
        if(dirt.dropWhen.value.not) {
            if(latency > dirt.maxLatency) {
                "ScAppDirt: scheduling delta too long (% s) — clamped to 0.2".format(latency).warn;
                latency = 0.2;
            };
            event[\latency] = latency;
            event.putPairs(pairs);
            dirt.receiveAction.value(event);
            index = event[\orbit] ? 0;
            if(dirt.warnOutOfOrbit and: { index >= dirt.orbits.size } or: { index < 0 }) {
                "ScAppDirt: event falls out of existing orbits, index (%)".format(index).warn
            };
            DirtEvent(dirt.orbits @@ index, dirt.modules, event).play
        }
    }
}
