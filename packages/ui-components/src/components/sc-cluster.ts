// <sc-cluster-base> — horizontal flex layout primitive (a "row of inline
// things": toolbars, label + input, chip + readout). Centred cross-axis, wraps.
// Shadow DOM: slots the author's children; the `gap` reflected prop selects the
// spacing (`:host([gap=…])`, sc-cluster.styles.ts). Reuses ScGap.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import type { ScGap } from "./sc-stack";
import { clusterStyles } from "./sc-cluster.styles";

export class ScClusterBase extends LitElement {
  @property({ reflect: true }) accessor gap: ScGap = "xs";

  static styles = [clusterStyles];

  render() {
    return html`<slot></slot>`;
  }
}
