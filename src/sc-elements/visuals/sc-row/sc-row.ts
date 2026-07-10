// <sc-row> — plugin-facing 24-unit grid row wrapper over <sc-base-row>.

import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { ScElement } from "@/sc-elements/internal/sc-element";
import "@sc-app/ui-components/lit";

export class ScRow extends ScElement {
  createRenderRoot(): HTMLElement | DocumentFragment {
    return this.attachShadow({ mode: "open" });
  }

  render() {
    return html`<sc-base-row
      align=${ifDefined(this.getProp("align"))}
      justify=${ifDefined(this.getProp("justify"))}
      gutter=${ifDefined(this.getProp("gutter"))}
      .wrap=${this.getProp("wrap") ?? true}
    >
      <slot></slot>
    </sc-base-row>`;
  }
}
