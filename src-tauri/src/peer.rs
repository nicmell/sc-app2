//! Peers — the audio backends (scsynth, strudel/SuperDirt, …) the server
//! talks to over UDP.
//!
//! At startup [`connect_all`] opens one connected `UdpSocket` per configured
//! [`Route`] and spawns a receive task that logs inbound datagrams and
//! republishes the raw bytes on a `broadcast` channel — consumed by the bridge
//! (forwarded verbatim to the WebSocket) and by the `/notify` handshake. The
//! `pattern` regex routes outbound messages to this peer (see [`route_for`]).

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
                // A connected-UDP ECONNREFUSED can surface here once we send;
                // stopping the task is acceptable for now.
                Err(e) => {
                    tracing::warn!(peer = %peer.name, target = %peer.target, error = %e, "recv error; peer task stopping");
                    break;
                }
            }
        }
    });
}

/// Connect every route, logging each by `name`. Failures are skipped (a
/// typo'd route shouldn't block boot).
pub async fn connect_all(routes: &[Route]) -> Vec<Arc<Peer>> {
    let mut peers = Vec::with_capacity(routes.len());
    for route in routes {
        match Peer::connect(route).await {
            Ok(peer) => {
                // UDP is connectionless: the socket is bound + pointed at the
                // target, but nothing has confirmed the target is actually up.
                tracing::info!(peer = %peer.name, target = %peer.target, "peer socket ready");
                peers.push(peer);
            }
            Err(e) => {
                tracing::warn!(route = %route.name, error = %format!("{e:#}"), "peer setup failed; skipping");
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

/// Read the OSC address from a packet without fully decoding it.
///
/// A bare message starts with its NUL-terminated address string. A bundle
/// starts with `#bundle\0` (8B) + a timetag (8B) + the first element's size
/// (4B) = 20 bytes, after which the first element begins; we recurse into it
/// so a bundle routes by its first message's address. Returns `None` for a
/// malformed/empty packet.
pub fn peek_osc_address(bytes: &[u8]) -> Option<&str> {
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

    /// Encode a minimal OSC message: NUL-terminated, 4-byte-padded address.
    fn osc_msg(address: &str) -> Vec<u8> {
        let mut v = address.as_bytes().to_vec();
        v.push(0);
        while v.len() % 4 != 0 {
            v.push(0);
        }
        v
    }

    #[test]
    fn peek_reads_message_address() {
        assert_eq!(peek_osc_address(&osc_msg("/dirt/play")), Some("/dirt/play"));
    }

    #[test]
    fn peek_reads_first_address_in_bundle() {
        let element = osc_msg("/dirt/play");
        let mut pkt = b"#bundle\0".to_vec();
        pkt.extend_from_slice(&[0u8; 8]); // timetag
        pkt.extend_from_slice(&(element.len() as u32).to_be_bytes());
        pkt.extend_from_slice(&element);
        assert_eq!(peek_osc_address(&pkt), Some("/dirt/play"));
    }

    #[test]
    fn peek_rejects_empty_or_truncated() {
        assert_eq!(peek_osc_address(b""), None);
        assert_eq!(peek_osc_address(b"#bundle\0short"), None);
    }

    #[tokio::test]
    async fn route_for_matches_by_pattern() {
        let remote = UdpSocket::bind("127.0.0.1:0").await.unwrap();
        let addr = remote.local_addr().unwrap().to_string();
        let peers = connect_all(&[
            route("scsynth", r"^/(s_new|notify|status)", &addr),
            route("strudel", r"^/(dirt|clock)(/|$)", &addr),
        ])
        .await;

        assert_eq!(route_for(&peers, "/dirt/play").map(|p| p.name.as_str()), Some("strudel"));
        assert_eq!(route_for(&peers, "/s_new").map(|p| p.name.as_str()), Some("scsynth"));
        assert!(route_for(&peers, "/nonsense").is_none());
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
