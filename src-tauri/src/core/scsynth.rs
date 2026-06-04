//! scsynth: the SuperCollider server-command protocol plus a supervisor that
//! keeps the bridge registered with a live scsynth.
//!
//! The protocol half encodes `/notify`, `/status`, `/version` (via the generic
//! [`osc`](super::osc) helpers) and classifies the replies ([`classify_reply`]).
//! The supervisor half ([`Scsynth`]) rides on a generic
//! [`Bridge`](super::bridge::Bridge): it subscribes to inbound datagrams to
//! track scsynth's state, and sends commands via the bridge. It registers
//! (`/notify` → `/version`), polls `/status` as a heartbeat, reconnects when
//! scsynth stops answering, and unregisters (`/notify 0`) on shutdown.

use std::sync::{Arc, Mutex};
use std::time::Duration;

use tokio::sync::broadcast;

use super::bridge::Bridge;
use super::ids::root_group_id;
use super::osc::{self, OscMessage, OscType};

/// `/g_new` add-action: add the new group to the tail of the target group.
const ADD_TO_TAIL: i32 = 1;

/// scsynth `/status` heartbeat poll interval.
const STATUS_INTERVAL: Duration = Duration::from_secs(2);
/// Consecutive missed `/status.reply`s before scsynth is considered down.
const MAX_STATUS_MISSES: u32 = 3;
/// Delay between reconnection attempts while scsynth is unreachable.
const RETRY_INTERVAL: Duration = Duration::from_secs(2);
/// How long to wait for a `/done /notify` or `/version.reply`.
const REPLY_TIMEOUT: Duration = Duration::from_secs(2);

// ── protocol ────────────────────────────────────────────────────────────

/// Encode `/notify <1|0>` — register (`true`) or unregister (`false`).
fn notify_packet(register: bool) -> Vec<u8> {
    osc::encode("/notify", vec![OscType::Int(register as i32)])
}

/// Encode `/status` — scsynth replies `/status.reply` (the heartbeat).
fn status_packet() -> Vec<u8> {
    osc::encode("/status", vec![])
}

/// Encode `/version` — scsynth replies `/version.reply`.
fn version_packet() -> Vec<u8> {
    osc::encode("/version", vec![])
}

/// scsynth version from a `/version.reply` (SC protocol:
/// `progName major:int minor:int patch:str branch:str commitHash:str`).
#[derive(Debug, Clone)]
struct Version {
    prog_name: String,
    major: i32,
    minor: i32,
    /// SC reports the patch as a string (e.g. `".0"`) — kept verbatim.
    patch: String,
    branch: String,
    commit_hash: String,
}

impl std::fmt::Display for Version {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} {}.{}{}", self.prog_name, self.major, self.minor, self.patch)?;
        if !self.branch.is_empty() || !self.commit_hash.is_empty() {
            write!(f, " ({}@{})", self.branch, self.commit_hash)?;
        }
        Ok(())
    }
}

/// A scsynth reply the supervisor acts on (everything is still forwarded to
/// clients by the bridge; these variants only drive registration + liveness).
enum Reply {
    /// `/done /notify <clientId>` — the registration ack.
    DoneNotify(i32),
    /// `/version.reply …`.
    Version(Version),
    /// `/status.reply …` — heartbeat.
    Status,
    /// Anything else.
    Other,
}

/// Decode a peer packet **once** and classify it.
fn classify_reply(bytes: &[u8]) -> Reply {
    let Some(msg) = osc::decode_message(bytes) else {
        return Reply::Other;
    };
    match msg.addr.as_str() {
        "/done" => {
            let is_notify = matches!(msg.args.first(), Some(OscType::String(s)) if s == "/notify");
            match msg.args.get(1) {
                Some(arg) if is_notify => osc::int_arg(arg).map_or(Reply::Other, Reply::DoneNotify),
                _ => Reply::Other,
            }
        }
        "/version.reply" => version_from(&msg).map_or(Reply::Other, Reply::Version),
        "/status.reply" => Reply::Status,
        _ => Reply::Other,
    }
}

fn version_from(msg: &OscMessage) -> Option<Version> {
    let string_at = |i: usize, default: &str| match msg.args.get(i) {
        Some(OscType::String(s)) => s.clone(),
        _ => default.to_string(),
    };
    Some(Version {
        prog_name: string_at(0, "scsynth"),
        major: osc::int_arg(msg.args.get(1)?)?,
        minor: osc::int_arg(msg.args.get(2)?)?,
        patch: string_at(3, ""),
        branch: string_at(4, ""),
        commit_hash: string_at(5, ""),
    })
}

// ── supervisor ──────────────────────────────────────────────────────────

/// What scsynth has told us. "running" once both the client id
/// (`/done /notify`) and the version (`/version.reply`) are in; `alive` then
/// tracks the `/status` heartbeat.
#[derive(Default)]
struct State {
    client_id: Option<i32>,
    version: Option<Version>,
    /// Set true (and logged once) when both fields are first present.
    running: bool,
    /// Whether scsynth is currently responding to the `/status` heartbeat.
    alive: bool,
    /// Monotonic count of `/status.reply`s seen — the poller's liveness signal.
    status_replies: u64,
}

/// Keeps the bridge registered with a live scsynth. Cheap to clone (Arc-backed).
#[derive(Clone)]
pub struct Scsynth {
    inner: Arc<Inner>,
}

struct Inner {
    bridge: Bridge,
    state: Mutex<State>,
}

impl Scsynth {
    /// Start observing inbound replies and supervising the connection (both in
    /// background tasks). Never blocks.
    pub fn supervise(bridge: Bridge) -> Self {
        let scsynth = Self {
            inner: Arc::new(Inner {
                bridge,
                state: Mutex::new(State::default()),
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

    /// The scsynth-assigned client id, once registered. Sessions derive their
    /// node-id block and group ids from it (see [`super::ids`]).
    pub fn client_id(&self) -> Option<i32> {
        self.inner.state.lock().unwrap().client_id
    }

    /// Free the per-client root group (and everything in it) then release our
    /// client slot on scsynth (`/notify 0`) — for shutdown.
    pub async fn unregister(&self) {
        if !self.inner.bridge.has_route("/notify") {
            return;
        }
        if let Some(cid) = self.client_id() {
            let root = root_group_id(cid);
            self.inner
                .bridge
                .dispatch_command(&osc::encode("/g_freeAll", vec![OscType::Int(root)]))
                .await;
            self.inner
                .bridge
                .dispatch_command(&osc::encode("/n_free", vec![OscType::Int(root)]))
                .await;
            tracing::info!(root_group = root, "freed bridge root group");
        }
        self.inner.bridge.dispatch_command(&notify_packet(false)).await;
        tracing::info!("sent /notify 0 (unregistered from scsynth)");
    }

    /// Create the per-client root group under scsynth's root group (AddToTail of
    /// group 0, so it runs after sclang/SuperDirt). Every session group nests in
    /// it, and shutdown frees it wholesale. Idempotent-ish: a second `/g_new`
    /// with the same id is rejected by scsynth with a harmless `/fail`.
    async fn create_root_group(&self) {
        let Some(cid) = self.client_id() else {
            return;
        };
        if cid == 0 && self.inner.bridge.has_route("/dirt") {
            tracing::warn!(
                "scsynth assigned clientID 0 while a separate sclang/SuperDirt peer exists; \
                 boot scsynth with -maxLogins ≥ 2 so node-id blocks don't overlap"
            );
        }
        let root = root_group_id(cid);
        let pkt = osc::encode(
            "/g_new",
            vec![OscType::Int(root), OscType::Int(ADD_TO_TAIL), OscType::Int(0)],
        );
        self.inner.bridge.dispatch_command(&pkt).await;
        tracing::info!(client_id = cid, root_group = root, "created bridge root group");
    }

    /// Classify one inbound packet and record what it tells us about scsynth.
    fn observe(&self, bytes: &[u8]) {
        match classify_reply(bytes) {
            Reply::DoneNotify(cid) => self.record(|s| s.client_id = Some(cid)),
            Reply::Version(v) => self.record(|s| s.version = Some(v)),
            Reply::Status => self.inner.state.lock().unwrap().status_replies += 1,
            Reply::Other => {}
        }
    }

    /// Apply a state update; once both the client id and version are present,
    /// flag running and log it once.
    fn record(&self, update: impl FnOnce(&mut State)) {
        let mut s = self.inner.state.lock().unwrap();
        update(&mut s);
        if !s.running && s.client_id.is_some() && s.version.is_some() {
            s.running = true;
            let client_id = s.client_id.unwrap();
            let version = s.version.as_ref().unwrap();
            tracing::info!(client_id, %version, "scsynth running");
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
                // Connected — `record` logged "scsynth running …".
                down = false;
                // (Re)create our root group; session groups nest under it.
                self.create_root_group().await;
                self.set_alive(true);
                self.poll_status_until_dead().await; // blocks until scsynth dies
                self.set_alive(false);
            }
            // Not connected (registration failed, or the heartbeat just died).
            if !down {
                tracing::warn!("scsynth not responding; retrying every {}s", RETRY_INTERVAL.as_secs());
                down = true;
            }
            tokio::time::sleep(RETRY_INTERVAL).await;
        }
    }

    /// One registration attempt: `/notify 1` → wait for the `/done /notify` ack
    /// (so the version round-trip runs against a registered client) → `/version`
    /// → wait until `record` flags running. Quiet — `run` logs transitions.
    async fn register(&self) -> bool {
        self.inner.bridge.dispatch_command(&notify_packet(true)).await;
        // (clientID 0 is valid, so the ack test is "populated", not "> 0".)
        if !self.await_state(REPLY_TIMEOUT, |s| s.client_id.is_some()).await {
            return false;
        }
        self.inner.bridge.dispatch_command(&version_packet()).await;
        self.await_state(REPLY_TIMEOUT, |s| s.running).await
    }

    /// Poll `/status` until scsynth misses [`MAX_STATUS_MISSES`] consecutive
    /// replies; returns so `run` can reconnect.
    async fn poll_status_until_dead(&self) {
        let mut misses = 0u32;
        loop {
            let before = self.inner.state.lock().unwrap().status_replies;
            self.inner.bridge.dispatch_command(&status_packet()).await;
            tokio::time::sleep(STATUS_INTERVAL).await;
            if self.inner.state.lock().unwrap().status_replies > before {
                misses = 0;
            } else {
                misses += 1;
                if misses >= MAX_STATUS_MISSES {
                    return;
                }
            }
        }
    }

    /// Poll the state until `pred` holds or `timeout` elapses.
    async fn await_state(&self, timeout: Duration, pred: impl Fn(&State) -> bool) -> bool {
        tokio::time::timeout(timeout, async {
            while !pred(&self.inner.state.lock().unwrap()) {
                tokio::time::sleep(Duration::from_millis(25)).await;
            }
        })
        .await
        .is_ok()
    }

    /// Clear the registration fields for a fresh (re)connect attempt. Keeps the
    /// monotonic `status_replies` counter and the `alive` flag.
    fn reset(&self) {
        let mut s = self.inner.state.lock().unwrap();
        s.client_id = None;
        s.version = None;
        s.running = false;
    }

    fn set_alive(&self, alive: bool) {
        self.inner.state.lock().unwrap().alive = alive;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn message_of(bytes: &[u8]) -> OscMessage {
        osc::decode_message(bytes).expect("expected a message")
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
        let ok = osc::encode("/done", vec![OscType::String("/notify".into()), OscType::Int(7)]);
        assert!(matches!(classify_reply(&ok), Reply::DoneNotify(7)));
        let other = osc::encode("/done", vec![OscType::String("/quit".into())]);
        assert!(matches!(classify_reply(&other), Reply::Other));
    }

    #[test]
    fn classifies_version_reply() {
        let bytes = osc::encode(
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
        assert!(matches!(classify_reply(&osc::encode("/status.reply", vec![OscType::Int(1)])), Reply::Status));
        assert!(matches!(classify_reply(&osc::encode("/n_go", vec![])), Reply::Other));
        assert!(matches!(classify_reply(b"garbage"), Reply::Other));
    }
}
