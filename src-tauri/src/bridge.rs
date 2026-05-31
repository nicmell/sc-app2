//! The OSC bridge: connected UDP peers, a fan-out to WebSocket clients, and the
//! scsynth registration/liveness supervisor.
//!
//! [`Bridge`] is cheap to clone (Arc-backed). Two directions:
//! * [`Bridge::dispatch_command`] — an outbound packet is routed to the peer
//!   whose address `pattern` matches (`/dirt/play` → strudel, `/notify` →
//!   scsynth) and sent.
//! * inbound peer datagrams are pumped through `dispatch_reply`, which taps the
//!   scsynth handshake/heartbeat replies for state and fans every packet out on
//!   the `clients` broadcast that each WebSocket subscribes to.
//!
//! A background supervisor registers with scsynth (`/notify` → `/version`),
//! polls `/status`, and reconnects when it stops answering;
//! [`Bridge::unregister_scsynth`] releases the client slot on shutdown.

use std::sync::{Arc, Mutex};
use std::time::Duration;

use axum::body::Bytes;
use tokio::sync::broadcast;

use crate::config::Route;
use crate::osc::{self, Reply, ScsynthVersion};
use crate::peer::{self, Peer};

/// Capacity of the client-reply broadcast (peer datagrams fanned to all WS).
const CLIENTS_CAPACITY: usize = 256;
/// scsynth `/status` heartbeat poll interval.
const STATUS_INTERVAL: Duration = Duration::from_secs(2);
/// Consecutive missed `/status.reply`s before scsynth is considered down.
const MAX_STATUS_MISSES: u32 = 3;
/// Delay between reconnection attempts while scsynth is unreachable.
const RETRY_INTERVAL: Duration = Duration::from_secs(2);
/// How long to wait for a `/done /notify` or `/version.reply`.
const REPLY_TIMEOUT: Duration = Duration::from_secs(2);

/// The OSC bridge: UDP peers + a client fan-out + the scsynth supervisor.
#[derive(Clone)]
pub struct Bridge {
    inner: Arc<Inner>,
}

struct Inner {
    peers: Vec<Arc<Peer>>,
    /// Peer replies, fanned out to every connected WebSocket client.
    clients: broadcast::Sender<Bytes>,
    scsynth: Mutex<ScsynthState>,
}

/// What scsynth tells us, filled by `dispatch_reply`. The bridge is "running"
/// once both the client id (`/done /notify`) and the version (`/version.reply`)
/// are in; `alive` then tracks the `/status` heartbeat.
#[derive(Default)]
struct ScsynthState {
    client_id: Option<i32>,
    version: Option<ScsynthVersion>,
    /// Set true (and logged once) when both fields are first present.
    running: bool,
    /// Whether scsynth is currently responding to the `/status` heartbeat.
    alive: bool,
    /// Monotonic count of `/status.reply`s seen — the poller's liveness signal.
    status_replies: u64,
}

impl Bridge {
    /// Connect the configured peers, start the per-peer receive pumps, and
    /// launch the scsynth supervisor — all in the background (never blocks).
    pub async fn connect(routes: &[Route]) -> Self {
        let peers = peer::connect_all(routes).await;
        let (clients, _rx) = broadcast::channel(CLIENTS_CAPACITY);
        let bridge = Self {
            inner: Arc::new(Inner {
                peers,
                clients,
                scsynth: Mutex::new(ScsynthState::default()),
            }),
        };
        bridge.spawn_reply_pumps();
        let bg = bridge.clone();
        tokio::spawn(async move { bg.supervise_scsynth().await });
        bridge
    }

    /// Subscribe to the stream of peer replies (one receiver per WebSocket).
    pub fn subscribe(&self) -> broadcast::Receiver<Bytes> {
        self.inner.clients.subscribe()
    }

    /// Route an outbound OSC packet to the peer whose `pattern` matches its
    /// address, and send it. Drops + warns if it has no address or no match.
    pub async fn dispatch_command(&self, bytes: &[u8]) {
        let Some(address) = peer::peek_osc_address(bytes) else {
            tracing::warn!("outbound packet has no OSC address; dropping");
            return;
        };
        let Some(peer) = peer::route_for(&self.inner.peers, address) else {
            tracing::warn!(address, "no peer for OSC address; dropping");
            return;
        };
        if let Err(e) = peer.socket.send(bytes).await {
            tracing::warn!(peer = %peer.name, error = %e, "udp send failed");
        }
    }

    /// Tell scsynth to drop our client registration (`/notify 0`) on shutdown.
    pub async fn unregister_scsynth(&self) {
        if peer::route_for(&self.inner.peers, "/notify").is_some() {
            self.dispatch_command(&osc::notify_packet(false)).await;
            tracing::info!("sent /notify 0 (unregistered from scsynth)");
        }
    }

    // ── receive ──────────────────────────────────────────────────────────

    /// One task per peer drains its inbound datagrams into `dispatch_reply`.
    /// Subscriptions are registered synchronously (before any `/notify` is
    /// sent) so an early reply can't be missed.
    fn spawn_reply_pumps(&self) {
        for peer in &self.inner.peers {
            let mut inbound = peer.inbound.subscribe();
            let bridge = self.clone();
            tokio::spawn(async move {
                loop {
                    match inbound.recv().await {
                        Ok(bytes) => bridge.dispatch_reply(Bytes::from(bytes)),
                        // Dropped some replies under load — keep going.
                        Err(broadcast::error::RecvError::Lagged(_)) => continue,
                        Err(broadcast::error::RecvError::Closed) => break,
                    }
                }
            });
        }
    }

    /// Tap the bridge-relevant replies for state, then fan every packet out to
    /// all clients verbatim.
    fn dispatch_reply(&self, bytes: Bytes) {
        match osc::classify_reply(&bytes) {
            Reply::DoneNotify(cid) => self.record_scsynth(|s| s.client_id = Some(cid)),
            Reply::Version(v) => self.record_scsynth(|s| s.version = Some(v)),
            Reply::Status => self.inner.scsynth.lock().unwrap().status_replies += 1,
            Reply::Other => {}
        }
        // No connected clients is fine; ignore the send error.
        let _ = self.inner.clients.send(bytes);
    }

    /// Apply an update to the scsynth state; once both the client id and the
    /// version are present, flag the bridge running and log it once.
    fn record_scsynth(&self, update: impl FnOnce(&mut ScsynthState)) {
        let mut s = self.inner.scsynth.lock().unwrap();
        update(&mut s);
        if !s.running && s.client_id.is_some() && s.version.is_some() {
            s.running = true;
            let client_id = s.client_id.unwrap();
            let version = s.version.as_ref().unwrap();
            tracing::info!(client_id, %version, "scsynth running");
        }
    }

    // ── scsynth supervisor ─────────────────────────────────────────────────

    /// (Re)register, poll `/status` until scsynth stops answering, reconnect.
    /// Reuses [`register_scsynth`](Self::register_scsynth) for first connect +
    /// reconnect; owns the transition logging so retries don't spam. Bails if
    /// no peer handles `/notify`.
    async fn supervise_scsynth(&self) {
        if peer::route_for(&self.inner.peers, "/notify").is_none() {
            tracing::warn!("no peer matches /notify; scsynth supervision disabled");
            return;
        }
        // `down` = the current outage has already been logged (avoids spam).
        let mut down = false;
        loop {
            self.reset_scsynth();
            if self.register_scsynth().await {
                // Connected — `dispatch_reply` logged "scsynth running …".
                down = false;
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
    /// → wait until `dispatch_reply` flags running. Returns whether it
    /// completed. Quiet — the supervisor logs transitions.
    async fn register_scsynth(&self) -> bool {
        self.dispatch_command(&osc::notify_packet(true)).await;
        // (clientID 0 is valid, so the ack test is "populated", not "> 0".)
        if !self.await_state(REPLY_TIMEOUT, |s| s.client_id.is_some()).await {
            return false;
        }
        self.dispatch_command(&osc::version_packet()).await;
        self.await_state(REPLY_TIMEOUT, |s| s.running).await
    }

    /// Poll `/status` until scsynth misses [`MAX_STATUS_MISSES`] consecutive
    /// replies; returns so the supervisor can reconnect.
    async fn poll_status_until_dead(&self) {
        let mut misses = 0u32;
        loop {
            let before = self.inner.scsynth.lock().unwrap().status_replies;
            self.dispatch_command(&osc::status_packet()).await;
            tokio::time::sleep(STATUS_INTERVAL).await;
            if self.inner.scsynth.lock().unwrap().status_replies > before {
                misses = 0;
            } else {
                misses += 1;
                if misses >= MAX_STATUS_MISSES {
                    return;
                }
            }
        }
    }

    /// Poll the scsynth state until `pred` holds or `timeout` elapses.
    async fn await_state(&self, timeout: Duration, pred: impl Fn(&ScsynthState) -> bool) -> bool {
        tokio::time::timeout(timeout, async {
            while !pred(&self.inner.scsynth.lock().unwrap()) {
                tokio::time::sleep(Duration::from_millis(25)).await;
            }
        })
        .await
        .is_ok()
    }

    /// Clear the registration fields for a fresh (re)connect attempt. Keeps the
    /// monotonic `status_replies` counter and the `alive` flag.
    fn reset_scsynth(&self) {
        let mut s = self.inner.scsynth.lock().unwrap();
        s.client_id = None;
        s.version = None;
        s.running = false;
    }

    fn set_alive(&self, alive: bool) {
        self.inner.scsynth.lock().unwrap().alive = alive;
    }
}
