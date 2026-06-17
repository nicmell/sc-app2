import { css } from "lit";

export const sliderStyles = css`
  :host {
    display: inline-block;
  }
  .sc-slider {
    display: inline-block;
    touch-action: none;
    user-select: none;
    cursor: grab;
  }
  .sc-slider:active {
    cursor: grabbing;
  }
  .sc-slider__track {
    position: relative;
    background: var(--color-surface-input);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-pill);
  }
  .sc-slider__fill {
    position: absolute;
    background: var(--_accent);
    border-radius: var(--radius-pill);
  }
  .sc-slider__thumb {
    position: absolute;
    inline-size: var(--_thumb, 1rem);
    block-size: var(--_thumb, 1rem);
    background: var(--_accent);
    border-radius: 50%;
    box-shadow: var(--shadow-sm);
  }
  .sc-slider__input:focus-visible ~ .sc-slider__track .sc-slider__thumb {
    box-shadow:
      var(--shadow-sm),
      0 0 0 2px var(--color-border-focus);
  }
  .sc-slider--horizontal .sc-slider__track {
    inline-size: var(--_len, 8rem);
    block-size: var(--_thick, 0.4rem);
  }
  .sc-slider--horizontal .sc-slider__fill {
    left: 0;
    top: 0;
    bottom: 0;
  }
  .sc-slider--horizontal .sc-slider__thumb {
    top: 50%;
    transform: translate(-50%, -50%);
  }
  .sc-slider--vertical .sc-slider__track {
    inline-size: var(--_thick, 0.4rem);
    block-size: var(--_len, 8rem);
  }
  .sc-slider--vertical .sc-slider__fill {
    left: 0;
    right: 0;
    bottom: 0;
  }
  .sc-slider--vertical .sc-slider__thumb {
    left: 50%;
    transform: translate(-50%, 50%);
  }
  .sc-slider--sm {
    --_len: 6rem;
    --_thick: 0.3rem;
    --_thumb: 0.8rem;
  }
  .sc-slider--md {
    --_len: 8rem;
    --_thick: 0.4rem;
    --_thumb: 1rem;
  }
  .sc-slider--lg {
    --_len: 11rem;
    --_thick: 0.5rem;
    --_thumb: 1.25rem;
  }
`;
