// <sc-col> — plugin-facing grid item. The host must be the flex item because it
// is the node assigned to <sc-base-row>'s slot; <sc-base-col> owns the gutter
// box and renders the plugin content inside that correctly sized item.

import { html } from "lit";
import { scColLayoutStyles } from "@sc-app/ui-components/lit";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScCol extends ScElement {
  static styles = scColLayoutStyles;

  createRenderRoot(): HTMLElement | DocumentFragment {
    return this.createShadowRenderRoot();
  }

  render() {
    return html`<sc-base-col flex="auto"><slot></slot></sc-base-col>`;
  }
}
