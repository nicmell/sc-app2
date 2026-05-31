//! Peers — the audio backends (scsynth, strudel/SuperDirt, …) the bridge
//! talks to over UDP.
//!
//! At startup [`connect_all`] opens one connected `UdpSocket` per configured
//! [`PeerConfig`] and spawns a receive task that republishes inbound datagrams
//! on a `broadcast` channel — consumed by the bridge (forwarded verbatim to the
//! WebSocket) and by the scsynth supervisor. The task keeps receiving across
//! transient errors (e.g. a connected-UDP `ECONNREFUSED` when scsynth is down)
//! so the bridge recovers when the peer returns. The `pattern` regex routes
//! outbound messages to this peer (see [`route_for`]).

use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration;

use anyhow::{Context, Result};
use regex::Regex;
use tokio::net::{lookup_host, UdpSocket};
use tokio::sync::broadcast;

use crate::config::PeerConfig;

/// Capacity of each peer's inbound broadcast channel.
const INBOUND_CAPACITY: usize = 256;
/// Max datagram size read per `recv`.
const RECV_BUF: usize = 64 * 1024;

/// A connected peer: a UDP socket bound locally and connected to the configured
/// target, plus the inbound broadcast channel.
pub struct Peer {
    pub name: String,
    pub target: SocketAddr,
    /// OSC-address regex: an outbound packet is routed here when its address
    /// matches (see [`route_for`]).
    pub pattern: Regex,
    pub socket: Arc<UdpSocket>,
    /// Inbound datagrams, fanned out to the bridge + the `/notify` handshake.
    pub inbound: broadcast::Sender<Vec<u8>>,
}

impl Peer {
    /// Compile the pattern, resolve the target, bind+connect a UDP socket,
    /// and spawn the receive task. Fails on invalid regex, unresolvable
    /// target, or socket bind/connect errors.
    pub async fn connect(config: &PeerConfig) -> Result<Arc<Peer>> {
        let pattern = Regex::new(&config.pattern)
            .with_context(|| format!("invalid regex for peer '{}': {}", config.name, config.pattern))?;

        let target = resolve(&config.target)
            .await
            .with_context(|| format!("resolving target for peer '{}': {}", config.name, config.target))?;

        let socket = UdpSocket::bind("0.0.0.0:0")
            .await
            .with_context(|| format!("binding socket for peer '{}'", config.name))?;
        socket
            .connect(target)
            .await
            .with_context(|| format!("connecting peer '{}' to {target}", config.name))?;

        let (inbound, _rx) = broadcast::channel(INBOUND_CAPACITY);
        let peer = Arc::new(Peer {
            name: config.name.clone(),
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

/// Read datagrams, log them, and republish the raw bytes on the inbound
/// channel (consumed by the bridge forwarder and the `/notify` handshake).
fn spawn_recv(peer: Arc<Peer>) {
    tokio::spawn(async move {
        let mut buf = vec![0u8; RECV_BUF];
        loop {
            match peer.socket.recv(&mut buf).await {
                Ok(n) => {
                    tracing::debug!(peer = %peer.name, bytes = n, "inbound datagram");
                    // No consumers is fine; ignore the send error.
                    let _ = peer.inbound.send(buf[..n].to_vec());
                }
                // Sending to a down peer surfaces ECONNREFUSED here on the
                // connected UDP socket. Keep the task alive (so we recover when
                // the peer returns) and back off briefly to avoid a hot loop.
                Err(e) => {
                    tracing::debug!(peer = %peer.name, target = %peer.target, error = %e, "recv error; retrying");
                    tokio::time::sleep(Duration::from_millis(200)).await;
                }
            }
        }
    });
}

/// Connect every configured peer, logging each by `name`. Failures are skipped
/// (a typo'd peer shouldn't block boot).
pub async fn connect_all(configs: &[PeerConfig]) -> Vec<Arc<Peer>> {
    let mut peers = Vec::with_capacity(configs.len());
    for config in configs {
        match Peer::connect(config).await {
            Ok(peer) => {
                // UDP is connectionless: the socket is bound + pointed at the
                // target, but nothing has confirmed the target is actually up.
                tracing::info!(peer = %peer.name, target = %peer.target, "peer socket ready");
                peers.push(peer);
            }
            Err(e) => {
                tracing::warn!(peer = %config.name, error = %format!("{e:#}"), "peer setup failed; skipping");
            }
        }
    }
    peers
}

/// Pick the peer an OSC `address` routes to: the first whose `pattern`
/// matches. `None` means no peer wants it (the bridge drops the packet).
pub fn route_for<'a>(peers: &'a [Arc<Peer>], address: &str) -> Option<&'a Arc<Peer>> {
    peers.iter().find(|p| p.pattern.is_match(address))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn peer_config(name: &str, pattern: &str, target: &str) -> PeerConfig {
        PeerConfig {
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

        let peer = Peer::connect(&peer_config("test", "^/x", &remote_addr.to_string()))
            .await
            .expect("connect");
        assert_eq!(peer.target, remote_addr);
    }

    #[tokio::test]
    async fn recv_task_forwards_to_inbound() {
        let remote = UdpSocket::bind("127.0.0.1:0").await.unwrap();
        let remote_addr = remote.local_addr().unwrap();

        let peer = Peer::connect(&peer_config("test", "^/x", &remote_addr.to_string()))
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
        assert!(Peer::connect(&peer_config("bad", "(", "127.0.0.1:1")).await.is_err());
    }

    #[tokio::test]
    async fn route_for_matches_by_pattern() {
        let remote = UdpSocket::bind("127.0.0.1:0").await.unwrap();
        let addr = remote.local_addr().unwrap().to_string();
        let peers = connect_all(&[
            peer_config("scsynth", r"^/(s_new|notify|status)", &addr),
            peer_config("strudel", r"^/(dirt|clock)(/|$)", &addr),
        ])
        .await;

        assert_eq!(route_for(&peers, "/dirt/play").map(|p| p.name.as_str()), Some("strudel"));
        assert_eq!(route_for(&peers, "/s_new").map(|p| p.name.as_str()), Some("scsynth"));
        assert!(route_for(&peers, "/nonsense").is_none());
    }

    #[tokio::test]
    async fn connect_all_skips_failures() {
        let remote = UdpSocket::bind("127.0.0.1:0").await.unwrap();
        let configs = vec![
            peer_config("ok", "^/x", &remote.local_addr().unwrap().to_string()),
            peer_config("bad-regex", "(", "127.0.0.1:1"),
        ];
        let peers = connect_all(&configs).await;
        assert_eq!(peers.len(), 1);
        assert_eq!(peers[0].name, "ok");
    }
}
