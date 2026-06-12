//! A generic OSC bridge: connected UDP peers + outbound address-routing +
//! a fan-out of inbound datagrams to subscribers.
//!
//! [`Bridge`] is protocol-agnostic — it knows nothing about scsynth. Consumers
//! sit on top: a WebSocket pump and the [`scsynth`](super::scsynth) supervisor
//! both [`subscribe`](Bridge::subscribe) to inbound datagrams and send via
//! [`dispatch_command`](Bridge::dispatch_command). Cheap to clone (Arc-backed).

use std::sync::Arc;
use std::time::Duration;

use bytes::Bytes;
use tokio::sync::broadcast;

use super::osc;
use super::peer::{self, Peer};
use crate::core::config::PeerConfig;

/// Capacity of the inbound fan-out broadcast.
const INBOUND_CAPACITY: usize = 256;

/// A generic OSC switch over a set of connected UDP [`Peer`]s.
#[derive(Clone)]
pub struct Bridge {
    inner: Arc<Inner>,
}

struct Inner {
    peers: Vec<Arc<Peer>>,
    /// Every inbound peer datagram, fanned out to all subscribers.
    inbound: broadcast::Sender<Bytes>,
}

impl Bridge {
    /// Connect the configured peers; their receive tasks publish straight
    /// onto the shared `inbound` fan-out. `connect_timeout` is waited out
    /// before the connection attempts (config `connect_timeout`, e.g. to give
    /// the peers time to boot); zero connects immediately.
    pub async fn connect(configs: &[PeerConfig], connect_timeout: Duration) -> Self {
        if !connect_timeout.is_zero() {
            tracing::info!(
                seconds = connect_timeout.as_secs(),
                "waiting before connecting peers"
            );
            tokio::time::sleep(connect_timeout).await;
        }
        let (inbound, _rx) = broadcast::channel(INBOUND_CAPACITY);
        let peers = peer::connect_all(configs, inbound.clone()).await;
        Self {
            inner: Arc::new(Inner { peers, inbound }),
        }
    }

    /// Subscribe to the stream of inbound peer datagrams (one receiver per
    /// consumer — e.g. each WebSocket and the scsynth observer).
    pub fn subscribe(&self) -> broadcast::Receiver<Bytes> {
        self.inner.inbound.subscribe()
    }

    /// Route an outbound OSC packet to the peer whose `pattern` matches its
    /// address, and send it. Drops + warns if it has no address or no match.
    pub async fn dispatch_command(&self, bytes: &[u8]) {
        let Some(address) = osc::peek_address(bytes) else {
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

    /// Whether some peer's `pattern` matches `address` (e.g. the scsynth
    /// supervisor checks for a `/notify` route before registering).
    pub fn has_route(&self, address: &str) -> bool {
        peer::route_for(&self.inner.peers, address).is_some()
    }
}
