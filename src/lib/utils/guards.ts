// Type guards over the parsed elements. There is no stored `type` field — the
// discriminant is the element's tag itself: `typeOf(el)` reads `tagName`, and
// each guard narrows to the concrete component class (type-only imports — no
// runtime dependency on the components). Only the guards with live consumers
// exist; per-tag guards return on demand.

import { ELEMENTS } from "@/constants/sc-elements";
import type { ScNode } from "@/sc-elements/internal/sc-node";
import type { ScState } from "@/sc-elements/internal/sc-state";
import type { ScControl } from "@/sc-elements/state/sc-control";
import type { ScSynthDef } from "@/sc-elements/synthdef/sc-synthdef";
import type { ScElementTagNames } from "@/types/sc-elements";

const NODE_TYPES: ReadonlySet<string> = new Set(Object.values(ELEMENTS));

export function isNodeType(value: string): value is ScElementTagNames {
  return NODE_TYPES.has(value);
}

/** The element's type — its tag. */
export function typeOf(el: Element): ScElementTagNames {
  return el.tagName.toLowerCase() as ScElementTagNames;
}

export function isSynthDefRuntime(el: Element): el is ScSynthDef {
  return typeOf(el) === ELEMENTS.SC_SYNTHDEF;
}

export function isControlRuntime(el: Element): el is ScControl {
  return typeOf(el) === ELEMENTS.SC_CONTROL;
}

/** Stateful elements a bind can target. */
export function isStateRuntime(el: Element): el is ScState {
  const t = typeOf(el);
  return t === ELEMENTS.SC_CONTROL || t === ELEMENTS.SC_VAR;
}

/** Elements that can own running scsynth nodes. */
export function isNodeRuntime(el: Element): el is ScNode {
  const t = typeOf(el);
  return t === ELEMENTS.SC_PLUGIN || t === ELEMENTS.SC_GROUP || t === ELEMENTS.SC_SYNTH;
}
