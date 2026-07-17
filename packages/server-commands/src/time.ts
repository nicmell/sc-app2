/**
 * Timetag helpers. scsynth reads the 64-bit NTP timetag off every bundle;
 * a future tag queues the bundle for a sample-accurate fire. The epoch
 * conversion itself lives in the component (`atUnixMs`, re-exported from
 * ./component) — here only the special immediate tag.
 */

import type { OscTime } from "../pkg/interfaces/scserver-commands-core.js";

/** "Fire as soon as possible" — the special NTP tag `(0, 1)`. */
export const IMMEDIATE_TIME: OscTime = { seconds: 0, fractional: 1 };
