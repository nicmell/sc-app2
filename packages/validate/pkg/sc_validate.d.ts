/* tslint:disable */
/* eslint-disable */

/**
 * The attributes every element accepts without declaring them, as a JSON
 * array — exported so the frontend's hand copy (internal/spec.ts) can be
 * PINNED against the crate (a drift would silently change contentHash ids).
 */
export function common_attrs(): string;

/**
 * The sc elements' spec map as JSON: `tag → { attrs: { name → def } }`.
 * Serialized by hand-rolled impls because attr ORDER is contractual (the
 * frontend's runtime-prop resolution iterates it) and serde_json's default
 * map would alphabetize. Only what the frontend actually consumes: per attr
 * `type`/`runtime`/`default`/`values` — the required flag and numeric
 * facets are static-gate-only and stay crate-side.
 */
export function element_specs(): string;

/**
 * Validate a plugin entry document. See [`crate::validate_entry`]. `Ok` is
 * a JSON array of violations — `{code, tag, <payload…>, line, column,
 * message}` (the payload fields are the kind's own: attr/value/allowed/…;
 * `message` is the pre-rendered display line, so the JS side never
 * duplicates format logic). `Err` (thrown) is the classified parse failure
 * as JSON `{code, message, line, column}`.
 */
export function validate_entry(xml: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly common_attrs: () => [number, number];
    readonly element_specs: () => [number, number];
    readonly validate_entry: (a: number, b: number) => [number, number, number, number];
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
