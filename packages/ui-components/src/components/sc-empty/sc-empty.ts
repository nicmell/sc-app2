// <sc-empty-base> — placeholder shown when a list/collection has no items yet
// (dashed border, muted text, centred). Shadow DOM: `:host` is the placeholder box
// over a <slot> for the author's message.

import { LitElement, html } from "lit";
import resetStyles from "../../foundations/reset.scss";
import styles from "./sc-empty.scss";

export class ScEmptyBase extends LitElement {
  static styles = [resetStyles, styles];

  render() {
    return html`<slot></slot>`;
  }
}
