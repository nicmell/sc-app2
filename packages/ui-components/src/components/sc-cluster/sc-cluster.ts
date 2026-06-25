// <sc-cluster-base> — horizontal flex layout primitive (a "row of inline
// things": toolbars, label + input, chip + readout). Centred cross-axis, wraps.
// Shadow DOM: a `.root` flex row (with the `gap` modifier) wrapping a <slot>.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import type { ScGap } from "../sc-stack/sc-stack";
import { foundations } from "../internal/foundation-styles";
import styles from "./sc-cluster.css";

export class ScClusterBase extends LitElement {
  static styles = [foundations, styles];

  @property() accessor gap: ScGap = "xs";

  render() {
    return html`<div class=${cx("root", this.gap !== "xs" && this.gap)}>
      <slot></slot>
    </div>`;
  }
}
