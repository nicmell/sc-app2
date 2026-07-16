import { useSyncExternalStore } from "react";
import { Button, Flex } from "@/components/ui";
import type { EditorController } from "@/lib/editor/EditorController";
import {
  getParent,
  insertChild,
  moveNode,
  removeNode,
  type EditorNode,
  type ElementNode,
} from "@/lib/editor/model";
import { randomId } from "@/lib/utils/randomId";
import styles from "./Outline.module.scss";

const cloneWithFreshKeys = (node: EditorNode): EditorNode =>
  node.kind === "text"
    ? { ...node, key: randomId() }
    : { ...node, key: randomId(), children: node.children.map(cloneWithFreshKeys) };

export function Outline({ controller }: { controller: EditorController }) {
  const state = useSyncExternalStore(controller.store.subscribe, controller.store.get);

  const renderNode = (node: ElementNode, depth: number) => {
    const parent = getParent(state.doc, node.key);
    const index = parent?.children.findIndex((child) => child.key === node.key) ?? -1;
    const name = node.attrs.name;
    const stop = (event: React.MouseEvent) => event.stopPropagation();

    return (
      <li key={node.key} className={styles.item}>
        <div
          className={`${styles.row} ${state.selection === node.key ? styles.selected : ""}`}
          style={{ paddingLeft: `calc(var(--space-sm) + ${depth} * var(--space-md))` }}
          onClick={() => controller.select(node.key)}
        >
          <span className={styles.label}>
            <span className={styles.tag}>{node.tag}</span>
            {name && <span className={styles.name}>{name}</span>}
          </span>
          {parent && (
            <Flex className={styles.actions} gap="xs" onClick={stop}>
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon="arrow-up"
                label={`Move ${node.tag} up`}
                disabled={index <= 0}
                onClick={() =>
                  controller.commit((doc) => moveNode(doc, node.key, parent.key, index - 1))
                }
              />
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon="arrow-down"
                label={`Move ${node.tag} down`}
                disabled={index === parent.children.length - 1}
                onClick={() =>
                  controller.commit((doc) => moveNode(doc, node.key, parent.key, index + 2))
                }
              />
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon="copy"
                label={`Duplicate ${node.tag}`}
                onClick={() =>
                  controller.commit((doc) =>
                    insertChild(doc, parent.key, cloneWithFreshKeys(node), index + 1),
                  )
                }
              />
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon="trash"
                label={`Delete ${node.tag}`}
                onClick={() => controller.commit((doc) => removeNode(doc, node.key))}
              />
            </Flex>
          )}
        </div>
        {node.children.some((child) => child.kind === "element") && (
          <ul className={styles.tree}>
            {node.children.map((child) =>
              child.kind === "element" ? renderNode(child, depth + 1) : null,
            )}
          </ul>
        )}
      </li>
    );
  };

  return <ul className={styles.tree}>{renderNode(state.doc, 0)}</ul>;
}
