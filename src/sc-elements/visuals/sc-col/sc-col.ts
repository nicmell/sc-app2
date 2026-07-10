// <sc-col> — plugin-facing 24-unit grid column wrapper over <sc-base-col>.

import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { ScElement } from "@/sc-elements/internal/sc-element";
import "@sc-app/ui-components/lit";

export class ScCol extends ScElement {
  createRenderRoot(): HTMLElement | DocumentFragment {
    return this.attachShadow({ mode: "open" });
  }

  render() {
    return html`<sc-base-col
      span=${ifDefined(this.getProp("span"))}
      offset=${ifDefined(this.getProp("offset"))}
      order=${ifDefined(this.getProp("order"))}
      push=${ifDefined(this.getProp("push"))}
      pull=${ifDefined(this.getProp("pull"))}
      flex=${ifDefined(this.getProp("flex"))}
    >
      <slot></slot>
    </sc-base-col>`;
  }
}
