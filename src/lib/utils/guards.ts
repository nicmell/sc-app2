// Type guards over the parser items. There is no stored `type` field — the
// discriminant is the element's tag itself: `typeOf(item)` derives it from
// `_element.tagName`, and each guard narrows to the concrete ScElementItem.

import { ELEMENTS } from "@/constants/sc-elements";
import type {
  NodeType,
  ScControlItem,
  ScElementItemBase,
  ScParentItem,
  ScPluginItem,
  ScSynthDefItem,
  ScSynthItem,
  ScUgenItem,
} from "@/types/parsers";

const NODE_TYPES: ReadonlySet<string> = new Set(Object.values(ELEMENTS));

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

/** Stateful items a bind can target (sc-var joins with its migration step). */
export function isState(el: ScElementItemBase): el is ScControlItem {
  return typeOf(el) === ELEMENTS.SC_CONTROL;
}

/** Items that can own running scsynth nodes (sc-group joins later). */
export function isNode(el: ScElementItemBase): el is ScPluginItem | ScSynthItem {
  const t = typeOf(el);
  return t === ELEMENTS.SC_PLUGIN || t === ELEMENTS.SC_SYNTH;
}

export function isParent(el: ScElementItemBase): el is ScParentItem {
  const t = typeOf(el);
  return (
    t === ELEMENTS.SC_PLUGIN || t === ELEMENTS.SC_SYNTHDEF || t === ELEMENTS.SC_UGEN || t === ELEMENTS.SC_SYNTH
  );
}
