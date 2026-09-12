// The repo's /dirt/play/in entry point (PURE-BRIDGE.md §3.2): dirt
// events carrying their RELATIVE delta (ms) instead of an absolute
// wall-clock timetag — the musical path never touches wall time, so an
// NTP step cannot shift it. Mirrors the quark's own playFunc
// (deps/StrudelDirt/classes/SuperDirt.sc) through its public accessors
// only — the quark stays untouched. ONE deliberate difference: no
// `replyAddr` collection (getter-only upstream, and the Tidal reply
// channel has no consumer on our side).
//
// Wire: /dirt/play/in  delta:f  k1 v1 k2 v2 …   (delta in ms)
ScAppDirt {
    *start { |dirt|
        OSCdef(\scAppDirtPlayIn, { |msg|
            var latency = msg[1] / 1000, event = (), index;
            if(dirt.dropWhen.value.not) {
                if(latency > dirt.maxLatency) {
                    "ScAppDirt: scheduling delta too long (% s) — clamped to 0.2".format(latency).warn;
                    latency = 0.2;
                };
                event[\latency] = latency;
                event.putPairs(msg[2..]);
                dirt.receiveAction.value(event);
                index = event[\orbit] ? 0;
                if(dirt.warnOutOfOrbit and: { index >= dirt.orbits.size } or: { index < 0 }) {
                    "ScAppDirt: event falls out of existing orbits, index (%)".format(index).warn
                };
                DirtEvent(dirt.orbits @@ index, dirt.modules, event).play
            }
        }, '/dirt/play/in');
    }
}
