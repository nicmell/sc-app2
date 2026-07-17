/** @module Interface scserver:commands/core@0.1.0 **/
export type OscArg = OscArgInt32 | OscArgFloat32 | OscArgFloat64 | OscArgString | OscArgBlob;
export interface OscArgInt32 {
  tag: 'int32',
  val: number,
}
export interface OscArgFloat32 {
  tag: 'float32',
  val: number,
}
export interface OscArgFloat64 {
  tag: 'float64',
  val: number,
}
export interface OscArgString {
  tag: 'string',
  val: string,
}
export interface OscArgBlob {
  tag: 'blob',
  val: Uint8Array,
}
export interface OscTime {
  seconds: number,
  fractional: number,
}
