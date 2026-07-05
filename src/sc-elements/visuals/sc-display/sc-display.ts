// <sc-display> — a read-only formatted view of an expression bind (the
// ScVisual base): a plain control/var path (`bind="s1.freq"`) or any
// evaluable expression (`bind="vars.amp * 100"`), rendered through the
// printf-style `format`.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { requireProp } from "@/sc-elements/internal/validation";
import { ScVisual } from "@/sc-elements/internal/sc-visual";

/** Old-app printf-style formatting: `%b` booleans, `%s` strings, and
 *  `%(.N)?[df]` numbers (`%d` rounds, `%.2f` fixes the precision). */
export function formatValue(
  template: string,
  value: string | number | boolean | null | undefined,
): string {
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

export class ScDisplay extends ScVisual {
  @property() accessor format = "";

  validate(): void {
    requireProp(this, "bind", this.bind);
  }

  render() {
    return html`${this.format ? formatValue(this.format, this._value) : String(this._value ?? "")}`;
  }
}
