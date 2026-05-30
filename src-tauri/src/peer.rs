//! Peers — the audio backends (scsynth, strudel/SuperDirt, …) the server
//! talks to over UDP.
//!
//! At startup [`connect_all`] opens one connected `UdpSocket` per configured
//! [`Route`] and spawns a receive task that logs inbound datagrams and
//! socket errors tagged by the peer's `name`. Inbound bytes are republished
//! on a `broadcast` channel for future routing consumers. The `pattern`
//! regex is validated here but not yet used (forwarding is future work);
//! no OSC handshake is performed.

use std::net::SocketAddr;
use std::sync::Arc;

use anyhow::{Context, Result};
use regex::Regex;
use tokio::net::{lookup_host, UdpSocket};
use tokio::sync::broadcast;

use crate::config::Route;

/// Capacity of each peer's inbound broadcast channel.
const INBOUND_CAPACITY: usize = 256;
/// Max datagram size read per `recv`.
const RECV_BUF: usize = 64 * 1024;

/// A connected peer: a UDP socket bound locally and connected to the route's
/// target, plus the inbound broadcast channel.
pub struct Peer {
    pub name: String,
    pub target: SocketAddr,
    /// OSC-address regex for this peer. Validated at connect; unused for now.
    #[allow(dead_code)]
    pub pattern: Regex,
    pub socket: Arc<UdpSocket>,
    /// Inbound datagrams, for future routing consumers.
    pub inbound: broadcast::Sender<Vec<u8>>,
}

impl Peer {
    /// Compile the pattern, resolve the target, bind+connect a UDP socket,
    /// and spawn the receive task. Fails on invalid regex, unresolvable
    /// target, or socket bind/connect errors.
    pub async fn connect(route: &Route) -> Result<Arc<Peer>> {
        let pattern = Regex::new(&route.pattern)
            .with_context(|| format!("invalid regex for peer '{}': {}", route.name, route.pattern))?;

        let target = resolve(&route.target)
            .await
            .with_context(|| format!("resolving target for peer '{}': {}", route.name, route.target))?;

        let socket = UdpSocket::bind("0.0.0.0:0")
            .await
            .with_context(|| format!("binding socket for peer '{}'", route.name))?;
        socket
            .connect(target)
            .await
            .with_context(|| format!("connecting peer '{}' to {target}", route.name))?;

        let (inbound, _rx) = broadcast::channel(INBOUND_CAPACITY);
        let peer = Arc::new(Peer {
            name: route.name.clone(),
            target,
            pattern,
            socket: Arc::new(socket),
            inbound,
        });
        spawn_recv(peer.clone());
        Ok(peer)
    }
}

/// Resolve a `host:port` target — IP literals parse directly, hostnames go
/// through DNS (first address wins).
async fn resolve(target: &str) -> Result<SocketAddr> {
    if let Ok(addr) = target.parse::<SocketAddr>() {
        return Ok(addr);
    }
    lookup_host(target)
        .await?
        .next()
        .with_context(|| format!("no addresses for {target}"))
}

/// Read datagrams, log them, and republish on the inbound channel.
fn spawn_recv(peer: Arc<Peer>) {
    tokio::spawn(async move {
        let mut buf = vec![0u8; RECV_BUF];
        loop {
            match peer.socket.recv(&mut buf).await {
                Ok(n) => {
                    tracing::debug!(peer = %peer.name, bytes = n, "inbound datagram");
                    // No consumers yet is fine; ignore the send error.
                    let _ = peer.inbound.send(buf[..n].to_vec());
                }
                // We don't send yet, so `recv` normally just blocks. Once we
                // start sending, a connected-UDP ECONNREFUSED can surface
                // here; stopping the task is acceptable for now.
                Err(e) => {
                    tracing::warn!(peer = %peer.name, target = %peer.target, error = %e, "recv error; peer task stopping");
                    break;
                }
            }
        }
    });
}

/// Connect every route, logging each by `name`. Failures are skipped (a
/// typo'd route shouldn't block boot — peers have no functional effect yet).
pub async fn connect_all(routes: &[Route]) -> Vec<Arc<Peer>> {
    let mut peers = Vec::with_capacity(routes.len());
    for route in routes {
        match Peer::connect(route).await {
            Ok(peer) => {
                tracing::info!(peer = %peer.name, target = %peer.target, "peer connected");
                peers.push(peer);
            }
            Err(e) => {
                tracing::warn!(route = %route.name, error = %format!("{e:#}"), "peer connect failed; skipping");
            }
        }
    }
    peers
}

#[cfg(test)]
mod tests {
    use super::*;

    fn route(name: &str, pattern: &str, target: &str) -> Route {
        Route {
            name: name.into(),
            pattern: pattern.into(),
            target: target.into(),
        }
    }

    #[tokio::test]
    async fn connects_and_resolves_target() {
        // A throwaway loopback socket stands in for the remote peer.
        let remote = UdpSocket::bind("127.0.0.1:0").await.unwrap();
        let remote_addr = remote.local_addr().unwrap();

        let peer = Peer::connect(&route("test", "^/x", &remote_addr.to_string()))
            .await
            .expect("connect");
        assert_eq!(peer.target, remote_addr);
    }

    #[tokio::test]
    async fn recv_task_forwards_to_inbound() {
        let remote = UdpSocket::bind("127.0.0.1:0").await.unwrap();
        let remote_addr = remote.local_addr().unwrap();

        let peer = Peer::connect(&route("test", "^/x", &remote_addr.to_string()))
            .await
            .expect("connect");
        let mut rx = peer.inbound.subscribe();

        // Send to the peer's local port; its connected socket receives it.
        let peer_addr = peer.socket.local_addr().unwrap();
        remote.send_to(b"hello", peer_addr).await.unwrap();

        let got = tokio::time::timeout(std::time::Duration::from_secs(1), rx.recv())
            .await
            .expect("recv timed out")
            .expect("broadcast recv");
        assert_eq!(got, b"hello".to_vec());
    }

    #[tokio::test]
    async fn invalid_regex_errors() {
        assert!(Peer::connect(&route("bad", "(", "127.0.0.1:1")).await.is_err());
    }

    #[tokio::test]
    async fn connect_all_skips_failures() {
        let remote = UdpSocket::bind("127.0.0.1:0").await.unwrap();
        let routes = vec![
            route("ok", "^/x", &remote.local_addr().unwrap().to_string()),
            route("bad-regex", "(", "127.0.0.1:1"),
        ];
        let peers = connect_all(&routes).await;
        assert_eq!(peers.len(), 1);
        assert_eq!(peers[0].name, "ok");
    }
}
