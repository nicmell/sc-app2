// Lit contexts shared between the container widgets and their declarative
// children. A container (sc-radio-group / sc-select) is a ContextProvider; its
// children (sc-radio / sc-option) are ContextConsumers — they read the selected
// value, report clicks via `select`, and inherit size/disabled. This is
// the old sc-app coordination model, kept light-DOM (context-request events
// bubble from the child up to the provider host, no slot needed).

import { createContext } from "@lit/context";
import type { ScSize } from "./sc-control-base";

export interface RadioGroupContext {
  /** The group's selected value. */
  value: number;
  /** A child calls this on click to request selection. */
  select(value: number): void;
  /** Shared radio `name` so the native inputs form one group. */
  name: string;
  size: ScSize;
  disabled: boolean;
}

export const radioGroupContext = createContext<RadioGroupContext>("sc-radio-group");

export interface SelectContext {
  /** The select's current value. */
  value: number;
  /** An option calls this on click to request selection. */
  select(value: number): void;
  /** Shared size so each option sizes itself in its own shadow. */
  size: ScSize;
}

export const selectContext = createContext<SelectContext>("sc-select");
