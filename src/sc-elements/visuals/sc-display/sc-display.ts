// <sc-display> — a read-only formatted view of a value: usually the dynamic
// `bind:value` expression (`bind:value="s1.freq"`, `bind:value="vars.amp * 100"`,
// `bind:value="osc.gate ? 'playing' : 'stopped'"`), or a static `value` constant.
// Both read through `getProp("value")` (the ScElement runtime-prop machinery
// keeps the dynamic one live), rendered through the printf-style `format` —
// itself runtime-capable (`bind:format`).

import { html } from "lit";
import { ScElement } from "@/sc-elements/internal/sc-element";
import "@/sc-elements/visuals/sc-text";

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

export class ScDisplay extends ScElement {
  render() {
    const value = this.getProp("value");
    const format = this.getProp("format") as string | undefined;
    const text = format ? formatValue(format, value) : String(value ?? "");
    return html`<sc-text as="label">${text}</sc-text>`;
  }
}
