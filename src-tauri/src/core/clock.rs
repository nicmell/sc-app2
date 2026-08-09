//! The `/clock/*` wire protocol — the cross-language contract.
//!
//! These addresses and argument layouts must match
//! `packages/server-commands/src/commands/clock.ts`. Keep the two in sync.

use std::time::{SystemTime, UNIX_EPOCH};

use rosc::{OscMessage, OscType};

use crate::core::osc::{self, int_arg};

pub const CLOCK_PING: &str = "/clock/ping";
pub const CLOCK_PONG: &str = "/clock/pong";

pub fn parse_ping(msg: &OscMessage) -> Option<(i32, f64)> {
    let seq = int_arg(msg.args.first()?)?;
    let OscType::Double(t0) = msg.args.get(1)? else {
        return None;
    };
    Some((seq, *t0))
}

pub fn encode_pong(seq: i32, t0: f64, srv: f64) -> Vec<u8> {
    osc::encode(
        CLOCK_PONG,
        vec![OscType::Int(seq), OscType::Double(t0), OscType::Double(srv)],
    )
}

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
    fn ping_and_pong_round_trip_with_double_times() {
        let ping = osc::encode(CLOCK_PING, vec![OscType::Int(7), OscType::Double(123.25)]);
        let msg = decode_message(&ping).expect("decode ping");
        assert_eq!(parse_ping(&msg), Some((7, 123.25)));

        let pong = encode_pong(7, 123.25, 1_700_000_000_000.5);
        let msg = decode_message(&pong).expect("decode pong");
        assert_eq!(msg.addr, CLOCK_PONG);
        assert!(
            matches!(msg.args.as_slice(), [OscType::Int(7), OscType::Double(123.25), OscType::Double(v)] if *v == 1_700_000_000_000.5)
        );
    }

    #[test]
    fn bundle_whose_first_address_is_ping_is_rejected_by_message_parser() {
        let packet = OscPacket::Bundle(OscBundle {
            timetag: OscTime::from((0, 1)),
            content: vec![OscPacket::Message(OscMessage {
                addr: CLOCK_PING.into(),
                args: vec![OscType::Int(1), OscType::Double(2.0)],
            })],
        });
        let bytes = rosc::encoder::encode(&packet).expect("encode bundle");
        assert_eq!(peek_address(&bytes), Some(CLOCK_PING));
        assert!(decode_message(&bytes).is_none());
    }
}
