//! OSC wire layer: `OscMessage` (one address + arg list).
//!
//! Thin wrappers over [`rosc`]. Each server command is one OSC message
//! (address + typed arg list); OSC bundles are used only by the NRT
//! score format, which lives in [`crate::nrt`].

use rosc::{OscMessage as RoscMessage, OscPacket, OscType};

use crate::CommandError;

/// A single OSC wire message — address plus ordered typed args. Used as
/// the low-level representation commands encode to and replies decode
/// from.
#[derive(Debug, Clone, PartialEq)]
pub struct OscMessage {
    pub address: String,
    pub args: Vec<OscType>,
}

impl OscMessage {
    pub fn new(address: impl Into<String>) -> Self {
        Self {
            address: address.into(),
            args: Vec::new(),
        }
    }

    pub fn with_args(address: impl Into<String>, args: Vec<OscType>) -> Self {
        Self {
            address: address.into(),
            args,
        }
    }

    /// Append one argument and return self. Accepts anything that converts
    /// into [`OscType`] — numeric literals, `String`, `&str`, `Vec<u8>`, etc.
    pub fn arg(mut self, value: impl Into<OscType>) -> Self {
        self.args.push(value.into());
        self
    }

    /// Encode as a raw OSC UDP packet.
    pub fn encode(&self) -> Result<Vec<u8>, CommandError> {
        let msg = RoscMessage {
            addr: self.address.clone(),
            args: self.args.clone(),
        };
        rosc::encoder::encode(&OscPacket::Message(msg))
            .map_err(|e| CommandError::OscEncode(format!("{e:?}")))
    }

    /// Decode a raw OSC UDP packet, accepting only plain messages. Bundles
    /// are rejected — use the NRT score reader for those.
    pub fn decode(bytes: &[u8]) -> Result<Self, CommandError> {
        let packet = rosc::decoder::decode_udp(bytes)
            .map_err(|e| CommandError::OscDecode(format!("{e:?}")))?;
        match packet.1 {
            OscPacket::Message(m) => Ok(Self {
                address: m.addr,
                args: m.args,
            }),
            OscPacket::Bundle(_) => Err(CommandError::Custom(
                "expected OSC message, got bundle".into(),
            )),
        }
    }
}

/// NTP timetag from a wall-clock Unix timestamp in milliseconds (what
/// `Date.now()` yields): Unix seconds + the 1900↔1970 NTP epoch offset,
/// fractional = sub-second × 2³². Total — negative or non-finite input
/// clamps to the OSC "immediate" tag `(0, 1)` (the component boundary
/// exposes this as a plain function, so it cannot fail).
pub fn ntp_from_unix_ms(ms: f64) -> rosc::OscTime {
    use std::time::{Duration, UNIX_EPOCH};
    const IMMEDIATE: rosc::OscTime = rosc::OscTime {
        seconds: 0,
        fractional: 1,
    };
    if !ms.is_finite() || ms < 0.0 {
        return IMMEDIATE;
    }
    rosc::OscTime::try_from(UNIX_EPOCH + Duration::from_secs_f64(ms / 1000.0)).unwrap_or(IMMEDIATE)
}

impl From<OscMessage> for RoscMessage {
    fn from(m: OscMessage) -> Self {
        RoscMessage {
            addr: m.address,
            args: m.args,
        }
    }
}

impl From<RoscMessage> for OscMessage {
    fn from(m: RoscMessage) -> Self {
        OscMessage {
            address: m.addr,
            args: m.args,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trip_status_message() {
        let msg = OscMessage::new("/status");
        let bytes = msg.encode().unwrap();
        let back = OscMessage::decode(&bytes).unwrap();
        assert_eq!(back.address, "/status");
        assert_eq!(back.args.len(), 0);
    }

    #[test]
    fn ntp_from_unix_ms_applies_the_epoch_offset() {
        let t = ntp_from_unix_ms(0.0);
        assert_eq!((t.seconds, t.fractional), (2_208_988_800, 0));
        // Half a second lands halfway through the 2^32 fractional range.
        let t = ntp_from_unix_ms(1500.0);
        assert_eq!(t.seconds, 2_208_988_801);
        assert!((t.fractional as f64 - 2f64.powi(31)).abs() < 2f64.powi(22)); // ~1ms slack
    }

    #[test]
    fn ntp_from_unix_ms_clamps_invalid_input_to_immediate() {
        for ms in [-1.0, f64::NAN, f64::INFINITY] {
            let t = ntp_from_unix_ms(ms);
            assert_eq!((t.seconds, t.fractional), (0, 1));
        }
    }

    #[test]
    fn round_trip_s_new_message() {
        let msg = OscMessage::new("/s_new")
            .arg("sine")
            .arg(1001i32)
            .arg(0i32)
            .arg(1i32)
            .arg("freq")
            .arg(440.0f32);
        let back = OscMessage::decode(&msg.encode().unwrap()).unwrap();
        assert_eq!(back.args.len(), 6);
        match &back.args[0] {
            OscType::String(s) => assert_eq!(s, "sine"),
            _ => panic!("expected String"),
        }
    }
}
