//! OSC helpers for the scsynth `/notify` handshake.
//!
//! The bridge registers with scsynth at startup by sending `/notify 1` and
//! waiting for the `/done /notify <clientId>` reply. The OSC *console* logs
//! traffic on the frontend (decoding the raw frames it sends/receives), so the
//! bridge itself just forwards bytes — no decoding or logging lives here.

use rosc::{OscMessage, OscPacket, OscType};

/// Encode `/notify <1|0>` — register (`true`) or unregister (`false`) the
/// bridge with scsynth. Registering replies `/done /notify <clientId>`.
pub fn notify_packet(register: bool) -> Vec<u8> {
    let packet = OscPacket::Message(OscMessage {
        addr: "/notify".into(),
        args: vec![OscType::Int(register as i32)],
    });
    // A fixed, valid message — encoding cannot fail in practice.
    rosc::encoder::encode(&packet).expect("encode /notify")
}

/// Encode `/status` — scsynth replies with `/status.reply` (used as a liveness
/// heartbeat; see [`is_status_reply`]).
pub fn status_packet() -> Vec<u8> {
    let packet = OscPacket::Message(OscMessage {
        addr: "/status".into(),
        args: vec![],
    });
    rosc::encoder::encode(&packet).expect("encode /status")
}

/// Whether `bytes` is a `/status.reply` message (the heartbeat response).
pub fn is_status_reply(bytes: &[u8]) -> bool {
    matches!(
        rosc::decoder::decode_udp(bytes),
        Ok((_, OscPacket::Message(m))) if m.addr == "/status.reply"
    )
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
    osc_int(msg.args.get(1)?)
}

/// scsynth version, from a `/version.reply` (the SC server-command protocol:
/// `progName major:int minor:int patch:str branch:str commitHash:str`).
#[derive(Debug, Clone)]
pub struct ScsynthVersion {
    pub prog_name: String,
    pub major: i32,
    pub minor: i32,
    /// SC reports the patch as a string (e.g. `".0"`) — kept verbatim.
    pub patch: String,
    pub branch: String,
    pub commit_hash: String,
}

impl std::fmt::Display for ScsynthVersion {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} {}.{}{}", self.prog_name, self.major, self.minor, self.patch)?;
        if !self.branch.is_empty() || !self.commit_hash.is_empty() {
            write!(f, " ({}@{})", self.branch, self.commit_hash)?;
        }
        Ok(())
    }
}

/// Encode `/version` — scsynth replies with `/version.reply` (see
/// [`parse_version_reply`]).
pub fn version_packet() -> Vec<u8> {
    let packet = OscPacket::Message(OscMessage {
        addr: "/version".into(),
        args: vec![],
    });
    rosc::encoder::encode(&packet).expect("encode /version")
}

/// Parse a `/version.reply` message; `None` if it isn't that shape.
pub fn parse_version_reply(bytes: &[u8]) -> Option<ScsynthVersion> {
    let msg = match rosc::decoder::decode_udp(bytes).ok()?.1 {
        OscPacket::Message(m) => m,
        _ => return None,
    };
    if msg.addr != "/version.reply" {
        return None;
    }
    let string_at = |i: usize, default: &str| match msg.args.get(i) {
        Some(OscType::String(s)) => s.clone(),
        _ => default.to_string(),
    };
    Some(ScsynthVersion {
        prog_name: string_at(0, "scsynth"),
        major: osc_int(msg.args.get(1)?)?,
        minor: osc_int(msg.args.get(2)?)?,
        patch: string_at(3, ""),
        branch: string_at(4, ""),
        commit_hash: string_at(5, ""),
    })
}

/// An OSC int argument as `i32` (accepts both `Int` and `Long`).
fn osc_int(arg: &OscType) -> Option<i32> {
    match arg {
        OscType::Int(v) => Some(*v),
        OscType::Long(v) => Some(*v as i32),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn message_of(bytes: &[u8]) -> OscMessage {
        match rosc::decoder::decode_udp(bytes).unwrap().1 {
            OscPacket::Message(m) => m,
            _ => panic!("expected a message"),
        }
    }

    #[test]
    fn notify_packet_carries_register_flag() {
        let on = message_of(&notify_packet(true));
        assert_eq!(on.addr, "/notify");
        assert_eq!(on.args, vec![OscType::Int(1)]);
        let off = message_of(&notify_packet(false));
        assert_eq!(off.args, vec![OscType::Int(0)]);
    }

    #[test]
    fn status_packet_and_reply_detection() {
        let m = message_of(&status_packet());
        assert_eq!(m.addr, "/status");
        assert!(m.args.is_empty());

        let reply = rosc::encoder::encode(&OscPacket::Message(OscMessage {
            addr: "/status.reply".into(),
            args: vec![OscType::Int(1), OscType::Int(0)],
        }))
        .unwrap();
        assert!(is_status_reply(&reply));
        assert!(!is_status_reply(&status_packet())); // /status is not /status.reply
        assert!(!is_status_reply(b"garbage"));
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

    #[test]
    fn version_packet_decodes_to_version() {
        match rosc::decoder::decode_udp(&version_packet()).unwrap().1 {
            OscPacket::Message(m) => {
                assert_eq!(m.addr, "/version");
                assert!(m.args.is_empty());
            }
            _ => panic!("expected a message"),
        }
    }

    #[test]
    fn parses_version_reply() {
        let reply = OscPacket::Message(OscMessage {
            addr: "/version.reply".into(),
            args: vec![
                OscType::String("scsynth".into()),
                OscType::Int(3),
                OscType::Int(13),
                OscType::String(".0".into()),
                OscType::String("main".into()),
                OscType::String("abc1234".into()),
            ],
        });
        let bytes = rosc::encoder::encode(&reply).unwrap();
        let v = parse_version_reply(&bytes).expect("parse");
        assert_eq!(v.prog_name, "scsynth");
        assert_eq!((v.major, v.minor), (3, 13));
        assert_eq!(v.patch, ".0");
        assert_eq!(v.to_string(), "scsynth 3.13.0 (main@abc1234)");
        // Wrong address → None.
        let other = rosc::encoder::encode(&OscPacket::Message(OscMessage {
            addr: "/status.reply".into(),
            args: vec![],
        }))
        .unwrap();
        assert!(parse_version_reply(&other).is_none());
    }
}
