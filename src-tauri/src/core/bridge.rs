//! A generic OSC bridge: connected UDP peers + outbound address-routing +
//! a fan-out of inbound datagrams to subscribers.
//!
//! [`Bridge`] is protocol-agnostic — it knows nothing about scsynth. Consumers
//! sit on top: a WebSocket pump and the [`scsynth`](super::scsynth) supervisor
//! both [`subscribe`](Bridge::subscribe) to inbound datagrams and send via
//! [`dispatch_command`](Bridge::dispatch_command). Cheap to clone (Arc-backed).

use std::sync::Arc;

use bytes::Bytes;
use tokio::sync::broadcast;

use super::osc;
use super::peer::{self, Peer};
use crate::config::PeerConfig;

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
    /// Connect the configured peers and start one pump task per peer
    /// (peer socket → the shared `inbound` fan-out). Never blocks.
    pub async fn connect(configs: &[PeerConfig]) -> Self {
        let peers = peer::connect_all(configs).await;
        let (inbound, _rx) = broadcast::channel(INBOUND_CAPACITY);
        let bridge = Self {
            inner: Arc::new(Inner { peers, inbound }),
        };
        bridge.spawn_pumps();
        bridge
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

    /// One task per peer: drain its inbound datagrams into the shared fan-out.
    fn spawn_pumps(&self) {
        for peer in &self.inner.peers {
            let mut peer_inbound = peer.inbound.subscribe();
            let inbound = self.inner.inbound.clone();
            tokio::spawn(async move {
                loop {
                    match peer_inbound.recv().await {
                        // No subscribers is fine; ignore the send error.
                        Ok(bytes) => {
                            let _ = inbound.send(Bytes::from(bytes));
                        }
                        // Dropped some datagrams under load — keep going.
                        Err(broadcast::error::RecvError::Lagged(_)) => continue,
                        Err(broadcast::error::RecvError::Closed) => break,
                    }
                }
            });
        }
    }
}
