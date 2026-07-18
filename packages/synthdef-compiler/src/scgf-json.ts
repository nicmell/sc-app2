/**
 * The structured JSON form of a SynthDef — what `parseScgf` and
 * `SynthDef.toJson` return (the crate's serde shapes, camelCase).
 */

export interface InputSpec {
  /** -1 for a constant (then `outputIndex` indexes the constants table). */
  ugenIndex: number;
  outputIndex: number;
}

export interface OutputSpec {
  rate: number;
}

export interface UGenJson {
  className: string;
  rate: number;
  numInputs: number;
  numOutputs: number;
  specialIndex: number;
  inputs: InputSpec[];
  outputs: OutputSpec[];
}

export interface ParamName {
  name: string;
  index: number;
}

export interface SynthDefJson {
  name: string;
  constants: number[];
  parameters: { values: number[]; names: ParamName[] };
  ugens: UGenJson[];
  variants: unknown[];
}
