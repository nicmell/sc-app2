// <sc-icon-base> — a Phosphor icon. Renders the icon-font <i> with the global
// `ph-fill ph-<name>` classes from @phosphor-icons/web, which the host loads
// once (`import "@phosphor-icons/web/fill"`). Light DOM so those global classes
// apply; colour follows currentColor and size follows the surrounding
// font-size (1em) unless a size token is given.
//
// Only the FILL weight is supported by design — to add more weights later,
// introduce a `weight` prop (regular → "ph", others → `ph-<weight>`) and have
// the host import the corresponding `@phosphor-icons/web/<weight>` CSS.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";

export type ScIconSize = "sm" | "md" | "lg";

export class ScIconBase extends LitElement {
  /** Phosphor icon name (kebab-case, without the `ph-` prefix), e.g. "play". */
  @property() accessor name = "";
  /** Optional token-backed size; omit to inherit the surrounding font-size. */
  @property() accessor size: ScIconSize | undefined = undefined;
  /** Accessible label. When omitted the icon is decorative (aria-hidden). */
  @property() accessor label = "";

  /** Light DOM so the global Phosphor `.ph*` classes apply. */
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  render() {
    const cls = cx("sc-icon", "ph-fill", `ph-${this.name}`, {
      [`sc-icon--${this.size}`]: this.size,
    });
    return this.label
      ? html`<i class=${cls} role="img" aria-label=${this.label}></i>`
      : html`<i class=${cls} aria-hidden="true"></i>`;
  }
}
