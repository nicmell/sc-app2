//! SHM scope streaming: `ScopeOut2` tap synths write scsynth's shared-memory
//! scope buffers; the WS task polls them on a timer and streams completed
//! slots to the browser as `/scope/chunk` OSC messages. See `scope.md` at the
//! repo root for the full pipeline (scsynth level → bridge → `<sc-scope>`).
//!
//! This module owns ALL the scope semantics; the WS pump only routes frames
//! and ferries bytes (see [`crate::router::ws`]). One file per layer:
//!
//! * [`mmap`] — the read-only shared mapping + typed (acquire) reads.
//! * [`layout`] — the `scope_buffer` memory layout + its heuristic discovery.
//! * [`reader`] — the non-mutating slot reader over the triple buffer.
//! * [`wire`] — the `/scope/*` OSC contract (addresses, parse, encode).
//! * [`session`] — the streaming state: per-slot cursors + [`SessionScopes`],
//!   one session's whole scope state, OWNED by its WS task (a session lives
//!   exactly as long as its socket), so none of it needs locking.

pub mod layout;
pub mod mmap;
pub mod reader;
pub mod session;
pub mod wire;

pub use session::{poll_interval, SessionScopes};
pub use wire::{SCOPE_SUBSCRIBE, SCOPE_UNSUBSCRIBE};

use layout::{find_scope_buffer_array, ScopeBufferLayout};
use mmap::{shm_path, MmapRegion};

/// A mmap of scsynth's SHM segment plus the resolved scope_buffer index map.
/// Opened once per server (lazily, on first subscribe) and shared across WS.
pub struct ScopeShm {
    pub region: MmapRegion,
    pub layout: ScopeBufferLayout,
}

impl ScopeShm {
    /// mmap the segment for `scsynth_port` and locate its scope-buffer vector.
    pub fn open(scsynth_port: u16) -> Result<Self, String> {
        let path = shm_path(scsynth_port);
        let path_str = path.to_string_lossy().into_owned();
        let region = MmapRegion::open(&path_str)?;
        let layout = find_scope_buffer_array(&region)?;
        tracing::info!(path = %path_str, count = layout.count, "scope SHM mapped");
        Ok(ScopeShm { region, layout })
    }
}
