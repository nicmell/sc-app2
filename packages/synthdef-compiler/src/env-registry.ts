/**
 * Envelope-shape registry — metadata read straight from the committed
 * spec at `specs/envs.json` (the same file the generator uses for the
 * committed Rust shapes), with each entry's `buildRun`
 * delegating to the crate's build+encode (`buildEnvRun`). Params that feed
 * arithmetic are constant-only — the crate throws the pinned
 * `<shape>: "<name>" is not modulatable` errors.
 */

import envsSpec from "../specs/envs.json";
import { buildEnvRun } from "./component.js";
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
  args: (EnvArg & { doc?: string })[];
  releaseNode?: number | null;
  loopNode?: number | null;
  doc?: string;
}

const ENTRIES: EnvShapeEntry[] = (envsSpec as { shapes: RawShape[] }).shapes.map((raw) => ({
  name: raw.name,
  args: raw.args.map(({ name, default: d, array, modulatable }) => ({
    name,
    default: d,
    ...(array ? { array } : {}),
    ...(modulatable ? { modulatable } : {}),
  })),
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
