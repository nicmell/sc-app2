// Lit contexts shared between the container widgets and their declarative
// children. A container (sc-radio-group / sc-select) is a ContextProvider; its
// children (sc-radio / sc-option) are ContextConsumers — they read the selected
// value, report clicks via `select`, and inherit size/variant/disabled. This is
// the old sc-app coordination model, kept light-DOM (context-request events
// bubble from the child up to the provider host, no slot needed).

import { createContext } from "@lit/context";
import type { ScSize, ScVariant } from "./sc-widget-base";

export interface RadioGroupContext {
  /** The group's selected value. */
  value: number;
  /** A child calls this on click to request selection. */
  select(value: number): void;
  /** Shared radio `name` so the native inputs form one group. */
  name: string;
  size: ScSize;
  variant: ScVariant;
  disabled: boolean;
}

export const radioGroupContext = createContext<RadioGroupContext>("sc-radio-group");

export interface SelectContext {
  /** The select's current value. */
  value: number;
  /** An option calls this on click to request selection. */
  select(value: number): void;
  /** Shared size/variant so each option self-applies the accent in its own
   *  shadow (no cross-boundary `--_accent` handoff). */
  size: ScSize;
  variant: ScVariant;
}

export const selectContext = createContext<SelectContext>("sc-select");
