// The content-model groups the generator derives from element categories. Each
// entry becomes an `<xs:group>` whose members are the specs of that category (in
// ELEMENTS order), and `blockContent` = `htmlElements` (from the preamble) + these
// groups. Categories NOT listed here — `ugen`, `option` — are child-only: they get
// no group and are referenced explicitly by their parent's `content.choice`
// (sc-synthdef → sc-ugen, sc-select → sc-option, sc-radio-group → sc-radio).

import type { Category } from "@/sc-elements/internal/xsd/types";

export const BLOCK_GROUPS: ReadonlyArray<{ category: Category; group: string }> = [
  { category: "input", group: "scInputs" },
  { category: "visual", group: "scVisuals" },
  { category: "widget", group: "scWidgets" },
  { category: "state", group: "scState" },
  { category: "node", group: "scNodes" },
  { category: "synthdef", group: "scSynthDefs" },
];

/** The composite group every block container (blockType, sc-group, sc-if) uses. */
export const BLOCK_CONTENT = "blockContent";

/** Group names the generator recognises in a `content.choice` (everything else
 *  in a choice is an element tag). `htmlElements` lives in the preamble; the
 *  category groups + `blockContent` are generated. */
export const GROUP_NAMES: ReadonlySet<string> = new Set([
  "htmlElements",
  "inlineContent",
  BLOCK_CONTENT,
  ...BLOCK_GROUPS.map((g) => g.group),
]);
