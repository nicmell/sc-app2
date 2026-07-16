import { Input, Textarea } from "@/components/ui";
import type { EditorController } from "@/lib/editor/EditorController";
import { setAttr, updateNode, type ElementNode } from "@/lib/editor/model";
import { COMMON_ATTRS } from "@/sc-elements/internal/xsd/types";
import styles from "./Inspector.module.scss";

interface CommonAttrsSectionProps {
  controller: EditorController;
  node: ElementNode;
}

type ValueTarget = EventTarget & { value: string };

export function CommonAttrsSection({ controller, node }: CommonAttrsSectionProps) {
  const write = (name: string, value: string) => {
    if (!COMMON_ATTRS.has(name)) return;
    controller.commit(
      (doc) =>
        updateNode(doc, node.key, (current) =>
          setAttr(current as ElementNode, name, value || null),
        ),
      `attr:${node.key}:${name}`,
    );
  };

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Common attributes</h3>
      {(["id", "class", "title"] as const).map((name) => (
        <label className={styles.field} key={name}>
          <span className={styles.label}>{name}</span>
          <Input
            value={node.attrs[name] ?? ""}
            onInput={(event) => write(name, (event.target as ValueTarget).value)}
          />
        </label>
      ))}
      <label className={styles.field}>
        <span className={styles.label}>style</span>
        <Textarea
          value={node.attrs.style ?? ""}
          onInput={(event) => write("style", (event.target as ValueTarget).value)}
        />
      </label>
    </section>
  );
}
