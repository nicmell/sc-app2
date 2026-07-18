//! scsynth: the SuperCollider server-command protocol plus a supervisor that
//! keeps the bridge registered with a live scsynth.
//!
//! The protocol half encodes the commands with `scserver-commands`' typed
//! constructors and classifies the replies ([`classify_reply`], over the
//! crate's [`ServerReply`] parser).
//! The supervisor half ([`Scsynth`]) rides on a generic
//! [`Bridge`](super::bridge::Bridge): it subscribes to inbound datagrams to
//! track scsynth's state, and sends commands via the bridge. It registers
//! (`/notify`), polls `/status` as a heartbeat, reconnects when scsynth stops
//! answering, and unregisters (`/notify 0`) on shutdown.

use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Duration;

use scserver_commands::commands::{GFreeAll, NFree, Notify, Status};
use scserver_commands::{KnownReply, ServerReply};
use tokio::sync::{broadcast, watch};

use super::bridge::Bridge;

/// Consecutive missed `/status.reply`s before scsynth is considered down.
const MAX_STATUS_MISSES: u32 = 3;
/// scsynth `/status` heartbeat poll interval.
const STATUS_INTERVAL: Duration = Duration::from_secs(1);
/// Delay between reconnection attempts while scsynth is unreachable.
const RETRY_INTERVAL: Duration = Duration::from_secs(1);
/// How long to wait for the `/done /notify` registration ack.
const REPLY_TIMEOUT: Duration = Duration::from_secs(1);

// The per-session node-id/scope-slot partitioning scheme lives in
// [`blocks`](super::blocks) — pure math; this module is the protocol + the
// supervisor.

// ── group-command packet builders ─────────────────────────────────────────
//
// Fixed, well-formed messages — encoding cannot fail in practice.

fn g_free_all_packet(group_id: i32) -> Vec<u8> {
    GFreeAll::new(vec![group_id])
        .encode()
        .expect("encode /g_freeAll")
}

fn n_free_packet(node_id: i32) -> Vec<u8> {
    NFree::new(vec![node_id]).encode().expect("encode /n_free")
}

// ── protocol ────────────────────────────────────────────────────────────

/// Encode `/notify <1|0>` — register (`true`) or unregister (`false`).
fn notify_packet(register: bool) -> Vec<u8> {
    Notify::new(register as i32)
        .encode()
        .expect("encode /notify")
}

/// Encode `/status` — scsynth replies `/status.reply` (the heartbeat).
fn status_packet() -> Vec<u8> {
    Status::new().encode().expect("encode /status")
}

/// A scsynth reply the supervisor acts on (everything is still forwarded to
/// clients by the bridge; these variants only drive registration + liveness,
/// or — for `Fail`/`Late` — get logged).
enum Reply {
    /// `/done /notify <clientId>` — the registration ack.
    DoneNotify(i32),
    /// `/status.reply …` — heartbeat.
    Status,
    /// `/fail <command:str> <error:str> [extras:int…]` — a command failed. Sent
    /// only to the originating client (our bridge), forwarded to all frontends.
    Fail {
        command: String,
        message: String,
        extras: Vec<i32>,
    },
    /// `/late` — a bundle ran late (mostly dormant in scsynth); the lateness
    /// in seconds, computed from the two wire timetags.
    Late(f32),
    /// Anything else.
    Other,
}

/// Decode a peer packet **once** (via the typed [`ServerReply`] parser) and
/// classify it. Malformed replies — decode errors included — are `Other`.
fn classify_reply(bytes: &[u8]) -> Reply {
    let Ok(reply) = ServerReply::decode(bytes) else {
        return Reply::Other;
    };
    match reply {
        ServerReply::Known(KnownReply::Done { command, extras }) if command == "/notify" => {
            // `/done /notify <clientId> [maxLogins]` — the id is the first extra.
            extras
                .first()
                .and_then(|a| a.as_int())
                .map_or(Reply::Other, Reply::DoneNotify)
        }
        ServerReply::Known(KnownReply::StatusReply(_)) => Reply::Status,
        ServerReply::Known(KnownReply::Fail {
            command,
            error,
            extras,
        }) => Reply::Fail {
            command,
            message: if error.is_empty() {
                "(no message)".into()
            } else {
                error
            },
            extras: extras.iter().filter_map(|a| a.as_int()).collect(),
        },
        ServerReply::Known(KnownReply::Late {
            seconds,
            fractions,
            late_secs,
            late_fracs,
        }) => {
            // Two NTP-style timetags (scheduled, executed), each seconds +
            // 1/2^32 fractions; the lateness is their difference.
            let frac = |f: i32| f as u32 as f64 / (u64::from(u32::MAX) + 1) as f64;
            let late = (late_secs as f64 + frac(late_fracs)) - (seconds as f64 + frac(fractions));
            Reply::Late(late as f32)
        }
        _ => Reply::Other,
    }
}

// ── supervisor ──────────────────────────────────────────────────────────

/// Keeps the bridge registered with a live scsynth. Cheap to clone (Arc-backed).
#[derive(Clone)]
pub struct Scsynth {
    inner: Arc<Inner>,
}

struct Inner {
    bridge: Bridge,
    /// The scsynth-assigned client id (`/done /notify`), `None` between
    /// registrations. A `watch` so waiters block on change, not on a poll.
    client_id: watch::Sender<Option<i32>>,
    /// Monotonic count of `/status.reply`s seen — the poller's liveness signal.
    status_replies: AtomicU64,
    /// Bumped on every successful (re)registration — consumers caching
    /// per-connection scsynth state (e.g. the SHM scope mapping) compare
    /// against it to detect a restart and re-derive.
    generation: AtomicU64,
}

impl Scsynth {
    /// Start observing inbound replies and supervising the connection (both in
    /// background tasks). Never blocks.
    pub fn supervise(bridge: Bridge) -> Self {
        let scsynth = Self {
            inner: Arc::new(Inner {
                bridge,
                client_id: watch::Sender::new(None),
                status_replies: AtomicU64::new(0),
                generation: AtomicU64::new(0),
            }),
        };
        // Subscribe synchronously (before any /notify) so an early reply can't
        // be missed, then observe inbound replies into our state.
        let mut inbound = scsynth.inner.bridge.subscribe();
        let observer = scsynth.clone();
        tokio::spawn(async move {
            loop {
                match inbound.recv().await {
                    Ok(bytes) => observer.observe(&bytes),
                    Err(broadcast::error::RecvError::Lagged(_)) => continue,
                    Err(broadcast::error::RecvError::Closed) => break,
                }
            }
        });
        let supervisor = scsynth.clone();
        tokio::spawn(async move { supervisor.run().await });
        scsynth
    }

    /// The scsynth-assigned client id, once registered. The app turns it into
    /// session blocks via [`session_block`].
    pub fn client_id(&self) -> Option<i32> {
        *self.inner.client_id.borrow()
    }

    /// The registration generation: bumped on every successful (re)connect.
    /// Lets consumers detect an scsynth restart and re-derive cached
    /// per-connection state (e.g. the SHM scope mapping).
    pub fn generation(&self) -> u64 {
        self.inner.generation.load(Ordering::Acquire)
    }

    /// Wait for the clientID until registered or `timeout` elapses (a session
    /// may be requested before scsynth is even running — the supervisor keeps
    /// retrying registration, and the frontend retries the 503'd session).
    pub async fn await_client_id(&self, timeout: Duration) -> Option<i32> {
        let mut rx = self.inner.client_id.subscribe();
        let registered = match tokio::time::timeout(timeout, rx.wait_for(Option::is_some)).await {
            Ok(Ok(value)) => *value,
            _ => None,
        };
        registered
    }

    /// Free a group and everything in it (`/g_freeAll` + `/n_free`).
    pub async fn free_group(&self, group_id: i32) {
        self.inner
            .bridge
            .dispatch_command(&g_free_all_packet(group_id))
            .await;
        self.inner
            .bridge
            .dispatch_command(&n_free_packet(group_id))
            .await;
    }

    /// Release our client slot on scsynth (`/notify 0`) — for shutdown. Live
    /// session groups are freed individually first, by [`crate::core::server`].
    pub async fn unregister(&self) {
        if !self.inner.bridge.has_route("/notify") {
            return;
        }
        self.inner
            .bridge
            .dispatch_command(&notify_packet(false))
            .await;
        tracing::info!("sent /notify 0 (unregistered from scsynth)");
    }

    /// Classify one inbound packet and record what it tells us about scsynth.
    fn observe(&self, bytes: &[u8]) {
        match classify_reply(bytes) {
            Reply::DoneNotify(cid) => {
                // Act only on the transition (a duplicate ack must not re-log
                // or bump the generation).
                if self.inner.client_id.send_replace(Some(cid)).is_none() {
                    tracing::info!(client_id = cid, "scsynth registered");
                    self.inner.generation.fetch_add(1, Ordering::AcqRel);
                }
            }
            Reply::Status => {
                self.inner.status_replies.fetch_add(1, Ordering::Relaxed);
            }
            Reply::Fail {
                command,
                message,
                extras,
            } => {
                tracing::warn!(%command, %message, ?extras, "scsynth /fail");
            }
            Reply::Late(seconds) => tracing::warn!(seconds, "scsynth /late bundle"),
            Reply::Other => {}
        }
    }

    /// Supervisor loop: (re)register, poll `/status` until scsynth stops
    /// answering, reconnect. Owns the transition logging so retries don't spam.
    async fn run(&self) {
        if !self.inner.bridge.has_route("/notify") {
            tracing::warn!("no peer matches /notify; scsynth supervision disabled");
            return;
        }
        // `down` = the current outage has already been logged (avoids spam).
        let mut down = false;
        loop {
            self.reset();
            if self.register().await {
                // Connected — `observe` logged "scsynth registered".
                down = false;
                if self.client_id() == Some(0) && self.inner.bridge.has_route("/dirt") {
                    tracing::warn!(
                        "scsynth assigned clientID 0 while a separate sclang/SuperDirt peer exists; \
                         boot scsynth with -maxLogins ≥ 2 so node-id blocks don't overlap"
                    );
                }
                self.poll_status_until_dead().await; // blocks until scsynth dies
            }
            // Not connected (registration failed, or the heartbeat just died).
            if !down {
                tracing::warn!(
                    "scsynth not responding; retrying every {}s",
                    RETRY_INTERVAL.as_secs()
                );
                down = true;
            }
            tokio::time::sleep(RETRY_INTERVAL).await;
        }
    }

    /// One registration attempt: `/notify 1` → wait for the `/done /notify`
    /// ack. Quiet — `observe`/`run` log the transitions.
    async fn register(&self) -> bool {
        self.inner
            .bridge
            .dispatch_command(&notify_packet(true))
            .await;
        // (clientID 0 is valid, so the ack test is "populated", not "> 0".)
        let mut cid = self.inner.client_id.subscribe();
        tokio::time::timeout(REPLY_TIMEOUT, cid.wait_for(Option::is_some))
            .await
            .is_ok_and(|r| r.is_ok())
    }

    /// Poll `/status` until scsynth misses [`MAX_STATUS_MISSES`] consecutive
    /// replies; returns so `run` can reconnect.
    async fn poll_status_until_dead(&self) {
        let mut misses = 0u32;
        loop {
            let before = self.inner.status_replies.load(Ordering::Relaxed);
            self.inner.bridge.dispatch_command(&status_packet()).await;
            tokio::time::sleep(STATUS_INTERVAL).await;
            if self.inner.status_replies.load(Ordering::Relaxed) > before {
                misses = 0;
            } else {
                misses += 1;
                if misses >= MAX_STATUS_MISSES {
                    return;
                }
            }
        }
    }

    /// Clear the registration for a fresh (re)connect attempt. Keeps the
    /// monotonic `status_replies` counter and the `generation`.
    fn reset(&self) {
        self.inner.client_id.send_replace(None);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::osc;
    use crate::core::osc::OscType;

    fn message_of(bytes: &[u8]) -> osc::OscMessage {
        osc::decode_message(bytes).expect("expected a message")
    }

    #[test]
    fn packets_encode_expected_addresses() {
        assert_eq!(message_of(&notify_packet(true)).args, vec![OscType::Int(1)]);
        assert_eq!(
            message_of(&notify_packet(false)).args,
            vec![OscType::Int(0)]
        );
        assert_eq!(message_of(&status_packet()).addr, "/status");
    }

    #[test]
    fn classifies_done_notify() {
        let ok = osc::encode(
            "/done",
            vec![OscType::String("/notify".into()), OscType::Int(7)],
        );
        assert!(matches!(classify_reply(&ok), Reply::DoneNotify(7)));
        let other = osc::encode("/done", vec![OscType::String("/quit".into())]);
        assert!(matches!(classify_reply(&other), Reply::Other));
    }

    #[test]
    fn classifies_status_and_other() {
        // The full 9-arg reply shape — the typed parser rejects less.
        let status = osc::encode(
            "/status.reply",
            vec![
                OscType::Int(1),     // unused
                OscType::Int(12),    // numUgens
                OscType::Int(3),     // numSynths
                OscType::Int(2),     // numGroups
                OscType::Int(5),     // numSynthDefs
                OscType::Float(0.5), // avgCPU
                OscType::Float(1.5), // peakCPU
                OscType::Double(48000.0),
                OscType::Double(48000.01),
            ],
        );
        assert!(matches!(classify_reply(&status), Reply::Status));
        assert!(matches!(
            classify_reply(&osc::encode("/n_go", vec![])),
            Reply::Other
        ));
        assert!(matches!(classify_reply(b"garbage"), Reply::Other));
    }

    #[test]
    fn classifies_fail() {
        // /fail <command> <error> — the common 2-arg form.
        let bytes = osc::encode(
            "/fail",
            vec![
                OscType::String("/s_new".into()),
                OscType::String("SynthDef not found".into()),
            ],
        );
        match classify_reply(&bytes) {
            Reply::Fail {
                command,
                message,
                extras,
            } => {
                assert_eq!(command, "/s_new");
                assert_eq!(message, "SynthDef not found");
                assert!(extras.is_empty());
            }
            _ => panic!("expected Fail"),
        }
        // 3-arg form: a trailing buffer index is captured as an extra.
        let with_extra = osc::encode(
            "/fail",
            vec![
                OscType::String("/b_read".into()),
                OscType::String("File could not be opened".into()),
                OscType::Int(4),
            ],
        );
        match classify_reply(&with_extra) {
            Reply::Fail {
                command, extras, ..
            } => {
                assert_eq!(command, "/b_read");
                assert_eq!(extras, vec![4]);
            }
            _ => panic!("expected Fail"),
        }
    }

    #[test]
    fn classifies_late() {
        // /late <scheduled: secs, fracs> <executed: secs, fracs> — two timetags.
        let bytes = osc::encode(
            "/late",
            vec![
                OscType::Int(100),
                OscType::Int(0),
                OscType::Int(101),
                OscType::Int(0),
            ],
        );
        match classify_reply(&bytes) {
            Reply::Late(seconds) => assert!((seconds - 1.0).abs() < 1e-6),
            _ => panic!("expected Late"),
        }
    }
}
