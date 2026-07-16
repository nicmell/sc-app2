import { Button, Flex, Input, InputNumber, Option, Select, Switch } from "@/components/ui";
import type { EditorController } from "@/lib/editor/EditorController";
import { setAttr, setBind, updateNode, type ElementNode, type NodeKey } from "@/lib/editor/model";
import type { Issue } from "@/lib/editor/validate";
import type { AttrSpec } from "@/sc-elements/internal/xsd/types";
import styles from "./Inspector.module.scss";

interface AttrFieldProps {
  controller: EditorController;
  node: ElementNode;
  nodeKey: NodeKey;
  name: string;
  attr: AttrSpec;
  issues: readonly Issue[];
}

type ValueTarget = EventTarget & { value: string | number };
type CheckedTarget = EventTarget & { checked: boolean };

function eventValue(event: Event): string {
  return String((event.target as ValueTarget).value);
}

function numberInputValue(event: Event): string {
  const host = event.target as HTMLElement & { value: number };
  return host.shadowRoot?.querySelector("input")?.value ?? String(host.value);
}

export function AttrField({ controller, node, nodeKey, name, attr, issues }: AttrFieldProps) {
  const bindName = `bind:${name}`;
  const bound = Object.hasOwn(node.attrs, bindName);
  const draft = bound ? (node.attrs[bindName] ?? "") : (node.attrs[name] ?? "");

  const write = (next: string) => {
    const operation = bound ? setBind : setAttr;
    controller.commit(
      (doc) =>
        updateNode(doc, nodeKey, (current) =>
          operation(current as ElementNode, name, bound ? next : next || null),
        ),
      `attr:${nodeKey}:${name}`,
    );
  };

  const changeDraft = (next: string) => {
    write(next);
  };

  const toggleBinding = () => {
    controller.commit((doc) =>
      updateNode(doc, nodeKey, (current) =>
        bound
          ? setBind(current as ElementNode, name, null)
          : setBind(current as ElementNode, name, ""),
      ),
    );
  };

  const field = (() => {
    if (bound) {
      return (
        <Input
          className={styles.expression}
          value={draft}
          placeholder="Expression"
          onInput={(event) => changeDraft(eventValue(event))}
          onChange={(event) => write(eventValue(event))}
        />
      );
    }
    if (attr.type === "enum") {
      const offset = attr.required ? 0 : 1;
      const selected = draft === "" ? 0 : attr.values.indexOf(draft) + offset;
      return (
        <Select
          value={selected}
          onChange={(event) => {
            const index = Number((event.target as ValueTarget).value);
            changeDraft(
              attr.required ? (attr.values[index] ?? "") : (attr.values[index - 1] ?? ""),
            );
          }}
        >
          {!attr.required && <Option value={0} label="Unset" />}
          {attr.values.map((option, index) => (
            <Option key={option} value={index + offset} label={option} />
          ))}
        </Select>
      );
    }
    if (attr.type === "boolean") {
      const checked = draft === "true" || draft === "1";
      return (
        <Flex align="center" gap="xs">
          <Switch
            checked={checked}
            onChange={(event) =>
              changeDraft((event.target as CheckedTarget).checked ? "true" : "false")
            }
          />
          {draft !== "" && (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              icon="x"
              label={`Clear ${name}`}
              onClick={() => changeDraft("")}
            />
          )}
        </Flex>
      );
    }
    if (attr.type === "integer" || attr.type === "decimal") {
      const numeric = Number(draft);
      return (
        <InputNumber
          value={draft === "" || Number.isNaN(numeric) ? 0 : numeric}
          step={attr.type === "integer" ? 1 : 0.01}
          onInput={(event) => changeDraft(numberInputValue(event))}
          onChange={(event) => write(numberInputValue(event))}
        />
      );
    }
    return (
      <Input
        value={draft}
        onInput={(event) => changeDraft(eventValue(event))}
        onChange={(event) => write(eventValue(event))}
      />
    );
  })();

  return (
    <div className={styles.field}>
      <div className={styles.fieldHeader}>
        <label className={styles.label}>
          {name}
          {attr.required && <span className={styles.required}>*</span>}
        </label>
        {attr.runtime !== false && (
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={bound ? "link-break" : "link"}
            label={bound ? `Use a static ${name}` : `Bind ${name} to an expression`}
            onClick={toggleBinding}
          />
        )}
      </div>
      {field}
      {issues.map((issue) => (
        <div className={styles.error} key={issue.message}>
          {issue.message}
        </div>
      ))}
    </div>
  );
}
