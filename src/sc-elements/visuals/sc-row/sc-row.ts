// <sc-row> — plugin-facing 24-unit grid row wrapper over <sc-base-row>.
// The internal base row is the grid container; each slotted <sc-col> host is
// the actual grid item and uses <sc-base-col> for its content box.

import { css, html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { ScElement } from "@/sc-elements/internal/sc-element";
import "@sc-app/ui-components/lit";

export class ScRow extends ScElement {
  static styles = css`
    :host {
      display: block;
      min-width: 0;
    }
  `;

  createRenderRoot(): HTMLElement | DocumentFragment {
    return this.createShadowRenderRoot();
  }

  render() {
    return html`<sc-base-row
      align=${ifDefined(this.getProp("align"))}
      gutter=${ifDefined(this.getProp("gutter"))}
    >
      <slot></slot>
    </sc-base-row>`;
  }
}
