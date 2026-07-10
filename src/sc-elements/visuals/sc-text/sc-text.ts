// <sc-text> — plugin-facing typography wrapper over ui-components'
// <sc-base-text>. It keeps authored children in light DOM and projects them
// through shadow DOM so nested sc-* elements remain parseable/runtime-live.

import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { ScElement } from "@/sc-elements/internal/sc-element";
import "@sc-app/ui-components/lit";

export class ScText extends ScElement {
  createRenderRoot(): HTMLElement | DocumentFragment {
    return this.attachShadow({ mode: "open" });
  }

  render() {
    return html`<sc-base-text
      as=${ifDefined(this.getProp("as"))}
      size=${ifDefined(this.getProp("size"))}
      weight=${ifDefined(this.getProp("weight"))}
      tone=${ifDefined(this.getProp("tone"))}
      font=${ifDefined(this.getProp("font"))}
      align=${ifDefined(this.getProp("align"))}
      transform=${ifDefined(this.getProp("transform"))}
      ?truncate=${this.getProp("truncate")}
      ?inline=${this.getProp("inline")}
    >
      <slot></slot>
    </sc-base-text>`;
  }
}
