import { useMemo, useState } from "react";
import { Icon } from "@/components/ui";
import type { EditorController } from "@/lib/editor/EditorController";
import { canContain } from "@/lib/editor/contentModel";
import { findNode, getParent, insertChild, type ElementNode } from "@/lib/editor/model";
import { SPECS } from "@/sc-elements/internal/xsd/registry";
import { beginPointerDnd } from "../Canvas/usePointerDnd";
import { HTML_PALETTE_TAGS, PALETTE_META } from "./paletteMeta";
import styles from "./Palette.module.scss";

const GROUPS = ["node", "synthdef", "state", "input", "visual", "widget", "html"] as const;
type Group = (typeof GROUPS)[number];

const GROUP_LABELS: Record<Group, string> = {
  node: "Nodes",
  synthdef: "Synth Definitions",
  state: "State",
  input: "Inputs",
  visual: "Visuals",
  widget: "Widgets",
  html: "HTML",
};

function paletteGroup(tag: string): Group | null {
  const category = SPECS.get(tag)?.category;
  if (category === "ugen") return "synthdef";
  return category && GROUPS.some((group) => group === category) ? (category as Group) : null;
}

export function Palette({ controller }: { controller: EditorController }) {
  const [closed, setClosed] = useState<ReadonlySet<Group>>(() => new Set());
  const grouped = useMemo(() => {
    const result = new Map<Group, string[]>(GROUPS.map((group) => [group, []]));
    for (const tag of Object.keys(PALETTE_META)) {
      const group = HTML_PALETTE_TAGS.includes(tag as (typeof HTML_PALETTE_TAGS)[number])
        ? "html"
        : paletteGroup(tag);
      if (group) result.get(group)?.push(tag);
    }
    return result;
  }, []);

  const insert = (tag: string) => {
    const meta = PALETTE_META[tag];
    const state = controller.store.get();
    let parent: ElementNode | null =
      state.selection === null
        ? state.doc
        : ((findNode(state.doc, state.selection)?.kind === "element"
            ? findNode(state.doc, state.selection)
            : getParent(state.doc, state.selection)) as ElementNode | null);
    while (parent && !canContain(parent.tag, tag)) parent = getParent(state.doc, parent.key);
    if (!parent && canContain(state.doc.tag, tag)) parent = state.doc;
    if (!parent) return;
    const parentKey = parent.key;
    const node = meta.template();
    controller.commit((doc) => insertChild(doc, parentKey, node));
    controller.select(node.key);
  };

  const toggle = (group: Group) => {
    setClosed((prior) => {
      const next = new Set(prior);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  return (
    <div className={styles.palette}>
      {GROUPS.map((group) => (
        <section key={group} className={styles.group}>
          <button
            type="button"
            className={styles.header}
            aria-expanded={!closed.has(group)}
            onClick={() => toggle(group)}
          >
            <Icon name={closed.has(group) ? "caret-right" : "caret-down"} />
            {GROUP_LABELS[group]}
          </button>
          {!closed.has(group) && (
            <div className={styles.items}>
              {grouped.get(group)?.map((tag) => {
                const meta = PALETTE_META[tag];
                return (
                  <button
                    key={tag}
                    type="button"
                    className={styles.item}
                    title={`Drag or double-click to add ${meta.label}`}
                    onPointerDown={(event) =>
                      beginPointerDnd(event, { kind: "new", tag, template: meta.template })
                    }
                    onDoubleClick={() => insert(tag)}
                  >
                    <Icon name={meta.icon} />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
