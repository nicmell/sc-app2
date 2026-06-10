// Type guards over the parsed elements. There is no stored `type` field — the
// discriminant is the element's tag itself: `typeOf(el)` reads `tagName`, and
// each guard narrows to the concrete component class (type-only imports — no
// runtime dependency on the components).

import { ELEMENTS } from "@/constants/sc-elements";
import type { ScElement, ScParentElement } from "@/sc-elements/internal/sc-element";
import type { ScNode } from "@/sc-elements/internal/sc-node";
import type { ScState } from "@/sc-elements/internal/sc-state";
import type { ScControl } from "@/sc-elements/state/sc-control";
import type { ScGroup } from "@/sc-elements/nodes/sc-group";
import type { ScPlugin } from "@/sc-elements/nodes/sc-plugin";
import type { ScSynth } from "@/sc-elements/nodes/sc-synth";
import type { ScSynthDef } from "@/sc-elements/synthdef/sc-synthdef";
import type { ScUgen } from "@/sc-elements/synthdef/sc-ugen";
import type { ScVar } from "@/sc-elements/state/sc-var";
import type { NodeType } from "@/types/runtime";

const NODE_TYPES: ReadonlySet<string> = new Set(Object.values(ELEMENTS));

const PARENT_TYPES: ReadonlySet<string> = new Set([
  ELEMENTS.SC_PLUGIN,
  ELEMENTS.SC_GROUP,
  ELEMENTS.SC_SYNTHDEF,
  ELEMENTS.SC_UGEN,
  ELEMENTS.SC_SYNTH,
  ELEMENTS.SC_IF,
  ELEMENTS.SC_SELECT,
  ELEMENTS.SC_RADIO_GROUP,
]);

export function isNodeType(value: string): value is NodeType {
  return NODE_TYPES.has(value);
}

/** The element's type — its tag. */
export function typeOf(el: Element): NodeType {
  return el.tagName.toLowerCase() as NodeType;
}

export function isPluginRuntime(el: Element): el is ScPlugin {
  return typeOf(el) === ELEMENTS.SC_PLUGIN;
}

export function isGroupRuntime(el: Element): el is ScGroup | ScPlugin {
  const t = typeOf(el);
  return t === ELEMENTS.SC_GROUP || t === ELEMENTS.SC_PLUGIN;
}

export function isSynthRuntime(el: Element): el is ScSynth {
  return typeOf(el) === ELEMENTS.SC_SYNTH;
}

export function isSynthDefRuntime(el: Element): el is ScSynthDef {
  return typeOf(el) === ELEMENTS.SC_SYNTHDEF;
}

export function isUgenRuntime(el: Element): el is ScUgen {
  return typeOf(el) === ELEMENTS.SC_UGEN;
}

export function isControlRuntime(el: Element): el is ScControl {
  return typeOf(el) === ELEMENTS.SC_CONTROL;
}

export function isVarRuntime(el: Element): el is ScVar {
  return typeOf(el) === ELEMENTS.SC_VAR;
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

/** Elements that parse their children into `scChildren` (the rest are leaves). */
export function isParentRuntime(el: ScElement): el is ScParentElement {
  return PARENT_TYPES.has(typeOf(el));
}
