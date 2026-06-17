import { css } from "lit";

export const knobStyles = css`
  :host {
    display: inline-block;
  }
  .sc-knob {
    display: inline-block;
    line-height: 0;
    cursor: grab;
    touch-action: none;
    user-select: none;
  }
  .sc-knob:active {
    cursor: grabbing;
  }
  .sc-knob--sm {
    inline-size: 1.75rem;
    block-size: 1.75rem;
  }
  .sc-knob--md {
    inline-size: 2.5rem;
    block-size: 2.5rem;
  }
  .sc-knob--lg {
    inline-size: 3.5rem;
    block-size: 3.5rem;
  }
  .sc-knob__svg {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }
  .sc-knob__input:focus-visible ~ .sc-knob__svg {
    border-radius: 50%;
    box-shadow: 0 0 0 2px var(--color-border-focus);
  }
  .sc-knob__body {
    fill: var(--color-surface-3);
    stroke: var(--color-border-strong);
    stroke-width: 2;
  }
  .sc-knob__indicator {
    stroke: var(--_accent);
    stroke-width: 9;
    stroke-linecap: round;
  }
`;
