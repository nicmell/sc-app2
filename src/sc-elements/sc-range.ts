// <sc-range> — a range input bound to a control (`bind`). Deliberately
// unstyled for now: a native <input type="range">; the knob/slider internals
// return with the inputs migration step. Changing it is a stub — the bound
// control doesn't move yet.

import { html } from "lit";
import type { ScRangeItem } from "@/types/parsers";
import { ScElement } from "./internal/sc-element";

export class ScRange extends ScElement<ScRangeItem> {
  static properties = {
    bind: { type: String },
    min: { type: Number },
    max: { type: Number },
    step: { type: Number },
    value: { type: Number },
  };

  declare bind: string;
  declare min: number;
  declare max: number;
  declare step: number;
  declare value: number;

  constructor() {
    super();
    this.bind = "";
    this.min = 0;
    this.max = 1;
    this.step = 0.01;
    this.value = 0;
  }

  private onInput = (e: Event) => {
    const value = Number((e.target as HTMLInputElement).value);
    this.value = value;
    // Stub: control propagation arrives with the controls migration step.
    console.debug(`[sc-range] ${this.bind || "(unbound)"} → ${value}`);
  };

  render() {
    return html`<input
      type="range"
      min=${this.min}
      max=${this.max}
      step=${this.step}
      .value=${String(this.value)}
      @input=${this.onInput}
    />`;
  }
}
