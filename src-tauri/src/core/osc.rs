//! Generic OSC helpers, shared by every peer/protocol (scsynth, StrudelDirt, …).
//!
//! Thin conveniences over `rosc`: encode a message, decode a single message,
//! read an argument as an int, and peek a packet's address without a full
//! decode (the bridge's routing hot path). Nothing here knows about any
//! specific peer — protocol logic lives with its peer (e.g. [`super::scsynth`]).
//! `rosc`'s message + arg types are re-exported so callers don't depend on
//! `rosc` directly.

use rosc::OscPacket;
pub use rosc::{OscMessage, OscType};

/// Encode an OSC message (`address` + `args`) to bytes.
pub fn encode(addr: &str, args: Vec<OscType>) -> Vec<u8> {
    let packet = OscPacket::Message(OscMessage {
        addr: addr.into(),
        args,
    });
    // A fixed, well-formed message — encoding cannot fail in practice.
    rosc::encoder::encode(&packet).expect("encode OSC message")
}

/// Decode a UDP packet to its [`OscMessage`], or `None` if it isn't a single
/// message (a bundle or malformed bytes).
pub fn decode_message(bytes: &[u8]) -> Option<OscMessage> {
    match rosc::decoder::decode_udp(bytes) {
        Ok((_, OscPacket::Message(msg))) => Some(msg),
        _ => None,
    }
}

/// An OSC int argument as `i32` (accepts both `Int` and `Long`).
pub fn int_arg(arg: &OscType) -> Option<i32> {
    match arg {
        OscType::Int(v) => Some(*v),
        OscType::Long(v) => Some(*v as i32),
        _ => None,
    }
}

/// Read the OSC address from a packet without fully decoding it.
///
/// A bare message starts with its NUL-terminated address string. A bundle
/// starts with `#bundle\0` (8B) + a timetag (8B) + the first element's size
/// (4B) = 20 bytes, after which the first element begins; we recurse into it
/// so a bundle routes by its first message's address. Returns `None` for a
/// malformed/empty packet.
pub fn peek_address(bytes: &[u8]) -> Option<&str> {
    let mut current = bytes;
    loop {
        if current.starts_with(b"#bundle\0") {
            if current.len() < 20 {
                return None;
            }
            current = &current[20..];
            continue;
        }
        let nul = current.iter().position(|&b| b == 0)?;
        if nul == 0 {
            return None;
        }
        return std::str::from_utf8(&current[..nul]).ok();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Encode a minimal OSC message: NUL-terminated, 4-byte-padded address.
    fn osc_msg(address: &str) -> Vec<u8> {
        let mut v = address.as_bytes().to_vec();
        v.push(0);
        while !v.len().is_multiple_of(4) {
            v.push(0);
        }
        v
    }

    #[test]
    fn encode_then_decode_roundtrips() {
        let bytes = encode(
            "/dirt/play",
            vec![OscType::Int(7), OscType::String("hi".into())],
        );
        let msg = decode_message(&bytes).expect("decode");
        assert_eq!(msg.addr, "/dirt/play");
        assert_eq!(int_arg(&msg.args[0]), Some(7));
    }

    #[test]
    fn decode_rejects_garbage() {
        assert!(decode_message(b"garbage").is_none());
    }

    #[test]
    fn int_arg_accepts_int_and_long() {
        assert_eq!(int_arg(&OscType::Int(3)), Some(3));
        assert_eq!(int_arg(&OscType::Long(9)), Some(9));
        assert_eq!(int_arg(&OscType::Float(1.0)), None);
    }

    #[test]
    fn peek_reads_message_address() {
        assert_eq!(peek_address(&osc_msg("/dirt/play")), Some("/dirt/play"));
    }

    #[test]
    fn peek_reads_first_address_in_bundle() {
        let element = osc_msg("/dirt/play");
        let mut pkt = b"#bundle\0".to_vec();
        pkt.extend_from_slice(&[0u8; 8]); // timetag
        pkt.extend_from_slice(&(element.len() as u32).to_be_bytes());
        pkt.extend_from_slice(&element);
        assert_eq!(peek_address(&pkt), Some("/dirt/play"));
    }

    #[test]
    fn peek_rejects_empty_or_truncated() {
        assert_eq!(peek_address(b""), None);
        assert_eq!(peek_address(b"#bundle\0short"), None);
    }
}
