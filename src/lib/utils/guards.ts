// Type guards over the parser items. There is no stored `type` field — the
// discriminant is the element's tag itself: `typeOf(item)` derives it from
// `_element.tagName`, and each guard narrows to the concrete ScElementItem.

import { ELEMENTS } from "@/constants/sc-elements";
import type {
  NodeType,
  ScControlItem,
  ScElementItemBase,
  ScGroupItem,
  ScParentItem,
  ScPluginItem,
  ScSynthDefItem,
  ScSynthItem,
  ScUgenItem,
  ScVarItem,
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
export function typeOf(el: ScElementItemBase): NodeType {
  return el._element.tagName.toLowerCase() as NodeType;
}

export function isPlugin(el: ScElementItemBase): el is ScPluginItem {
  return typeOf(el) === ELEMENTS.SC_PLUGIN;
}

export function isGroup(el: ScElementItemBase): el is ScGroupItem | ScPluginItem {
  const t = typeOf(el);
  return t === ELEMENTS.SC_GROUP || t === ELEMENTS.SC_PLUGIN;
}

export function isSynth(el: ScElementItemBase): el is ScSynthItem {
  return typeOf(el) === ELEMENTS.SC_SYNTH;
}

export function isSynthDef(el: ScElementItemBase): el is ScSynthDefItem {
  return typeOf(el) === ELEMENTS.SC_SYNTHDEF;
}

export function isUgen(el: ScElementItemBase): el is ScUgenItem {
  return typeOf(el) === ELEMENTS.SC_UGEN;
}

export function isControl(el: ScElementItemBase): el is ScControlItem {
  return typeOf(el) === ELEMENTS.SC_CONTROL;
}

export function isVar(el: ScElementItemBase): el is ScVarItem {
  return typeOf(el) === ELEMENTS.SC_VAR;
}

/** Stateful items a bind can target. */
export function isState(el: ScElementItemBase): el is ScControlItem | ScVarItem {
  const t = typeOf(el);
  return t === ELEMENTS.SC_CONTROL || t === ELEMENTS.SC_VAR;
}

/** Items that can own running scsynth nodes. */
export function isNode(el: ScElementItemBase): el is ScPluginItem | ScGroupItem | ScSynthItem {
  const t = typeOf(el);
  return t === ELEMENTS.SC_PLUGIN || t === ELEMENTS.SC_GROUP || t === ELEMENTS.SC_SYNTH;
}

export function isParent(el: ScElementItemBase): el is ScParentItem {
  return PARENT_TYPES.has(typeOf(el));
}
