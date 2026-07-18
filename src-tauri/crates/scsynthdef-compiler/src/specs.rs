// UGen registry data — emitted by build.rs from assets/specs/ugens.json
// (repo root) as per-category `const UGENS`-style slices + `ALL_SLICES`.
// Edit the spec, never the expansion.

use crate::registry::UGenRegistryEntry;
use crate::Rate;

include!(concat!(env!("OUT_DIR"), "/ugen_specs.rs"));
