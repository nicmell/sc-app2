// <sc-flex> — plugin-facing flex layout wrapper over <sc-base-flex>.

import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { ScElement } from "@/sc-elements/internal/sc-element";
import "@sc-app/ui-components/lit";

export class ScFlex extends ScElement {
  createRenderRoot(): HTMLElement | DocumentFragment {
    return this.attachShadow({ mode: "open" });
  }

  render() {
    return html`<sc-base-flex
      orientation=${ifDefined(this.getProp("orientation"))}
      justify=${ifDefined(this.getProp("justify"))}
      align=${ifDefined(this.getProp("align"))}
      gap=${ifDefined(this.getProp("gap"))}
      ?wrap=${this.getProp("wrap")}
    >
      <slot></slot>
    </sc-base-flex>`;
  }
}
