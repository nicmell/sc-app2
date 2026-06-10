// Type guards over the parser items: each narrows a base item to its concrete
// ScElementItem by tag.

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

export function isPlugin(el: ScElementItemBase): el is ScPluginItem {
  return el.type === "sc-plugin";
}

export function isSynth(el: ScElementItemBase): el is ScSynthItem {
  return el.type === "sc-synth";
}

export function isSynthDef(el: ScElementItemBase): el is ScSynthDefItem {
  return el.type === "sc-synthdef";
}

export function isUgen(el: ScElementItemBase): el is ScUgenItem {
  return el.type === "sc-ugen";
}

export function isControl(el: ScElementItemBase): el is ScControlItem {
  return el.type === "sc-control";
}

/** Stateful items a bind can target (sc-var joins with its migration step). */
export function isState(el: ScElementItemBase): el is ScControlItem {
  return el.type === "sc-control";
}

/** Items that can own running scsynth nodes (sc-group joins later). */
export function isNode(el: ScElementItemBase): el is ScPluginItem | ScSynthItem {
  return el.type === "sc-plugin" || el.type === "sc-synth";
}

export function isParent(el: ScElementItemBase): el is ScParentItem {
  return (
    el.type === "sc-plugin" || el.type === "sc-synthdef" || el.type === "sc-ugen" || el.type === "sc-synth"
  );
}
