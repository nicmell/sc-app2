//! OSC helpers for the scsynth `/notify` handshake.
//!
//! The bridge registers with scsynth at startup by sending `/notify 1` and
//! waiting for the `/done /notify <clientId>` reply. The OSC *console* logs
//! traffic on the frontend (decoding the raw frames it sends/receives), so the
//! bridge itself just forwards bytes — no decoding or logging lives here.

use rosc::{OscMessage, OscPacket, OscType};

/// Encode `/notify 1` — registers the bridge with scsynth, which replies
/// `/done /notify <clientId>`.
pub fn notify_packet() -> Vec<u8> {
    let packet = OscPacket::Message(OscMessage {
        addr: "/notify".into(),
        args: vec![OscType::Int(1)],
    });
    // A fixed, valid message — encoding cannot fail in practice.
    rosc::encoder::encode(&packet).expect("encode /notify")
}

/// Parse a `/done /notify <clientId>` reply; `None` if it isn't that shape.
pub fn parse_done_notify(bytes: &[u8]) -> Option<i32> {
    let msg = match rosc::decoder::decode_udp(bytes).ok()?.1 {
        OscPacket::Message(m) => m,
        _ => return None,
    };
    if msg.addr != "/done" {
        return None;
    }
    let first = msg.args.first().and_then(|a| match a {
        OscType::String(s) => Some(s.as_str()),
        _ => None,
    });
    if first != Some("/notify") {
        return None;
    }
    match msg.args.get(1) {
        Some(OscType::Int(id)) => Some(*id),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn notify_packet_decodes_to_notify_1() {
        match rosc::decoder::decode_udp(&notify_packet()).unwrap().1 {
            OscPacket::Message(m) => {
                assert_eq!(m.addr, "/notify");
                assert_eq!(m.args, vec![OscType::Int(1)]);
            }
            _ => panic!("expected a message"),
        }
    }

    #[test]
    fn parses_done_notify_client_id() {
        let done = OscPacket::Message(OscMessage {
            addr: "/done".into(),
            args: vec![OscType::String("/notify".into()), OscType::Int(7)],
        });
        let bytes = rosc::encoder::encode(&done).unwrap();
        assert_eq!(parse_done_notify(&bytes), Some(7));
    }

    #[test]
    fn rejects_non_done_notify() {
        let other = OscPacket::Message(OscMessage {
            addr: "/status.reply".into(),
            args: vec![OscType::Int(1)],
        });
        let bytes = rosc::encoder::encode(&other).unwrap();
        assert_eq!(parse_done_notify(&bytes), None);
    }
}
