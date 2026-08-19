// <sc-button> — a button writing to a control/var (`bind:value` on the
// ScInput base). Renders the ui-components <sc-base-button>, forwarding its
// props — `label` and `icon` are runtime-capable, the flagship use being a
// ternary swap (`bind:icon="s1.gate ? 'stop' : 'play'"`). A click writes
// through the shared commit path: the `set` attribute when given (a
// fixed-value trigger — itself runtime-capable as `bind:set`), else it
// TOGGLES the target between 0 and 1 on the live value's truthiness.
//
// Buttons are WRITE-ONLY, so unlike the other inputs (where an expression or
// static `value` is a legitimate read-only meter) a button without a
// writable target is dead weight — resolveRuntime rejects it.

import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import type { RuntimeContext } from "@/types/runtime";
import { ScInput } from "@/sc-elements/internal/sc-input";
import { failValidation } from "@/sc-elements/internal/validation";
import "@sc-app/ui-components/lit";

export class ScButton extends ScInput {
  protected resolveRuntime(ctx: RuntimeContext): void {
    super.resolveRuntime(ctx);
    // Requires a plain single-path bind:value resolving to WRITABLE state —
    // an expression bind, a static `value`, or a DERIVED target (whose
    // setValue is inert) all leave nothing to click into. The bind-order
    // constraint guarantees the target processed first, so its own
    // runtimeProps are settled here.
    const target = this.targetScState;
    if (!target || target.runtimeProps?.value !== undefined) {
      failValidation(this, `"bind:value" must reference a single writable control/var`);
    }
  }

  private onClick = () => {
    const set = this.getProp("set") as number | undefined;
    if (set !== undefined) {
      this.commit(set);
      return;
    }
    this.commit(this.runtimeValue("value") ? 0 : 1);
  };

  render() {
    return html`<sc-base-button
      label=${ifDefined(this.getProp("label"))}
      icon=${ifDefined(this.getProp("icon"))}
      size=${ifDefined(this.getProp("size"))}
      variant=${ifDefined(this.getProp("variant"))}
      ?disabled=${this.getProp("disabled")}
      @click=${this.onClick}
    ></sc-base-button>`;
  }
}
