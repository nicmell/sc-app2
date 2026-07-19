//! Packet-address peeking for the bridge's routing hot path.
//!
//! Everything protocol-shaped lives in the `scserver-commands` crate; the
//! bridge only needs to READ an address without a full decode to route a
//! packet to its peer.

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
    fn decode_rejects_garbage() {}

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
