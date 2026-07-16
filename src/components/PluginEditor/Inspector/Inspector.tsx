import { useState, useSyncExternalStore } from "react";
import { Badge, Button, Empty, Textarea } from "@/components/ui";
import type { EditorController, EditorState } from "@/lib/editor/EditorController";
import { acceptsText } from "@/lib/editor/contentModel";
import {
  findNode,
  removeNode,
  setText,
  updateNode,
  type ElementNode,
  type EditorNode,
  type TextNode,
} from "@/lib/editor/model";
import { randomId } from "@/lib/utils/randomId";
import { SPECS } from "@/sc-elements/internal/xsd/registry";
import { validateAttrs } from "@/lib/editor/validate";
import { AttrField } from "./AttrField";
import { CommonAttrsSection } from "./CommonAttrsSection";
import styles from "./Inspector.module.scss";

interface InspectorProps {
  controller: EditorController;
}

type ValueTarget = EventTarget & { value: string };

function useEditorState(controller: EditorController): EditorState {
  return useSyncExternalStore(
    controller.store.subscribe,
    controller.store.get,
    controller.store.get,
  );
}

function TextInspector({ controller, node }: { controller: EditorController; node: TextNode }) {
  return (
    <div className={styles.inspector}>
      <h2 className={styles.title}>Text</h2>
      <Textarea
        value={node.text}
        onInput={(event) => {
          const text = (event.target as ValueTarget).value;
          controller.commit(
            (doc) => updateNode(doc, node.key, (current) => setText(current as TextNode, text)),
            `text:${node.key}`,
          );
        }}
      />
    </div>
  );
}

function ContentEditor({
  controller,
  node,
  initialContent,
}: {
  controller: EditorController;
  node: ElementNode;
  initialContent: string;
}) {
  const [draft, setDraft] = useState(initialContent);
  const commit = () => {
    controller.commit(
      (doc) =>
        updateNode(doc, node.key, (current) => {
          const element = current as ElementNode;
          const firstText = element.children.find(
            (child): child is TextNode => child.kind === "text",
          );
          const text: TextNode = firstText
            ? setText(firstText, draft)
            : { key: randomId(), kind: "text", text: draft };
          const firstTextIndex = element.children.findIndex((child) => child.kind === "text");
          const children: EditorNode[] = element.children.filter((child) => child.kind !== "text");
          children.splice(firstTextIndex < 0 ? children.length : firstTextIndex, 0, text);
          return { ...element, children };
        }),
      `content:${node.key}`,
    );
  };

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Content</h3>
      <Textarea
        value={draft}
        onInput={(event) => setDraft((event.target as ValueTarget).value)}
        onChange={commit}
      />
    </section>
  );
}

function ContentField({ controller, node }: { controller: EditorController; node: ElementNode }) {
  const content = node.children
    .filter((child): child is TextNode => child.kind === "text")
    .map((child) => child.text)
    .join("");

  return (
    <ContentEditor
      key={`${node.key}:${content}`}
      controller={controller}
      node={node}
      initialContent={content}
    />
  );
}

export function Inspector({ controller }: InspectorProps) {
  const state = useEditorState(controller);
  const node = state.selection === null ? null : findNode(state.doc, state.selection);

  if (!node) return <Empty>Select an element to inspect.</Empty>;
  if (node.kind === "text") return <TextInspector controller={controller} node={node} />;

  const spec = SPECS.get(node.tag);
  const issues = spec ? validateAttrs(node, spec) : [];

  return (
    <aside className={styles.inspector}>
      <header className={styles.header}>
        <Badge>{node.tag}</Badge>
        {node.tag !== "sc-plugin" && (
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon="trash"
            label={`Delete ${node.tag}`}
            onClick={() => {
              controller.commit((doc) => removeNode(doc, node.key));
              controller.select(null);
            }}
          />
        )}
      </header>
      <section className={styles.section}>
        <h2 className={styles.title}>Attributes</h2>
        {Object.entries(spec?.attrs ?? {}).map(([name, attr]) => (
          <AttrField
            key={name}
            controller={controller}
            node={node}
            nodeKey={node.key}
            name={name}
            attr={attr}
            issues={issues.filter((issue) => issue.attr === name)}
          />
        ))}
        {!spec?.attrs && <p className={styles.muted}>No element-specific attributes.</p>}
      </section>
      <CommonAttrsSection controller={controller} node={node} />
      {acceptsText(node.tag) && <ContentField controller={controller} node={node} />}
    </aside>
  );
}
