//! The `/clock/*` wire protocol — the cross-language contract.
//!
//! These addresses and argument layouts must match
//! `packages/server-commands/src/commands/clock.ts`. Keep the two in sync.
//! Only ping/pong reach the bridge — the subscribe/tick/status family stays
//! frontend-internal (webview ⇄ worker); the WS pump answers pings inline
//! (`router/ws.rs`), so the round-trip never touches UDP.

use std::time::{SystemTime, UNIX_EPOCH};

use rosc::{OscMessage, OscType};

use crate::core::osc::{self, int_arg};

pub const CLOCK_PING: &str = "/clock/ping";
pub const CLOCK_PONG: &str = "/clock/pong";

/// `/clock/ping seq:i` → the seq to echo; `None` on a malformed message.
pub fn parse_ping(msg: &OscMessage) -> Option<i32> {
    int_arg(msg.args.first()?)
}

/// `/clock/pong seq:i srv:d` — seq echoed, srv from [`unix_ms`].
pub fn encode_pong(seq: i32, srv: f64) -> Vec<u8> {
    osc::encode(CLOCK_PONG, vec![OscType::Int(seq), OscType::Double(srv)])
}

/// The pong timestamp: Unix wall-clock ms as f64 (the estimator's server
/// domain — fractional ms carry the precision).
pub fn unix_ms() -> f64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system time before UNIX epoch")
        .as_secs_f64()
        * 1000.0
}

#[cfg(test)]
mod tests {
    use rosc::{OscBundle, OscPacket, OscTime};

    use super::*;
    use crate::core::osc::{decode_message, peek_address};

    #[test]
    fn ping_and_pong_round_trip() {
        let ping = osc::encode(CLOCK_PING, vec![OscType::Int(7)]);
        let msg = decode_message(&ping).expect("decode ping");
        assert_eq!(parse_ping(&msg), Some(7));

        let pong = encode_pong(7, 1_700_000_000_000.5);
        assert_eq!(
            pong,
            vec![
                0x2f, 0x63, 0x6c, 0x6f, 0x63, 0x6b, 0x2f, 0x70, 0x6f, 0x6e, 0x67, 0x00, 0x2c, 0x69,
                0x64, 0x00, 0x00, 0x00, 0x00, 0x07, 0x42, 0x78, 0xbc, 0xfe, 0x56, 0x80, 0x08, 0x00,
            ]
        );
        let msg = decode_message(&pong).expect("decode pong");
        assert_eq!(msg.addr, CLOCK_PONG);
        assert!(
            matches!(msg.args.as_slice(), [OscType::Int(7), OscType::Double(v)] if *v == 1_700_000_000_000.5)
        );
    }

    #[test]
    fn bundle_whose_first_address_is_ping_is_rejected_by_message_parser() {
        let packet = OscPacket::Bundle(OscBundle {
            timetag: OscTime::from((0, 1)),
            content: vec![OscPacket::Message(OscMessage {
                addr: CLOCK_PING.into(),
                args: vec![OscType::Int(1)],
            })],
        });
        let bytes = rosc::encoder::encode(&packet).expect("encode bundle");
        assert_eq!(peek_address(&bytes), Some(CLOCK_PING));
        assert!(decode_message(&bytes).is_none());
    }
}
