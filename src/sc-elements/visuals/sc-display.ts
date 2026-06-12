// <sc-display> — a read-only formatted view of a bound control/var
// (`bind`/`_targetScNode` on the ScInput base). The load pass subscribes it
// to the target control's store key; a non-control target (an sc-var) gets a
// one-shot read until var propagation lands with its migration step.

import { html } from "lit";
import { property, state } from "lit/decorators.js";
import { isControlRuntime, isStateRuntime } from "@/lib/utils/guards";
import type {  } from "@/types/runtime";
import { requireProp } from "@/sc-elements/internal/validation";
import { ScInput } from "@/sc-elements/internal/sc-input";

/** Old-app printf-style formatting: `%b` booleans, `%s` strings, and
 *  `%(.N)?[df]` numbers (`%d` rounds, `%.2f` fixes the precision). */
export function formatValue(template: string, value: unknown): string {
  if (typeof value === "boolean") return template.replace("%b", value ? "true" : "false");
  if (typeof value === "string") return template.replace("%s", value);
  if (typeof value === "number") {
    return template.replace(/%(?:\.(\d+))?([df])/, (_, precision, type) => {
      if (type === "f" && precision) return value.toFixed(parseInt(precision));
      if (type === "d") return Math.round(value).toString();
      return String(value);
    });
  }
  return String(value ?? "");
}

export class ScDisplay extends ScInput {
  @property() accessor format = "";

  @state() accessor _value: number | undefined = undefined;

  private offValue?: () => void;

  validate(): void {
    requireProp(this, "bind", this.bind);
  }

  async load(): Promise<void> {
    const target = this._targetScNode;
    if (target && isControlRuntime(target) && target.enabled) {
      const view = target.selectValue();
      this._value = view.get();
      this.offValue = view.subscribe((v) => {
        if (v !== undefined) this._value = v;
      });
    } else if (target && isStateRuntime(target)) {
      this._value = target.value; // static until sc-var propagation lands
    }
    await super.load();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.offValue?.();
    this.offValue = undefined;
  }

  render() {
    return html`${this.format ? formatValue(this.format, this._value) : String(this._value ?? "")}`;
  }
}
