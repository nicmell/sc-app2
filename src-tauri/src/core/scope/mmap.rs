//! The mmap primitive: a read-only, shared mapping of scsynth's SHM segment
//! plus the typed reads the scope reader needs. Nothing scope-specific beyond
//! [`shm_path`] (the segment's platform-specific location):
//!
//! - **macOS**: `/tmp/boost_interprocess/SuperColliderServer_<port>` (a regular
//!   file Boost mmaps).
//! - **Linux**: `/dev/shm/SuperColliderServer_<port>` (POSIX `shm_open`).

use std::fs::File;
use std::os::unix::io::AsRawFd;
use std::path::PathBuf;
use std::ptr;
use std::sync::atomic::{AtomicI32, Ordering};

/// RAII wrapper for an mmap'd file region. Opens read-only, shared (so writes by
/// scsynth are visible). Drops `munmap` on scope exit.
pub struct MmapRegion {
    ptr: *mut u8,
    size: usize,
}

// The mmap'd region is read-only and lives for the struct's lifetime; safe to
// share across threads.
unsafe impl Send for MmapRegion {}
unsafe impl Sync for MmapRegion {}

impl MmapRegion {
    /// Open the file at `path` and mmap its full length read-only.
    pub fn open(path: &str) -> Result<Self, String> {
        let file = File::open(path).map_err(|e| format!("open('{}') failed: {}", path, e))?;
        let size = file
            .metadata()
            .map_err(|e| format!("stat('{}') failed: {}", path, e))?
            .len() as usize;
        if size == 0 {
            return Err(format!("SHM file '{}' is empty", path));
        }

        // Safety: file is open, fd valid, size from metadata. PROT_READ +
        // MAP_SHARED means scsynth's writes are visible but we can't modify.
        unsafe {
            let ptr = libc::mmap(
                ptr::null_mut(),
                size,
                libc::PROT_READ,
                libc::MAP_SHARED,
                file.as_raw_fd(),
                0,
            );
            if ptr == libc::MAP_FAILED {
                return Err(format!(
                    "mmap('{}') failed: {}",
                    path,
                    std::io::Error::last_os_error()
                ));
            }
            Ok(MmapRegion {
                ptr: ptr as *mut u8,
                size,
            })
        }
    }

    /// Total mapped size in bytes.
    pub fn size(&self) -> usize {
        self.size
    }

    /// Read-only view of the entire region as bytes.
    pub fn as_slice(&self) -> &[u8] {
        // Safety: ptr + size came from mmap, valid for self's lifetime, read-only.
        unsafe { std::slice::from_raw_parts(self.ptr, self.size) }
    }

    /// Read an i32 at byte offset with ACQUIRE ordering — for the fields the
    /// writer publishes with C++ release atomics (`_status`, `_stage`). The
    /// acquire load synchronizes-with scsynth's release store, so everything
    /// written before the publication (the slot's samples, the header) is
    /// visible after it — explicit cross-process ordering instead of relying
    /// on x86-ish behavior on weakly-ordered hosts (Apple Silicon).
    /// Bounds- and alignment-checked.
    pub fn read_i32_acquire(&self, offset: usize) -> Option<i32> {
        if offset + 4 > self.size {
            return None;
        }
        let addr = self.ptr as usize + offset;
        if addr % 4 != 0 {
            return None; // misaligned would be UB for an atomic load
        }
        // Safety: in-bounds, 4-aligned, and AtomicI32 is layout-compatible
        // with i32; the mapping is PROT_READ and an atomic load only reads.
        let atomic = unsafe { &*(addr as *const AtomicI32) };
        Some(atomic.load(Ordering::Acquire))
    }

    /// Read a native-endian u32 at byte offset. Bounds-checked.
    pub fn read_u32_ne(&self, offset: usize) -> Option<u32> {
        if offset + 4 > self.size {
            return None;
        }
        let bytes: [u8; 4] = self.as_slice()[offset..offset + 4].try_into().ok()?;
        Some(u32::from_ne_bytes(bytes))
    }

    /// Read a native-endian i64 at byte offset. Bounds-checked. Used for
    /// `offset_ptr<T>` reads (Boost stores these as one intptr-sized offset).
    pub fn read_i64_ne(&self, offset: usize) -> Option<i64> {
        if offset + 8 > self.size {
            return None;
        }
        let bytes: [u8; 8] = self.as_slice()[offset..offset + 8].try_into().ok()?;
        Some(i64::from_ne_bytes(bytes))
    }
}

impl Drop for MmapRegion {
    fn drop(&mut self) {
        // Safety: ptr + size came from mmap, no longer accessed after this.
        unsafe {
            libc::munmap(self.ptr as *mut libc::c_void, self.size);
        }
    }
}

/// Platform-appropriate SHM file path for a given scsynth UDP port. Returns the
/// path even if the file doesn't exist — caller `open`s to test availability.
pub fn shm_path(port: u16) -> PathBuf {
    let name = format!("SuperColliderServer_{}", port);
    if cfg!(target_os = "macos") {
        PathBuf::from("/tmp/boost_interprocess").join(name)
    } else if cfg!(target_os = "linux") {
        PathBuf::from("/dev/shm").join(name)
    } else {
        PathBuf::from("/tmp/boost_interprocess").join(name)
    }
}
