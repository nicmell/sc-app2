//! OSC helpers: scsynth command encoders + inbound-reply classification.
//!
//! The bridge registers with scsynth (`/notify 1` → `/done /notify <clientId>`),
//! probes `/version`, and polls `/status` as a liveness heartbeat. Inbound peer
//! packets are decoded once by [`classify_reply`] — the bridge taps the relevant
//! ones for state and forwards everything to clients.

use rosc::{OscMessage, OscPacket, OscType};

/// Encode `/notify <1|0>` — register (`true`) or unregister (`false`) the
/// bridge with scsynth. Registering replies `/done /notify <clientId>`.
pub fn notify_packet(register: bool) -> Vec<u8> {
    encode("/notify", vec![OscType::Int(register as i32)])
}

/// Encode `/status` — scsynth replies `/status.reply` (the liveness heartbeat).
pub fn status_packet() -> Vec<u8> {
    encode("/status", vec![])
}

/// Encode `/version` — scsynth replies `/version.reply` (see [`ScsynthVersion`]).
pub fn version_packet() -> Vec<u8> {
    encode("/version", vec![])
}

fn encode(addr: &str, args: Vec<OscType>) -> Vec<u8> {
    let packet = OscPacket::Message(OscMessage { addr: addr.into(), args });
    // Fixed, valid messages — encoding cannot fail in practice.
    rosc::encoder::encode(&packet).expect("encode OSC message")
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

/// A peer reply the bridge acts on. Every inbound packet is still forwarded to
/// clients verbatim; these variants only drive scsynth registration + liveness.
pub enum Reply {
    /// `/done /notify <clientId>` — the registration ack.
    DoneNotify(i32),
    /// `/version.reply …`.
    Version(ScsynthVersion),
    /// `/status.reply …` — the heartbeat response.
    Status,
    /// Anything else (forwarded, not acted on).
    Other,
}

/// Decode a peer packet **once** and classify it.
pub fn classify_reply(bytes: &[u8]) -> Reply {
    let Ok((_, OscPacket::Message(msg))) = rosc::decoder::decode_udp(bytes) else {
        return Reply::Other;
    };
    match msg.addr.as_str() {
        "/done" => {
            let is_notify = matches!(msg.args.first(), Some(OscType::String(s)) if s == "/notify");
            match msg.args.get(1) {
                Some(arg) if is_notify => osc_int(arg).map_or(Reply::Other, Reply::DoneNotify),
                _ => Reply::Other,
            }
        }
        "/version.reply" => version_from(&msg).map_or(Reply::Other, Reply::Version),
        "/status.reply" => Reply::Status,
        _ => Reply::Other,
    }
}

/// Build a [`ScsynthVersion`] from a decoded `/version.reply` message.
fn version_from(msg: &OscMessage) -> Option<ScsynthVersion> {
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

    fn enc(addr: &str, args: Vec<OscType>) -> Vec<u8> {
        encode(addr, args)
    }

    fn message_of(bytes: &[u8]) -> OscMessage {
        match rosc::decoder::decode_udp(bytes).unwrap().1 {
            OscPacket::Message(m) => m,
            _ => panic!("expected a message"),
        }
    }

    #[test]
    fn packets_encode_expected_addresses() {
        assert_eq!(message_of(&notify_packet(true)).args, vec![OscType::Int(1)]);
        assert_eq!(message_of(&notify_packet(false)).args, vec![OscType::Int(0)]);
        assert_eq!(message_of(&status_packet()).addr, "/status");
        assert_eq!(message_of(&version_packet()).addr, "/version");
    }

    #[test]
    fn classifies_done_notify() {
        let ok = enc("/done", vec![OscType::String("/notify".into()), OscType::Int(7)]);
        assert!(matches!(classify_reply(&ok), Reply::DoneNotify(7)));
        // `/done` for a different command → not the ack.
        let other = enc("/done", vec![OscType::String("/quit".into())]);
        assert!(matches!(classify_reply(&other), Reply::Other));
    }

    #[test]
    fn classifies_version_reply() {
        let bytes = enc(
            "/version.reply",
            vec![
                OscType::String("scsynth".into()),
                OscType::Int(3),
                OscType::Int(13),
                OscType::String(".0".into()),
                OscType::String("main".into()),
                OscType::String("abc1234".into()),
            ],
        );
        match classify_reply(&bytes) {
            Reply::Version(v) => {
                assert_eq!((v.major, v.minor), (3, 13));
                assert_eq!(v.to_string(), "scsynth 3.13.0 (main@abc1234)");
            }
            _ => panic!("expected Version"),
        }
    }

    #[test]
    fn classifies_status_and_other() {
        assert!(matches!(classify_reply(&enc("/status.reply", vec![OscType::Int(1)])), Reply::Status));
        assert!(matches!(classify_reply(&enc("/n_go", vec![])), Reply::Other));
        assert!(matches!(classify_reply(b"garbage"), Reply::Other));
    }
}
