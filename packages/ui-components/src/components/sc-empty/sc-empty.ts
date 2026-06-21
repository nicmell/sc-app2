// <sc-empty-base> — placeholder shown when a list/collection has no items yet
// (dashed border, muted text, centred). Shadow DOM: a `.root` wrapping a <slot>
// for the author's message.

import { LitElement, html } from "lit";
import { foundations } from "../internal/foundation-styles";
import { styles } from "./sc-empty.styles";

export class ScEmptyBase extends LitElement {
  static styles = [foundations, styles];

  render() {
    return html`<div class="root"><slot></slot></div>`;
  }
}
