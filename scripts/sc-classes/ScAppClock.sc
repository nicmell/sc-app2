// The wall-clock anchor responder (PURE-BRIDGE.md §3.5): sclang answers
// the frontend's /clock/ping so the bridge stays a pure router (the
// /clock family is an ordinary peer route to this langPort — and it MUST
// be the langPort: the bridge's peer sockets are connect()ed and drop
// replies from any other source port; sendMsg replies from here).
//
// Wire (keep in sync with packages/server-commands/src/commands/clock.ts
// and its codec.test.ts fixture):
//   → /clock/ping  clientId:i seq:i
//   ← /clock/pong  clientId:i seq:i secs:i fracMs:f
//
// clientId/seq are echoed verbatim: every peer datagram rides the
// bridge's broadcast fan-out to ALL sessions, so the id is what lets a
// client pick out its own pongs. The timestamp is
// Date.getDate.rawSeconds — a live system_clock read (sub-µs), NOT
// sclang's outbound-timetag offset (that one resyncs only every 20 s).
// Split int seconds + float32 fractional ms because NetAddr cannot emit
// an OSC double, and a raw f64 Unix-ms squeezed into float32 would
// quantize to ~2 minutes. secs in int32 rolls over in 2038 — accepted.
ScAppClock {
    *start {
        OSCdef(\scAppClockPing, { |msg, time, addr|
            var d = Date.getDate.rawSeconds;
            addr.sendMsg('/clock/pong', msg[1], msg[2], d.trunc.asInteger, (d.frac * 1000));
        }, '/clock/ping');
    }
}
