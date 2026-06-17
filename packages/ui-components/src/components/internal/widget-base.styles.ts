import { css } from "lit";

/** Shared chrome for the ScWidgetBase family (checkbox/switch/knob/slider/
 *  option/radio), composed into each one's shadow `static styles`: the `.sr-only`
 *  helper for the hidden native <input>, the disabled affordance, and the
 *  variant → `--_accent` mapping (the single colour channel each widget tints).
 *  Selectors are keyed by every block class; the irrelevant ones simply don't
 *  match inside a given component's shadow. */
export const widgetBaseStyles = css`
  /* Visually hidden but focusable: the native <input> sits under the overlay. */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  .sc-checkbox--disabled,
  .sc-switch--disabled,
  .sc-radio--disabled,
  .sc-knob--disabled,
  .sc-slider--disabled,
  .sc-option--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  .sc-checkbox--primary,
  .sc-switch--primary,
  .sc-radio--primary,
  .sc-knob--primary,
  .sc-slider--primary,
  .sc-option--primary {
    --_accent: var(--color-primary);
  }
  .sc-checkbox--neutral,
  .sc-switch--neutral,
  .sc-radio--neutral,
  .sc-knob--neutral,
  .sc-slider--neutral,
  .sc-option--neutral {
    --_accent: var(--color-text-dim);
  }
  .sc-checkbox--ok,
  .sc-switch--ok,
  .sc-radio--ok,
  .sc-knob--ok,
  .sc-slider--ok,
  .sc-option--ok {
    --_accent: var(--color-ok);
  }
  .sc-checkbox--warn,
  .sc-switch--warn,
  .sc-radio--warn,
  .sc-knob--warn,
  .sc-slider--warn,
  .sc-option--warn {
    --_accent: var(--color-warn);
  }
  .sc-checkbox--danger,
  .sc-switch--danger,
  .sc-radio--danger,
  .sc-knob--danger,
  .sc-slider--danger,
  .sc-option--danger {
    --_accent: var(--color-danger);
  }
`;
