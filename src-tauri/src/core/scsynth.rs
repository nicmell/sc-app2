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

use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use tokio::sync::{broadcast, watch};

use super::bridge::Bridge;
use super::osc::{self, OscMessage, OscType};

/// Consecutive missed `/status.reply`s before scsynth is considered down.
const MAX_STATUS_MISSES: u32 = 3;
/// scsynth `/status` heartbeat poll interval.
const STATUS_INTERVAL: Duration = Duration::from_secs(1);
/// Delay between reconnection attempts while scsynth is unreachable.
const RETRY_INTERVAL: Duration = Duration::from_secs(1);
/// How long to wait for a `/done /notify` or `/version.reply`.
const REPLY_TIMEOUT: Duration = Duration::from_secs(1);

// ── node-id partitioning ─────────────────────────────────────────────────
//
// scsynth partitions the node-ID space by client: client `cid` owns
// `[cid << 26, (cid+1) << 26)`. We carve our slice into fixed-size per-session
// sub-blocks (`base + index*SPAN`), so every synth a session creates has a
// server-assigned id that can't collide with another session, another scsynth
// client (sclang/SuperDirt at clientID 0), or the default groups. The app
// layer ([`crate::server`]) allocates the per-session `index`; the scheme
// itself lives here, with scsynth's protocol. The session *group* (`/g_new` at
// the tail of scsynth's root group 0) is created by the frontend once its
// WebSocket is open — the bridge only frees groups (session end / shutdown).

/// Bits a client's node-ID block occupies — matches SuperCollider's allocator.
const ID_SHIFT: u32 = 26;
/// Node IDs reserved per session (group id + this many synth ids). 2^16 →
/// 1024 sessions per client within the 2^26 block.
const SESSION_SPAN: i32 = 1 << 16;

/// A session's allocated slice: its group id and the contiguous synth-id range
/// the frontend allocates from.
#[derive(Debug, Clone, Copy)]
pub struct SessionBlock {
    /// Group id for this session (also the start of its sub-block).
    pub group_id: i32,
    /// First synth node id the frontend may allocate.
    pub node_base: i32,
    /// How many synth node ids the frontend may allocate.
    pub node_count: i32,
    /// scsynth scope-buffer index this session's master-out tap writes to (and
    /// the frontend subscribes to). Per-session so concurrent windows don't
    /// stomp the same SHM scope buffer; see [`SCOPE_BUFFER_COUNT`].
    pub scope_index: i32,
}

/// scsynth allocates this many scope buffers at boot — the per-session scope
/// index wraps within this range (mirrors the SHM reader's expectation).
pub const SCOPE_BUFFER_COUNT: u32 = 128;

/// The [`SessionBlock`] for session `index` (1-based) of client `cid`.
pub fn session_block(cid: i32, index: u32) -> SessionBlock {
    let group_id = (cid << ID_SHIFT) + (index as i32) * SESSION_SPAN;
    SessionBlock {
        group_id,
        node_base: group_id + 1,
        node_count: SESSION_SPAN - 1,
        // 1-based index → 0-based scope buffer, wrapped into scsynth's pool.
        scope_index: (index.saturating_sub(1) % SCOPE_BUFFER_COUNT) as i32,
    }
}

// ── group-command packet builders ─────────────────────────────────────────

fn g_free_all_packet(group_id: i32) -> Vec<u8> {
    osc::encode("/g_freeAll", vec![OscType::Int(group_id)])
}

fn n_free_packet(node_id: i32) -> Vec<u8> {
    osc::encode("/n_free", vec![OscType::Int(node_id)])
}

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
/// clients by the bridge; these variants only drive registration + liveness,
/// or — for `Fail`/`Late` — get logged).
enum Reply {
    /// `/done /notify <clientId>` — the registration ack.
    DoneNotify(i32),
    /// `/version.reply …`.
    Version(Version),
    /// `/status.reply …` — heartbeat.
    Status,
    /// `/fail <command:str> <error:str> [extras:int…]` — a command failed. Sent
    /// only to the originating client (our bridge), forwarded to all frontends.
    Fail {
        command: String,
        message: String,
        extras: Vec<i32>,
    },
    /// `/late <seconds:float>` — a bundle ran late (mostly dormant in scsynth).
    Late(f32),
    /// Anything else.
    Other,
}

/// Read an OSC arg as a string, or `None` if absent/not a string.
fn string_arg(arg: Option<&OscType>) -> Option<String> {
    match arg {
        Some(OscType::String(s)) => Some(s.clone()),
        _ => None,
    }
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
        "/fail" => Reply::Fail {
            // SC protocol: /fail <commandAddress:str> <errorString:str> [extras…].
            command: string_arg(msg.args.first()).unwrap_or_else(|| "?".into()),
            message: string_arg(msg.args.get(1)).unwrap_or_else(|| "(no message)".into()),
            extras: msg.args.iter().skip(2).filter_map(osc::int_arg).collect(),
        },
        "/late" => match msg.args.first() {
            Some(OscType::Float(s)) => Reply::Late(*s),
            Some(OscType::Double(s)) => Reply::Late(*s as f32),
            _ => Reply::Late(0.0),
        },
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

/// What scsynth has told us (the mutex-guarded part; the client id and the
/// "running" flag live in `watch` channels so waiters are event-driven).
#[derive(Default)]
struct State {
    version: Option<Version>,
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
    /// The scsynth-assigned client id (`/done /notify`), `None` between
    /// registrations. A `watch` so waiters block on change, not on a poll.
    client_id: watch::Sender<Option<i32>>,
    /// True once both the client id and the version are in for the current
    /// registration.
    running: watch::Sender<bool>,
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
                state: Mutex::new(State::default()),
                client_id: watch::Sender::new(None),
                running: watch::Sender::new(false),
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

    /// Wait — without a timeout — for the first successful registration
    /// (`/done /notify`). The composition root gates the HTTP listener on this,
    /// so clients never reach a server whose scsynth side hasn't come up once;
    /// later outages stay with the supervisor's reconnect loop. Returns
    /// immediately when no peer routes `/notify` (supervision is disabled and
    /// the wait would never resolve).
    pub async fn await_registration(&self) {
        if !self.inner.bridge.has_route("/notify") {
            return;
        }
        let mut rx = self.inner.client_id.subscribe();
        let _ = rx.wait_for(Option::is_some).await;
    }

    /// Wait for the clientID until registered or `timeout` elapses (a session
    /// created right after boot may arrive before `/notify` completes).
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
        self.inner.bridge.dispatch_command(&g_free_all_packet(group_id)).await;
        self.inner.bridge.dispatch_command(&n_free_packet(group_id)).await;
    }

    /// Release our client slot on scsynth (`/notify 0`) — for shutdown. Live
    /// session groups are freed individually first, by [`crate::server`].
    pub async fn unregister(&self) {
        if !self.inner.bridge.has_route("/notify") {
            return;
        }
        self.inner.bridge.dispatch_command(&notify_packet(false)).await;
        tracing::info!("sent /notify 0 (unregistered from scsynth)");
    }

    /// Classify one inbound packet and record what it tells us about scsynth.
    fn observe(&self, bytes: &[u8]) {
        match classify_reply(bytes) {
            Reply::DoneNotify(cid) => {
                self.inner.client_id.send_replace(Some(cid));
                self.check_running();
            }
            Reply::Version(v) => {
                self.inner.state.lock().unwrap().version = Some(v);
                self.check_running();
            }
            Reply::Status => self.inner.state.lock().unwrap().status_replies += 1,
            Reply::Fail { command, message, extras } => {
                tracing::warn!(%command, %message, ?extras, "scsynth /fail");
            }
            Reply::Late(seconds) => tracing::warn!(seconds, "scsynth /late bundle"),
            Reply::Other => {}
        }
    }

    /// Once both the client id and version are present for this registration,
    /// flag running (logged once) and bump the generation.
    fn check_running(&self) {
        if *self.inner.running.borrow() {
            return;
        }
        let Some(client_id) = self.client_id() else { return };
        let s = self.inner.state.lock().unwrap();
        let Some(version) = s.version.as_ref() else { return };
        tracing::info!(client_id, %version, "scsynth running");
        drop(s);
        self.inner.generation.fetch_add(1, Ordering::AcqRel);
        self.inner.running.send_replace(true);
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
                // Connected — `check_running` logged "scsynth running …".
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
                tracing::warn!("scsynth not responding; retrying every {}s", RETRY_INTERVAL.as_secs());
                down = true;
            }
            tokio::time::sleep(RETRY_INTERVAL).await;
        }
    }

    /// One registration attempt: `/notify 1` → wait for the `/done /notify` ack
    /// (so the version round-trip runs against a registered client) → `/version`
    /// → wait until `check_running` flags running. Quiet — `run` logs
    /// transitions.
    async fn register(&self) -> bool {
        self.inner.bridge.dispatch_command(&notify_packet(true)).await;
        // (clientID 0 is valid, so the ack test is "populated", not "> 0".)
        let mut cid = self.inner.client_id.subscribe();
        let acked = tokio::time::timeout(REPLY_TIMEOUT, cid.wait_for(Option::is_some))
            .await
            .is_ok_and(|r| r.is_ok());
        if !acked {
            return false;
        }
        self.inner.bridge.dispatch_command(&version_packet()).await;
        let mut running = self.inner.running.subscribe();
        tokio::time::timeout(REPLY_TIMEOUT, running.wait_for(|r| *r))
            .await
            .is_ok_and(|r| r.is_ok())
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

    /// Clear the registration state for a fresh (re)connect attempt. Keeps the
    /// monotonic `status_replies` counter and the `generation`.
    fn reset(&self) {
        self.inner.client_id.send_replace(None);
        self.inner.running.send_replace(false);
        self.inner.state.lock().unwrap().version = None;
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
            Reply::Fail { command, message, extras } => {
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
            Reply::Fail { command, extras, .. } => {
                assert_eq!(command, "/b_read");
                assert_eq!(extras, vec![4]);
            }
            _ => panic!("expected Fail"),
        }
    }

    #[test]
    fn classifies_late() {
        assert!(matches!(
            classify_reply(&osc::encode("/late", vec![OscType::Float(0.02)])),
            Reply::Late(_)
        ));
    }

    #[test]
    fn session_blocks_are_disjoint() {
        let a = session_block(1, 1);
        let b = session_block(1, 2);
        assert!(a.node_base + a.node_count <= b.group_id);
        assert_eq!(b.group_id - a.group_id, SESSION_SPAN);
    }

    #[test]
    fn different_clients_never_overlap() {
        let last0 = session_block(0, 1023);
        assert!(last0.node_base + last0.node_count <= (1 << 26));
    }
}
