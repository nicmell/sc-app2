// <sc-cluster-base> — horizontal flex layout primitive (a "row of inline
// things": toolbars, label + input, chip + readout). Centred cross-axis, wraps.
// Shadow DOM: `:host` is the flex row (with the reflected `gap` modifier) over a <slot>.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import type { ScGap } from "../sc-stack/sc-stack";
import resetStyles from "../../foundations/reset.scss";
import styles from "./sc-cluster.scss";

export class ScClusterBase extends LitElement {
  static styles = [resetStyles, styles];

  @property({ reflect: true }) accessor gap: ScGap = "xs";

  render() {
    return html`<slot></slot>`;
  }
}
