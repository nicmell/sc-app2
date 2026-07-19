/**
 * @sc-app/synthdef-compiler — SynthDef → SCgf v2 compilation over the
 * wasm-bindgen build of the scsynthdef-compiler Rust crate (`pkg/`,
 * regenerated via `yarn generate:synthdef-compiler`). One compiler
 * implementation for the Rust backend (native rlib) and the frontend:
 * the `SynthDef` graph-builder class, the spec-backed UGen registry,
 * operator tables, the envelope
 * registry (12 `Env.*` shapes with modulatable-slot rules), and the typed
 * per-UGen builder surface (`import * as builders`).
 */

// The compiler core (wasm-backed; throws on invalid graphs).
export {
  SynthDef,
  parseScgf,
  binaryOpIndex,
  unaryOpIndex,
  buildEnvRun,
  encodeEnvRun,
} from "./component.js";
export type { UGenInput, UGenInputLike } from "./component.js";

// UGenInput constructors/readers over the serde shape.
export { k, u, uo, toUGenInput, ugenIndex, outputIndex } from "./ugen-input.js";

// Rates.
export { parseRate, type Rate } from "./rate.js";

// The UGen registry, read from the committed package spec.
export {
  lookupUgen,
  ugensByCategory,
  type UGenRegistryDefault,
  type UGenRegistryEntry,
} from "./registry.js";

// The structured SCgf JSON shapes.
export type { InputSpec, OutputSpec, ParamName, SynthDefJson, UGenJson } from "./scgf-json.js";

// The envelope-shape registry.
export {
  ENV_SHAPES,
  lookupEnv,
  type BuildOpts,
  type EnvArg,
  type EnvArgValue,
  type EnvShapeEntry,
} from "./env-registry.js";
