/* tslint:disable */
/* eslint-disable */
/**
 * A document-level failure with its 1-based source position. `Display` is
 * the parser's own message (callers wrap it in the canonical
 * "not valid XHTML" shape).
 */
export interface ParseError {
    code: ParseErrorCode;
    message: string;
    line: number;
    column: number;
}

/**
 * The classification of a document-level failure — the input never reached
 * (or survived) the XML parser, so there are no per-element violations.
 */
export type ParseErrorCode = "not-well-formed" | "too-deep";

/**
 * The typed classification of a static violation: one variant per rule,
 * carrying the rule's payload (the offending attribute, the authored value,
 * the violated bound, …). The serde tag is the STABLE public `code`
 * (kebab-case) the wire and editor diagnostics discriminate on; the
 * canonical message is DERIVED from the payload (messages.rs), so code,
 * payload, and text can never drift apart.
 */
export type ViolationKind = { code: "mutually-exclusive-attr"; attr: string } | { code: "missing-required-attr"; attr: string } | { code: "invalid-decimal"; attr: string; value: string } | { code: "invalid-integer"; attr: string; value: string } | { code: "invalid-boolean"; attr: string; value: string } | { code: "invalid-enum"; attr: string; value: string; allowed: string[] } | { code: "invalid-name"; attr: string; value: string } | { code: "value-below-min"; attr: string; value: string; min: number } | { code: "value-below-exclusive-min"; attr: string; value: string; min: number } | { code: "value-above-max"; attr: string; value: string; max: number } | { code: "invalid-numeric-vector"; attr: string; value: string } | { code: "unknown-attr"; attr: string } | { code: "unknown-attr-prefix"; prefix: string } | { code: "unknown-runtime-attr"; attr: string } | { code: "wrong-namespace" } | { code: "unexpected-child"; child: string } | { code: "unexpected-text" } | { code: "missing-required-child"; child: string } | { code: "wrong-root"; root: string };

/**
 * The wire shape of one violation: the crate's Violation (tag, the typed
 * `kind` with its `code` + payload — attr/value/allowed/… — and position)
 * plus the pre-rendered display line, so the JS side never duplicates
 * format logic. The TypeScript definition is GENERATED from this type
 * (tsify) into the pkg d.ts — the one type source. `kind` is NESTED, not
 * serde-flattened: tsify renders a flattened union as
 * `interface … extends <union>` — invalid TS that skipLibCheck silently
 * degrades into a type without the union members.
 */
export interface ValidationViolation {
    /**
     * The authored local tag of the offending element.
     */
    tag: string;
    /**
     * The typed classification: `{code, …payload}`.
     */
    kind: ViolationKind;
    /**
     * 1-based source line.
     */
    line: number;
    /**
     * 1-based source column.
     */
    column: number;
    /**
     * The canonical display line: `<tag>: message (line:col)`.
     */
    message: string;
}


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
 * the typed violation list; `Err` (thrown) is the classified parse failure
 * `{code, message, line, column}` — both cross the boundary as the
 * tsify-generated shapes.
 */
export function validate_entry(xml: string): ValidationViolation[];

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly common_attrs: () => [number, number];
    readonly element_specs: () => [number, number];
    readonly validate_entry: (a: number, b: number) => [number, number, number, number];
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __externref_drop_slice: (a: number, b: number) => void;
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
