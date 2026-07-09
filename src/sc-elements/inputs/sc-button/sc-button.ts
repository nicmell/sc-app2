// <sc-button> — a button bound to a control/var (`bind`/`_targetScNode` on
// the ScInput base). Renders the ui-components <sc-base-button>, forwarding
// its props — `label` and `icon` are runtime-capable, the flagship use being
// a ternary swap (`_icon="s1.gate ? 'stop' : 'play'"`). A click writes
// through the shared commit path: the `value` attribute when given (a
// fixed-value trigger), else it TOGGLES the target between 0 and 1 on the
// current `_state`'s truthiness. Writes to derived state stay inert (the
// ScInput snap-back).

import { html } from "lit";
import { isStateRuntime } from "@/lib/utils/guards";
import { ScInput } from "@/sc-elements/internal/sc-input";
import "@sc-app/ui-components/lit";

export class ScButton extends ScInput {
  private onClick = () => {
    const value = this.getProp("value") as number | undefined;
    if (value !== undefined) {
      this.commit(value);
      return;
    }
    const target = this._targetScNode;
    if (!target || !isStateRuntime(target)) return;
    this.commit(target._state ? 0 : 1);
  };

  render() {
    return html`<sc-base-button
      label=${this.getProp("label")}
      icon=${this.getProp("icon")}
      size=${this.getProp("size")}
      variant=${this.getProp("variant")}
      ?disabled=${this.getProp("disabled")}
      @click=${this.onClick}
    ></sc-base-button>`;
  }
}
