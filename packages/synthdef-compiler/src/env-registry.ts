/**
 * Envelope-shape registry — metadata served by the wasm build
 * (`envShapesJson()`, cached at module load), with each entry's `buildRun`
 * delegating to the crate's build+encode (`buildEnvRun`). Params that feed
 * arithmetic are constant-only — the crate throws the pinned
 * `<shape>: "<name>" is not modulatable` errors.
 */

import { buildEnvRun, envShapesJson } from "./component.js";
import type { UGenInput, UGenInputLike } from "../pkg/scsynthdef_compiler.js";

/** A resolved env argument: a scalar (const or ref) or an array of them. */
export type EnvArgValue = UGenInputLike | UGenInputLike[];

export interface EnvArg {
  name: string;
  default: number;
  /** Comma-list value (levels/times/pairs/xyc), not a single scalar. */
  array?: boolean;
  /** Whether a ref (bind:value) is accepted; false → constant only. */
  modulatable?: boolean;
}

export interface BuildOpts {
  curve?: number | string;
  releaseNode?: number | null;
  loopNode?: number | null;
}

export interface EnvShapeEntry {
  name: string;
  args: readonly EnvArg[];
  releaseNode: number | null;
  loopNode: number | null;
  /** Build the shape and flatten it to the EnvGen `Env.asArray` run. */
  buildRun(args: Record<string, EnvArgValue>, opts?: BuildOpts): UGenInput[];
}

interface RawShape {
  name: string;
  args: EnvArg[];
  releaseNode: number | null;
  loopNode: number | null;
}

const ENTRIES: EnvShapeEntry[] = (JSON.parse(envShapesJson()) as RawShape[]).map((raw) => ({
  ...raw,
  releaseNode: raw.releaseNode ?? null,
  loopNode: raw.loopNode ?? null,
  buildRun: (args, opts = {}) =>
    buildEnvRun(
      raw.name,
      args,
      opts.curve,
      opts.releaseNode ?? undefined,
      opts.loopNode ?? undefined,
    ),
}));

const BY_NAME = new Map(ENTRIES.map((e) => [e.name, e]));

export const ENV_SHAPES: readonly EnvShapeEntry[] = ENTRIES;

/** Look up an envelope shape by its `type` name. `null` if unknown. */
export function lookupEnv(name: string): EnvShapeEntry | null {
  return BY_NAME.get(name) ?? null;
}
