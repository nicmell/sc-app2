import rawSpec from "../specs/server-commands.json";

export type ScalarType = "i32" | "f32" | "string";
export type ValueType = ScalarType | "controlId" | "numericValue" | "controlValue" | "oscArg";
export type FieldForm =
  | { scalar: ScalarType }
  | { optionScalar: ScalarType }
  | "completion"
  | "blob"
  | { list: ValueType }
  | "variadic"
  | { tail: ValueType[] }
  | { setnTail: { head: ValueType; values: ValueType } };

export interface CommandField {
  name: string;
  form: FieldForm;
  doc?: string;
}

export interface CommandSpec {
  address: string;
  struct: string;
  category: string;
  fields: CommandField[];
  decode?: boolean;
  doc?: string;
}

interface ServerCommandsSpec {
  commands: CommandSpec[];
}
const spec = rawSpec as ServerCommandsSpec;

export const COMMANDS: ReadonlyMap<string, CommandSpec> = new Map(
  spec.commands.map((command) => [command.address, command]),
);
export const KNOWN_ADDRESSES: ReadonlySet<string> = new Set(COMMANDS.keys());
export function isKnownAddress(address: string): boolean {
  return KNOWN_ADDRESSES.has(address);
}
