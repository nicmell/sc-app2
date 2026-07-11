// <sc-col> — plugin-facing grid item. The host must be the grid item because it
// is the node assigned to <sc-base-row>'s slot. The row owns the native grid
// gap; <sc-base-col> supplies the content box inside the correctly sized item.

import { html } from "lit";
import { scColLayoutStyles } from "@sc-app/ui-components/lit";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScCol extends ScElement {
  static styles = scColLayoutStyles;

  createRenderRoot(): HTMLElement | DocumentFragment {
    return this.createShadowRenderRoot();
  }

  render() {
    return html`<sc-base-col><slot></slot></sc-base-col>`;
  }
}
