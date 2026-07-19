import type {
  ControlId,
  ControlValue,
  NumericValue,
  OscArg,
  ServerMessage,
} from "../../pkg/scserver_commands.js";

export const AddToHead = 0;
export const AddToTail = 1;
export const AddBefore = 2;
export const AddAfter = 3;
export const AddReplace = 4;

export const isInt = (v: number) => Number.isInteger(v);
export function toControlId(v: string | number): ControlId {
  return typeof v === "string" ? { name: v } : { index: v };
}
export function toNumericValue(v: number): NumericValue {
  return isInt(v) ? { int: v } : { float: v };
}
export function toControlValue(v: number | string): ControlValue {
  return typeof v === "string" ? { bus: v } : toNumericValue(v);
}
export function toOscArg(v: number | string | Uint8Array): OscArg {
  if (v instanceof Uint8Array) return { blob: v };
  if (typeof v === "string") return { string: v };
  return isInt(v) ? { int32: v } : { float32: v };
}
export function raw(address: string, ...args: Array<number | string | Uint8Array>): ServerMessage {
  return { address, args: args.map(toOscArg) };
}
