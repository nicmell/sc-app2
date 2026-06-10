// Type guards over the parser items. There is no stored `type` field — the
// discriminant is the element's tag itself: `typeOf(item)` derives it from
// `_element.tagName`, and each guard narrows to the concrete ScElementRuntime.

import { ELEMENTS } from "@/constants/sc-elements";
import type {
  NodeType,
  ScControlRuntime,
  ScElementRuntimeBase,
  ScGroupRuntime,
  ScParentRuntime,
  ScPluginRuntime,
  ScSynthDefRuntime,
  ScSynthRuntime,
  ScUgenRuntime,
  ScVarRuntime,
} from "@/types/parsers";

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

/** The item's element type — the tag of the component it was hydrated from. */
export function typeOf(el: ScElementRuntimeBase): NodeType {
  return el._element.tagName.toLowerCase() as NodeType;
}

export function isPluginRuntime(el: ScElementRuntimeBase): el is ScPluginRuntime {
  return typeOf(el) === ELEMENTS.SC_PLUGIN;
}

export function isGroupRuntime(el: ScElementRuntimeBase): el is ScGroupRuntime | ScPluginRuntime {
  const t = typeOf(el);
  return t === ELEMENTS.SC_GROUP || t === ELEMENTS.SC_PLUGIN;
}

export function isSynthRuntime(el: ScElementRuntimeBase): el is ScSynthRuntime {
  return typeOf(el) === ELEMENTS.SC_SYNTH;
}

export function isSynthDefRuntime(el: ScElementRuntimeBase): el is ScSynthDefRuntime {
  return typeOf(el) === ELEMENTS.SC_SYNTHDEF;
}

export function isUgenRuntime(el: ScElementRuntimeBase): el is ScUgenRuntime {
  return typeOf(el) === ELEMENTS.SC_UGEN;
}

export function isControlRuntime(el: ScElementRuntimeBase): el is ScControlRuntime {
  return typeOf(el) === ELEMENTS.SC_CONTROL;
}

export function isVarRuntime(el: ScElementRuntimeBase): el is ScVarRuntime {
  return typeOf(el) === ELEMENTS.SC_VAR;
}

/** Stateful items a bind can target. */
export function isStateRuntime(el: ScElementRuntimeBase): el is ScControlRuntime | ScVarRuntime {
  const t = typeOf(el);
  return t === ELEMENTS.SC_CONTROL || t === ELEMENTS.SC_VAR;
}

/** Items that can own running scsynth nodes. */
export function isNodeRuntime(el: ScElementRuntimeBase): el is ScPluginRuntime | ScGroupRuntime | ScSynthRuntime {
  const t = typeOf(el);
  return t === ELEMENTS.SC_PLUGIN || t === ELEMENTS.SC_GROUP || t === ELEMENTS.SC_SYNTH;
}

export function isParentRuntime(el: ScElementRuntimeBase): el is ScParentRuntime {
  return PARENT_TYPES.has(typeOf(el));
}
