// <sc-empty-base> — placeholder shown when a list/collection has no items yet
// (dashed border, muted text, centred). Shadow DOM: slots the author's message;
// styled on `:host` (sc-empty.styles.ts).

import { LitElement, html } from "lit";
import { emptyStyles } from "./sc-empty.styles";

export class ScEmptyBase extends LitElement {
  static styles = [emptyStyles];

  render() {
    return html`<slot></slot>`;
  }
}
