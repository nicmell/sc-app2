/* tslint:disable */
/* eslint-disable */

export class SynthDef {
    /**
     * Construct a def, optionally building its graph SC-style: the callback
     * runs synchronously with this def as the ambient build target, so the
     * typed builders need no def argument. The callback also receives the
     * def handle (for addControl / addUgen). Must be synchronous — the
     * ambient scope ends when the constructor returns.
     */
    constructor(name: string, graph?: (def: SynthDef) => void);
    free(): void;
    /** Add a named scalar control; returns its UGenInput handle. */
    addControl(name: string, defaultValue: number, rate: string): UGenInput;
    /** Add a named ARRAY control (consecutive slots, one name at the base index). */
    addControlArray(name: string, defaults: Float32Array | number[], rate: string): UGenInput[];
    /** Append a UGen node (registry-driven); returns the node index. */
    addUgen(className: string, rate: string, inputs: (UGenInput | number)[], numOutputs: number, specialIndex: number): number;
    /** The calculation rate of an already-added node, or undefined. */
    nodeRate(index: number): string | undefined;
    /** Encode to SCgf v2 bytes. */
    toBytes(): Uint8Array;
    /** The structured JSON form (what parseScgf also returns). */
    toJson(): any;
}



export type UGenInputLike = UGenInput | number;


/**
 * Input to a UGen: a constant, the default output of another UGen, or a
 * specific output of a multi-output UGen.
 *
 * UGen indices refer to positions in the `SynthDef`\'s node list, returned by
 * [`SynthDef::add_ugen`] and [`SynthDef::add_control`].
 */
export type UGenInput = { constant: number } | { ugen: number } | { ugenOutput: [number, number] };

export class MulAdd {
    private constructor();
    static ir(args?: { in?: UGenInputLike; mul?: UGenInputLike; add?: UGenInputLike }): UGenInput;
    static ar(args?: { in?: UGenInputLike; mul?: UGenInputLike; add?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; mul?: UGenInputLike; add?: UGenInputLike }): UGenInput;
}
export class BAllPass {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
}
export class BBandPass {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; bw?: UGenInputLike }): UGenInput;
}
export class BBandStop {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; bw?: UGenInputLike }): UGenInput;
}
export class BHiPass {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
}
export class BHiShelf {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; rs?: UGenInputLike; db?: UGenInputLike }): UGenInput;
}
export class BLowPass {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
}
export class BLowShelf {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; rs?: UGenInputLike; db?: UGenInputLike }): UGenInput;
}
export class BPeakEQ {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; rq?: UGenInputLike; db?: UGenInputLike }): UGenInput;
}
export class BufRd {
    private constructor();
    static ar(args?: { numChannels?: number; bufnum?: UGenInputLike; phase?: UGenInputLike; loop?: UGenInputLike; interpolation?: UGenInputLike }): UGenInput;
    static kr(args?: { numChannels?: number; bufnum?: UGenInputLike; phase?: UGenInputLike; loop?: UGenInputLike; interpolation?: UGenInputLike }): UGenInput;
}
export class BufWr {
    private constructor();
    static ar(args?: { inputArray?: UGenInputLike[]; bufnum?: UGenInputLike; phase?: UGenInputLike; loop?: UGenInputLike }): UGenInput;
    static kr(args?: { inputArray?: UGenInputLike[]; bufnum?: UGenInputLike; phase?: UGenInputLike; loop?: UGenInputLike }): UGenInput;
}
export class ClearBuf {
    private constructor();
    static ir(args?: { buf?: UGenInputLike }): UGenInput;
}
export class LocalBuf {
    private constructor();
    static ir(args?: { numChannels?: number; numFrames?: UGenInputLike }): UGenInput;
}
export class MaxLocalBufs {
    private constructor();
    static ir(args?: { numLocalBufs?: UGenInputLike }): UGenInput;
}
export class PlayBuf {
    private constructor();
    static ar(args?: { numChannels?: number; bufnum?: UGenInputLike; rate?: UGenInputLike; trigger?: UGenInputLike; startPos?: UGenInputLike; loop?: UGenInputLike; action?: UGenInputLike }): UGenInput;
    static kr(args?: { numChannels?: number; bufnum?: UGenInputLike; rate?: UGenInputLike; trigger?: UGenInputLike; startPos?: UGenInputLike; loop?: UGenInputLike; action?: UGenInputLike }): UGenInput;
}
export class RecordBuf {
    private constructor();
    static ar(args?: { inputArray?: UGenInputLike[]; bufnum?: UGenInputLike; offset?: UGenInputLike; recLevel?: UGenInputLike; preLevel?: UGenInputLike; run?: UGenInputLike; loop?: UGenInputLike; trigger?: UGenInputLike; action?: UGenInputLike }): UGenInput;
    static kr(args?: { inputArray?: UGenInputLike[]; bufnum?: UGenInputLike; offset?: UGenInputLike; recLevel?: UGenInputLike; preLevel?: UGenInputLike; run?: UGenInputLike; loop?: UGenInputLike; trigger?: UGenInputLike; action?: UGenInputLike }): UGenInput;
}
export class ScopeOut {
    private constructor();
    static ar(args?: { inputArray?: UGenInputLike[]; bufnum?: UGenInputLike }): UGenInput;
    static kr(args?: { inputArray?: UGenInputLike[]; bufnum?: UGenInputLike }): UGenInput;
}
export class ScopeOut2 {
    private constructor();
    static ar(args?: { inputArray?: UGenInputLike[]; scopeNum?: UGenInputLike; maxFrames?: UGenInputLike; scopeFrames?: UGenInputLike }): UGenInput;
    static kr(args?: { inputArray?: UGenInputLike[]; scopeNum?: UGenInputLike; maxFrames?: UGenInputLike; scopeFrames?: UGenInputLike }): UGenInput;
}
export class SetBuf {
    private constructor();
    static ar(args?: { buf?: UGenInputLike; values?: UGenInputLike; offset?: UGenInputLike }): UGenInput;
    static kr(args?: { buf?: UGenInputLike; values?: UGenInputLike; offset?: UGenInputLike }): UGenInput;
}
export class TGrains {
    private constructor();
    static ar(args?: { numChannels?: number; trigger?: UGenInputLike; bufnum?: UGenInputLike; rate?: UGenInputLike; centerPos?: UGenInputLike; dur?: UGenInputLike; pan?: UGenInputLike; amp?: UGenInputLike; interp?: UGenInputLike }): UGenInput;
}
export class CuspL {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; xi?: UGenInputLike }): UGenInput;
}
export class CuspN {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; xi?: UGenInputLike }): UGenInput;
}
export class FBSineC {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; im?: UGenInputLike; fb?: UGenInputLike; a?: UGenInputLike; c?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike }): UGenInput;
}
export class FBSineL {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; im?: UGenInputLike; fb?: UGenInputLike; a?: UGenInputLike; c?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike }): UGenInput;
}
export class FBSineN {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; im?: UGenInputLike; fb?: UGenInputLike; a?: UGenInputLike; c?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike }): UGenInput;
}
export class GbmanL {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike }): UGenInput;
}
export class GbmanN {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike }): UGenInput;
}
export class HenonC {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; x0?: UGenInputLike; x1?: UGenInputLike }): UGenInput;
}
export class HenonL {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; x0?: UGenInputLike; x1?: UGenInputLike }): UGenInput;
}
export class HenonN {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; x0?: UGenInputLike; x1?: UGenInputLike }): UGenInput;
}
export class LatoocarfianC {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; c?: UGenInputLike; d?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike }): UGenInput;
}
export class LatoocarfianL {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; c?: UGenInputLike; d?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike }): UGenInput;
}
export class LatoocarfianN {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; c?: UGenInputLike; d?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike }): UGenInput;
}
export class LinCongC {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; a?: UGenInputLike; c?: UGenInputLike; m?: UGenInputLike; xi?: UGenInputLike }): UGenInput;
}
export class LinCongL {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; a?: UGenInputLike; c?: UGenInputLike; m?: UGenInputLike; xi?: UGenInputLike }): UGenInput;
}
export class LinCongN {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; a?: UGenInputLike; c?: UGenInputLike; m?: UGenInputLike; xi?: UGenInputLike }): UGenInput;
}
export class LorenzL {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; s?: UGenInputLike; r?: UGenInputLike; b?: UGenInputLike; h?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike; zi?: UGenInputLike }): UGenInput;
}
export class QuadC {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; c?: UGenInputLike; xi?: UGenInputLike }): UGenInput;
}
export class QuadL {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; c?: UGenInputLike; xi?: UGenInputLike }): UGenInput;
}
export class QuadN {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; c?: UGenInputLike; xi?: UGenInputLike }): UGenInput;
}
export class StandardL {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; k?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike }): UGenInput;
}
export class StandardN {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; k?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike }): UGenInput;
}
export class Amplitude {
    private constructor();
    static ar(args?: { in?: UGenInputLike; attackTime?: UGenInputLike; releaseTime?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; attackTime?: UGenInputLike; releaseTime?: UGenInputLike }): UGenInput;
}
export class Compander {
    private constructor();
    static ar(args?: { in?: UGenInputLike; control?: UGenInputLike; thresh?: UGenInputLike; slopeBelow?: UGenInputLike; slopeAbove?: UGenInputLike; clampTime?: UGenInputLike; relaxTime?: UGenInputLike }): UGenInput;
}
export class Limiter {
    private constructor();
    static ar(args?: { in?: UGenInputLike; level?: UGenInputLike; dur?: UGenInputLike }): UGenInput;
}
export class Normalizer {
    private constructor();
    static ar(args?: { in?: UGenInputLike; level?: UGenInputLike; dur?: UGenInputLike }): UGenInput;
}
export class AllpassC {
    private constructor();
    static ar(args?: { in?: UGenInputLike; maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
}
export class AllpassL {
    private constructor();
    static ar(args?: { in?: UGenInputLike; maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
}
export class AllpassN {
    private constructor();
    static ar(args?: { in?: UGenInputLike; maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
}
export class BufAllpassC {
    private constructor();
    static ar(args?: { buf?: UGenInputLike; in?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
}
export class BufAllpassL {
    private constructor();
    static ar(args?: { buf?: UGenInputLike; in?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
}
export class BufAllpassN {
    private constructor();
    static ar(args?: { buf?: UGenInputLike; in?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
}
export class BufCombC {
    private constructor();
    static ar(args?: { buf?: UGenInputLike; in?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
}
export class BufCombL {
    private constructor();
    static ar(args?: { buf?: UGenInputLike; in?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
}
export class BufCombN {
    private constructor();
    static ar(args?: { buf?: UGenInputLike; in?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
}
export class BufDelayC {
    private constructor();
    static ar(args?: { buf?: UGenInputLike; in?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
    static kr(args?: { buf?: UGenInputLike; in?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
}
export class BufDelayL {
    private constructor();
    static ar(args?: { buf?: UGenInputLike; in?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
    static kr(args?: { buf?: UGenInputLike; in?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
}
export class BufDelayN {
    private constructor();
    static ar(args?: { buf?: UGenInputLike; in?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
    static kr(args?: { buf?: UGenInputLike; in?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
}
export class CombC {
    private constructor();
    static ar(args?: { in?: UGenInputLike; maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
}
export class CombL {
    private constructor();
    static ar(args?: { in?: UGenInputLike; maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
}
export class CombN {
    private constructor();
    static ar(args?: { in?: UGenInputLike; maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
}
export class DelTapRd {
    private constructor();
    static ar(args?: { buffer?: UGenInputLike; phase?: UGenInputLike; delay?: UGenInputLike; interp?: UGenInputLike }): UGenInput;
    static kr(args?: { buffer?: UGenInputLike; phase?: UGenInputLike; delay?: UGenInputLike; interp?: UGenInputLike }): UGenInput;
}
export class DelTapWr {
    private constructor();
    static ar(args?: { buffer?: UGenInputLike; in?: UGenInputLike }): UGenInput;
    static kr(args?: { buffer?: UGenInputLike; in?: UGenInputLike }): UGenInput;
}
export class Delay1 {
    private constructor();
    static ar(args?: { in?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike }): UGenInput;
}
export class Delay2 {
    private constructor();
    static ar(args?: { in?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike }): UGenInput;
}
export class DelayC {
    private constructor();
    static ar(args?: { in?: UGenInputLike; maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
}
export class DelayL {
    private constructor();
    static ar(args?: { in?: UGenInputLike; maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
}
export class DelayN {
    private constructor();
    static ar(args?: { in?: UGenInputLike; maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
}
export class Demand {
    private constructor();
    static ar(args?: { trig?: UGenInputLike; reset?: UGenInputLike; demandUgens?: UGenInputLike }): UGenInput;
    static kr(args?: { trig?: UGenInputLike; reset?: UGenInputLike; demandUgens?: UGenInputLike }): UGenInput;
}
export class DemandEnvGen {
    private constructor();
    static ar(args?: { level?: UGenInputLike; dur?: UGenInputLike; shape?: UGenInputLike; curve?: UGenInputLike; gate?: UGenInputLike; reset?: UGenInputLike; levelScale?: UGenInputLike; levelBias?: UGenInputLike; timeScale?: UGenInputLike; action?: UGenInputLike }): UGenInput;
    static kr(args?: { level?: UGenInputLike; dur?: UGenInputLike; shape?: UGenInputLike; curve?: UGenInputLike; gate?: UGenInputLike; reset?: UGenInputLike; levelScale?: UGenInputLike; levelBias?: UGenInputLike; timeScale?: UGenInputLike; action?: UGenInputLike }): UGenInput;
}
export class Duty {
    private constructor();
    static ar(args?: { dur?: UGenInputLike; reset?: UGenInputLike; action?: UGenInputLike; level?: UGenInputLike }): UGenInput;
    static kr(args?: { dur?: UGenInputLike; reset?: UGenInputLike; action?: UGenInputLike; level?: UGenInputLike }): UGenInput;
}
export class TDuty {
    private constructor();
    static ar(args?: { dur?: UGenInputLike; reset?: UGenInputLike; action?: UGenInputLike; level?: UGenInputLike; gapFirst?: UGenInputLike }): UGenInput;
    static kr(args?: { dur?: UGenInputLike; reset?: UGenInputLike; action?: UGenInputLike; level?: UGenInputLike; gapFirst?: UGenInputLike }): UGenInput;
}
export class Done {
    private constructor();
    static kr(args?: { src?: UGenInputLike }): UGenInput;
}
export class EnvGen {
    private constructor();
    static ar(args?: { envelope?: UGenInputLike; gate?: UGenInputLike; levelScale?: UGenInputLike; levelBias?: UGenInputLike; timeScale?: UGenInputLike; action?: UGenInputLike }): UGenInput;
    static kr(args?: { envelope?: UGenInputLike; gate?: UGenInputLike; levelScale?: UGenInputLike; levelBias?: UGenInputLike; timeScale?: UGenInputLike; action?: UGenInputLike }): UGenInput;
}
export class Free {
    private constructor();
    static kr(args?: { trig?: UGenInputLike; id?: UGenInputLike }): UGenInput;
}
export class FreeSelf {
    private constructor();
    static kr(args?: { in?: UGenInputLike }): UGenInput;
}
export class FreeSelfWhenDone {
    private constructor();
    static kr(args?: { src?: UGenInputLike }): UGenInput;
}
export class IEnvGen {
    private constructor();
    static ar(args?: { ienvelope?: UGenInputLike; index?: UGenInputLike }): UGenInput;
    static kr(args?: { ienvelope?: UGenInputLike; index?: UGenInputLike }): UGenInput;
}
export class Linen {
    private constructor();
    static kr(args?: { gate?: UGenInputLike; attackTime?: UGenInputLike; susLevel?: UGenInputLike; releaseTime?: UGenInputLike; action?: UGenInputLike }): UGenInput;
}
export class Pause {
    private constructor();
    static kr(args?: { gate?: UGenInputLike; id?: UGenInputLike }): UGenInput;
}
export class PauseSelf {
    private constructor();
    static kr(args?: { in?: UGenInputLike }): UGenInput;
}
export class PauseSelfWhenDone {
    private constructor();
    static kr(args?: { src?: UGenInputLike }): UGenInput;
}
export class Blip {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; numharm?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike; numharm?: UGenInputLike }): UGenInput;
}
export class FSinOsc {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
}
export class Klang {
    private constructor();
    static ar(args?: { specs?: UGenInputLike; freqscale?: UGenInputLike; freqoffset?: UGenInputLike }): UGenInput;
}
export class Klank {
    private constructor();
    static ar(args?: { specs?: UGenInputLike; input?: UGenInputLike; freqscale?: UGenInputLike; freqoffset?: UGenInputLike; decayscale?: UGenInputLike }): UGenInput;
}
export class PSinGrain {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; dur?: UGenInputLike; amp?: UGenInputLike }): UGenInput;
}
export class Pulse {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; width?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike; width?: UGenInputLike }): UGenInput;
}
export class Saw {
    private constructor();
    static ar(args?: { freq?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike }): UGenInput;
}
export class FFT {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike; in?: UGenInputLike; hop?: UGenInputLike; wintype?: UGenInputLike; active?: UGenInputLike; winsize?: UGenInputLike }): UGenInput;
}
export class FFTTrigger {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike; hop?: UGenInputLike; polar?: UGenInputLike }): UGenInput;
}
export class IFFT {
    private constructor();
    static ar(args?: { chain?: UGenInputLike; wintype?: UGenInputLike; winsize?: UGenInputLike }): UGenInput;
    static kr(args?: { chain?: UGenInputLike; wintype?: UGenInputLike; winsize?: UGenInputLike }): UGenInput;
}
export class PV_Add {
    private constructor();
    static kr(args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike }): UGenInput;
}
export class PV_BinScramble {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike; wipe?: UGenInputLike; width?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
}
export class PV_BinShift {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike; stretch?: UGenInputLike; shift?: UGenInputLike }): UGenInput;
}
export class PV_BinWipe {
    private constructor();
    static kr(args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike; wipe?: UGenInputLike }): UGenInput;
}
export class PV_BrickWall {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike; wipe?: UGenInputLike }): UGenInput;
}
export class PV_Conj {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike }): UGenInput;
}
export class PV_Copy {
    private constructor();
    static kr(args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike }): UGenInput;
}
export class PV_CopyPhase {
    private constructor();
    static kr(args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike }): UGenInput;
}
export class PV_Diffuser {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
}
export class PV_Div {
    private constructor();
    static kr(args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike }): UGenInput;
}
export class PV_LocalMax {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike; threshold?: UGenInputLike }): UGenInput;
}
export class PV_MagAbove {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike; threshold?: UGenInputLike }): UGenInput;
}
export class PV_MagBelow {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike; threshold?: UGenInputLike }): UGenInput;
}
export class PV_MagClip {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike; threshold?: UGenInputLike }): UGenInput;
}
export class PV_MagDiv {
    private constructor();
    static kr(args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike; zeroed?: UGenInputLike }): UGenInput;
}
export class PV_MagFreeze {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike; freeze?: UGenInputLike }): UGenInput;
}
export class PV_MagMul {
    private constructor();
    static kr(args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike }): UGenInput;
}
export class PV_MagNoise {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike }): UGenInput;
}
export class PV_MagShift {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike; stretch?: UGenInputLike; shift?: UGenInputLike }): UGenInput;
}
export class PV_MagSmear {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike; bins?: UGenInputLike }): UGenInput;
}
export class PV_MagSquared {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike }): UGenInput;
}
export class PV_Max {
    private constructor();
    static kr(args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike }): UGenInput;
}
export class PV_Min {
    private constructor();
    static kr(args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike }): UGenInput;
}
export class PV_Mul {
    private constructor();
    static kr(args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike }): UGenInput;
}
export class PV_PhaseShift {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike; shift?: UGenInputLike }): UGenInput;
}
export class PV_PhaseShift270 {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike }): UGenInput;
}
export class PV_PhaseShift90 {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike }): UGenInput;
}
export class PV_RandComb {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike; wipe?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
}
export class PV_RandWipe {
    private constructor();
    static kr(args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike; wipe?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
}
export class PV_RectComb {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike; numTeeth?: UGenInputLike; phase?: UGenInputLike; width?: UGenInputLike }): UGenInput;
}
export class PV_RectComb2 {
    private constructor();
    static kr(args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike; numTeeth?: UGenInputLike; phase?: UGenInputLike; width?: UGenInputLike }): UGenInput;
}
export class Convolution {
    private constructor();
    static ar(args?: { in?: UGenInputLike; kernel?: UGenInputLike; framesize?: UGenInputLike }): UGenInput;
}
export class Convolution2 {
    private constructor();
    static ar(args?: { in?: UGenInputLike; kernel?: UGenInputLike; trigger?: UGenInputLike; framesize?: UGenInputLike }): UGenInput;
}
export class Convolution2L {
    private constructor();
    static ar(args?: { in?: UGenInputLike; kernel?: UGenInputLike; trigger?: UGenInputLike; framesize?: UGenInputLike; crossfade?: UGenInputLike }): UGenInput;
}
export class Convolution3 {
    private constructor();
    static ar(args?: { in?: UGenInputLike; kernel?: UGenInputLike; trigger?: UGenInputLike; framesize?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; kernel?: UGenInputLike; trigger?: UGenInputLike; framesize?: UGenInputLike }): UGenInput;
}
export class PV_ConformalMap {
    private constructor();
    static kr(args?: { buffer?: UGenInputLike; areal?: UGenInputLike; aimag?: UGenInputLike }): UGenInput;
}
export class PV_HainsworthFoote {
    private constructor();
    static ar(args?: { buffer?: UGenInputLike; proph?: UGenInputLike; propf?: UGenInputLike; threshold?: UGenInputLike; waitTime?: UGenInputLike }): UGenInput;
}
export class PV_JensenAndersen {
    private constructor();
    static ar(args?: { buffer?: UGenInputLike; propsc?: UGenInputLike; prophfe?: UGenInputLike; prophfc?: UGenInputLike; propsf?: UGenInputLike; threshold?: UGenInputLike; waitTime?: UGenInputLike }): UGenInput;
}
export class RunningSum {
    private constructor();
    static ar(args?: { in?: UGenInputLike; numsamp?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; numsamp?: UGenInputLike }): UGenInput;
}
export class StereoConvolution2L {
    private constructor();
    static ar(args?: { in?: UGenInputLike; kernelL?: UGenInputLike; kernelR?: UGenInputLike; trigger?: UGenInputLike; framesize?: UGenInputLike; crossfade?: UGenInputLike }): UGenInput;
}
export class APF {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; radius?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; freq?: UGenInputLike; radius?: UGenInputLike }): UGenInput;
}
export class BPF {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
}
export class BPZ2 {
    private constructor();
    static ar(args?: { in?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike }): UGenInput;
}
export class BRF {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
}
export class BRZ2 {
    private constructor();
    static ar(args?: { in?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike }): UGenInput;
}
export class Decay {
    private constructor();
    static ar(args?: { in?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
}
export class Decay2 {
    private constructor();
    static ar(args?: { in?: UGenInputLike; attackTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; attackTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
}
export class DetectSilence {
    private constructor();
    static ar(args?: { in?: UGenInputLike; amp?: UGenInputLike; time?: UGenInputLike; action?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; amp?: UGenInputLike; time?: UGenInputLike; action?: UGenInputLike }): UGenInput;
}
export class FOS {
    private constructor();
    static ar(args?: { in?: UGenInputLike; a0?: UGenInputLike; a1?: UGenInputLike; b1?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; a0?: UGenInputLike; a1?: UGenInputLike; b1?: UGenInputLike }): UGenInput;
}
export class Formlet {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; attackTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; freq?: UGenInputLike; attackTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
}
export class HPF {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; freq?: UGenInputLike }): UGenInput;
}
export class HPZ1 {
    private constructor();
    static ar(args?: { in?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike }): UGenInput;
}
export class HPZ2 {
    private constructor();
    static ar(args?: { in?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike }): UGenInput;
}
export class Integrator {
    private constructor();
    static ar(args?: { in?: UGenInputLike; coef?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; coef?: UGenInputLike }): UGenInput;
}
export class LPF {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; freq?: UGenInputLike }): UGenInput;
}
export class LPZ1 {
    private constructor();
    static ar(args?: { in?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike }): UGenInput;
}
export class LPZ2 {
    private constructor();
    static ar(args?: { in?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike }): UGenInput;
}
export class Lag {
    private constructor();
    static ar(args?: { in?: UGenInputLike; lagTime?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; lagTime?: UGenInputLike }): UGenInput;
}
export class Lag2 {
    private constructor();
    static ar(args?: { in?: UGenInputLike; lagTime?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; lagTime?: UGenInputLike }): UGenInput;
}
export class Lag2UD {
    private constructor();
    static ar(args?: { in?: UGenInputLike; lagTimeUp?: UGenInputLike; lagTimeDown?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; lagTimeUp?: UGenInputLike; lagTimeDown?: UGenInputLike }): UGenInput;
}
export class Lag3 {
    private constructor();
    static ar(args?: { in?: UGenInputLike; lagTime?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; lagTime?: UGenInputLike }): UGenInput;
}
export class Lag3UD {
    private constructor();
    static ar(args?: { in?: UGenInputLike; lagTimeUp?: UGenInputLike; lagTimeDown?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; lagTimeUp?: UGenInputLike; lagTimeDown?: UGenInputLike }): UGenInput;
}
export class LagUD {
    private constructor();
    static ar(args?: { in?: UGenInputLike; lagTimeUp?: UGenInputLike; lagTimeDown?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; lagTimeUp?: UGenInputLike; lagTimeDown?: UGenInputLike }): UGenInput;
}
export class LeakDC {
    private constructor();
    static ar(args?: { in?: UGenInputLike; coef?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; coef?: UGenInputLike }): UGenInput;
}
export class Median {
    private constructor();
    static ar(args?: { length?: UGenInputLike; in?: UGenInputLike }): UGenInput;
    static kr(args?: { length?: UGenInputLike; in?: UGenInputLike }): UGenInput;
}
export class MidEQ {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; rq?: UGenInputLike; db?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; freq?: UGenInputLike; rq?: UGenInputLike; db?: UGenInputLike }): UGenInput;
}
export class OnePole {
    private constructor();
    static ar(args?: { in?: UGenInputLike; coef?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; coef?: UGenInputLike }): UGenInput;
}
export class OneZero {
    private constructor();
    static ar(args?: { in?: UGenInputLike; coef?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; coef?: UGenInputLike }): UGenInput;
}
export class RHPF {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
}
export class RLPF {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
}
export class Ramp {
    private constructor();
    static ar(args?: { in?: UGenInputLike; lagTime?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; lagTime?: UGenInputLike }): UGenInput;
}
export class Resonz {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; bwr?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; freq?: UGenInputLike; bwr?: UGenInputLike }): UGenInput;
}
export class Ringz {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; freq?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
}
export class SOS {
    private constructor();
    static ar(args?: { in?: UGenInputLike; a0?: UGenInputLike; a1?: UGenInputLike; a2?: UGenInputLike; b1?: UGenInputLike; b2?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; a0?: UGenInputLike; a1?: UGenInputLike; a2?: UGenInputLike; b1?: UGenInputLike; b2?: UGenInputLike }): UGenInput;
}
export class Slew {
    private constructor();
    static ar(args?: { in?: UGenInputLike; up?: UGenInputLike; dn?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; up?: UGenInputLike; dn?: UGenInputLike }): UGenInput;
}
export class Slope {
    private constructor();
    static ar(args?: { in?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike }): UGenInput;
}
export class TwoPole {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; radius?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; freq?: UGenInputLike; radius?: UGenInputLike }): UGenInput;
}
export class TwoZero {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; radius?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; freq?: UGenInputLike; radius?: UGenInputLike }): UGenInput;
}
export class GrainBuf {
    private constructor();
    static ar(args?: { numChannels?: number; trigger?: UGenInputLike; dur?: UGenInputLike; sndbuf?: UGenInputLike; rate?: UGenInputLike; pos?: UGenInputLike; interp?: UGenInputLike; pan?: UGenInputLike; envbufnum?: UGenInputLike; maxGrains?: UGenInputLike }): UGenInput;
}
export class GrainFM {
    private constructor();
    static ar(args?: { numChannels?: number; trigger?: UGenInputLike; dur?: UGenInputLike; carFreq?: UGenInputLike; modFreq?: UGenInputLike; index?: UGenInputLike; pan?: UGenInputLike; envbufnum?: UGenInputLike; maxGrains?: UGenInputLike }): UGenInput;
}
export class GrainIn {
    private constructor();
    static ar(args?: { numChannels?: number; trigger?: UGenInputLike; dur?: UGenInputLike; in?: UGenInputLike; pan?: UGenInputLike; envbufnum?: UGenInputLike; maxGrains?: UGenInputLike }): UGenInput;
}
export class GrainSin {
    private constructor();
    static ar(args?: { numChannels?: number; trigger?: UGenInputLike; dur?: UGenInputLike; freq?: UGenInputLike; pan?: UGenInputLike; envbufnum?: UGenInputLike; maxGrains?: UGenInputLike }): UGenInput;
}
export class Warp1 {
    private constructor();
    static ar(args?: { numChannels?: number; bufnum?: UGenInputLike; pointer?: UGenInputLike; freqScale?: UGenInputLike; windowSize?: UGenInputLike; envbufnum?: UGenInputLike; overlaps?: UGenInputLike; windowRandRatio?: UGenInputLike; interp?: UGenInputLike }): UGenInput;
}
export class BufChannels {
    private constructor();
    static kr(args?: { buf?: UGenInputLike }): UGenInput;
    static ir(args?: { buf?: UGenInputLike }): UGenInput;
}
export class BufDur {
    private constructor();
    static kr(args?: { buf?: UGenInputLike }): UGenInput;
    static ir(args?: { buf?: UGenInputLike }): UGenInput;
}
export class BufFrames {
    private constructor();
    static kr(args?: { buf?: UGenInputLike }): UGenInput;
    static ir(args?: { buf?: UGenInputLike }): UGenInput;
}
export class BufRateScale {
    private constructor();
    static kr(args?: { buf?: UGenInputLike }): UGenInput;
    static ir(args?: { buf?: UGenInputLike }): UGenInput;
}
export class BufSampleRate {
    private constructor();
    static kr(args?: { buf?: UGenInputLike }): UGenInput;
    static ir(args?: { buf?: UGenInputLike }): UGenInput;
}
export class BufSamples {
    private constructor();
    static kr(args?: { buf?: UGenInputLike }): UGenInput;
    static ir(args?: { buf?: UGenInputLike }): UGenInput;
}
export class CheckBadValues {
    private constructor();
    static ar(args?: { in?: UGenInputLike; id?: UGenInputLike; post?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; id?: UGenInputLike; post?: UGenInputLike }): UGenInput;
}
export class ControlDur {
    private constructor();
    static ir(args?: Record<string, never>): UGenInput;
}
export class ControlRate {
    private constructor();
    static ir(args?: Record<string, never>): UGenInput;
}
export class NumAudioBuses {
    private constructor();
    static ir(args?: Record<string, never>): UGenInput;
}
export class NumBuffers {
    private constructor();
    static ir(args?: Record<string, never>): UGenInput;
}
export class NumControlBuses {
    private constructor();
    static ir(args?: Record<string, never>): UGenInput;
}
export class NumInputBuses {
    private constructor();
    static ir(args?: Record<string, never>): UGenInput;
}
export class NumOutputBuses {
    private constructor();
    static ir(args?: Record<string, never>): UGenInput;
}
export class NumRunningSynths {
    private constructor();
    static kr(args?: Record<string, never>): UGenInput;
    static ir(args?: Record<string, never>): UGenInput;
}
export class Poll {
    private constructor();
    static ar(args?: { trig?: UGenInputLike; in?: UGenInputLike; label?: UGenInputLike; trigId?: UGenInputLike }): UGenInput;
    static kr(args?: { trig?: UGenInputLike; in?: UGenInputLike; label?: UGenInputLike; trigId?: UGenInputLike }): UGenInput;
}
export class RadiansPerSample {
    private constructor();
    static ir(args?: Record<string, never>): UGenInput;
}
export class SampleDur {
    private constructor();
    static ir(args?: Record<string, never>): UGenInput;
}
export class SampleRate {
    private constructor();
    static ir(args?: Record<string, never>): UGenInput;
}
export class SubsampleOffset {
    private constructor();
    static ir(args?: Record<string, never>): UGenInput;
}
export class KeyState {
    private constructor();
    static kr(args?: { keycode?: UGenInputLike; minval?: UGenInputLike; maxval?: UGenInputLike; lag?: UGenInputLike }): UGenInput;
}
export class MouseButton {
    private constructor();
    static kr(args?: { up?: UGenInputLike; down?: UGenInputLike; lag?: UGenInputLike }): UGenInput;
}
export class MouseX {
    private constructor();
    static kr(args?: { min?: UGenInputLike; max?: UGenInputLike; warp?: UGenInputLike; lag?: UGenInputLike }): UGenInput;
}
export class MouseY {
    private constructor();
    static kr(args?: { min?: UGenInputLike; max?: UGenInputLike; warp?: UGenInputLike; lag?: UGenInputLike }): UGenInput;
}
export class DiskIn {
    private constructor();
    static ar(args?: { numChannels?: number; bufnum?: UGenInputLike; loop?: UGenInputLike }): UGenInput;
}
export class DiskOut {
    private constructor();
    static ar(args?: { bufnum?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
}
export class In {
    private constructor();
    static ar(args?: { bus?: UGenInputLike; numChannels?: number }): UGenInput;
    static kr(args?: { bus?: UGenInputLike; numChannels?: number }): UGenInput;
}
export class InFeedback {
    private constructor();
    static ar(args?: { bus?: UGenInputLike; numChannels?: number }): UGenInput;
}
export class InTrig {
    private constructor();
    static kr(args?: { bus?: UGenInputLike; numChannels?: number }): UGenInput;
}
export class LagIn {
    private constructor();
    static kr(args?: { bus?: UGenInputLike; numChannels?: number; lag?: UGenInputLike }): UGenInput;
}
export class LocalIn {
    private constructor();
    static ar(args?: { numChannels?: number }): UGenInput;
    static kr(args?: { numChannels?: number }): UGenInput;
}
export class LocalOut {
    private constructor();
    static ar(args?: { channelsArray?: UGenInputLike[] }): UGenInput;
    static kr(args?: { channelsArray?: UGenInputLike[] }): UGenInput;
}
export class OffsetOut {
    private constructor();
    static ar(args?: { bus?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
    static kr(args?: { bus?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
}
export class Out {
    private constructor();
    static ar(args?: { bus?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
    static kr(args?: { bus?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
}
export class ReplaceOut {
    private constructor();
    static ar(args?: { bus?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
    static kr(args?: { bus?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
}
export class SharedIn {
    private constructor();
    static kr(args?: { bus?: UGenInputLike; numChannels?: number }): UGenInput;
}
export class SharedOut {
    private constructor();
    static kr(args?: { bus?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
}
export class VDiskIn {
    private constructor();
    static ar(args?: { numChannels?: number; bufnum?: UGenInputLike; rate?: UGenInputLike; loop?: UGenInputLike; sendId?: UGenInputLike }): UGenInput;
}
export class XOut {
    private constructor();
    static ar(args?: { bus?: UGenInputLike; xfade?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
    static kr(args?: { bus?: UGenInputLike; xfade?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
}
export class A2K {
    private constructor();
    static kr(args?: { in?: UGenInputLike }): UGenInput;
}
export class AmpComp {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; root?: UGenInputLike; exp?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike; root?: UGenInputLike; exp?: UGenInputLike }): UGenInput;
    static ir(args?: { freq?: UGenInputLike; root?: UGenInputLike; exp?: UGenInputLike }): UGenInput;
}
export class AmpCompA {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; root?: UGenInputLike; minAmp?: UGenInputLike; rootAmp?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike; root?: UGenInputLike; minAmp?: UGenInputLike; rootAmp?: UGenInputLike }): UGenInput;
    static ir(args?: { freq?: UGenInputLike; root?: UGenInputLike; minAmp?: UGenInputLike; rootAmp?: UGenInputLike }): UGenInput;
}
export class DC {
    private constructor();
    static ar(args?: { in?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike }): UGenInput;
}
export class K2A {
    private constructor();
    static ar(args?: { in?: UGenInputLike }): UGenInput;
}
export class LinExp {
    private constructor();
    static ar(args?: { in?: UGenInputLike; srclo?: UGenInputLike; srchi?: UGenInputLike; dstlo?: UGenInputLike; dsthi?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; srclo?: UGenInputLike; srchi?: UGenInputLike; dstlo?: UGenInputLike; dsthi?: UGenInputLike }): UGenInput;
}
export class Line {
    private constructor();
    static ar(args?: { start?: UGenInputLike; end?: UGenInputLike; dur?: UGenInputLike; action?: UGenInputLike }): UGenInput;
    static kr(args?: { start?: UGenInputLike; end?: UGenInputLike; dur?: UGenInputLike; action?: UGenInputLike }): UGenInput;
}
export class Silent {
    private constructor();
    static ar(args?: { numChannels?: number }): UGenInput;
}
export class T2A {
    private constructor();
    static ar(args?: { in?: UGenInputLike; offset?: UGenInputLike }): UGenInput;
}
export class T2K {
    private constructor();
    static kr(args?: { in?: UGenInputLike }): UGenInput;
}
export class XLine {
    private constructor();
    static ar(args?: { start?: UGenInputLike; end?: UGenInputLike; dur?: UGenInputLike; action?: UGenInputLike }): UGenInput;
    static kr(args?: { start?: UGenInputLike; end?: UGenInputLike; dur?: UGenInputLike; action?: UGenInputLike }): UGenInput;
}
export class BeatTrack {
    private constructor();
    static kr(args?: { chain?: UGenInputLike; lock?: UGenInputLike }): UGenInput;
}
export class BeatTrack2 {
    private constructor();
    static kr(args?: { busindex?: UGenInputLike; numfeatures?: UGenInputLike; windowsize?: UGenInputLike; phaseaccuracy?: UGenInputLike; lock?: UGenInputLike; weightingscheme?: UGenInputLike }): UGenInput;
}
export class KeyTrack {
    private constructor();
    static kr(args?: { chain?: UGenInputLike; keydecay?: UGenInputLike; chromaleak?: UGenInputLike }): UGenInput;
}
export class Loudness {
    private constructor();
    static kr(args?: { chain?: UGenInputLike; smask?: UGenInputLike; tmask?: UGenInputLike }): UGenInput;
}
export class MFCC {
    private constructor();
    static kr(args?: { chain?: UGenInputLike; numcoeff?: UGenInputLike }): UGenInput;
}
export class Onsets {
    private constructor();
    static kr(args?: { chain?: UGenInputLike; threshold?: UGenInputLike; odftype?: UGenInputLike; relaxtime?: UGenInputLike; floor?: UGenInputLike; mingap?: UGenInputLike; medianspan?: UGenInputLike; whtype?: UGenInputLike; rawodf?: UGenInputLike }): UGenInput;
}
export class SpecCentroid {
    private constructor();
    static kr(args?: { chain?: UGenInputLike }): UGenInput;
}
export class SpecFlatness {
    private constructor();
    static kr(args?: { chain?: UGenInputLike }): UGenInput;
}
export class SpecPcile {
    private constructor();
    static kr(args?: { chain?: UGenInputLike; fraction?: UGenInputLike; interpolate?: UGenInputLike }): UGenInput;
}
export class Ball {
    private constructor();
    static ar(args?: { in?: UGenInputLike; g?: UGenInputLike; damp?: UGenInputLike; friction?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; g?: UGenInputLike; damp?: UGenInputLike; friction?: UGenInputLike }): UGenInput;
}
export class FreeVerb {
    private constructor();
    static ar(args?: { in?: UGenInputLike; mix?: UGenInputLike; room?: UGenInputLike; damp?: UGenInputLike }): UGenInput;
}
export class FreeVerb2 {
    private constructor();
    static ar(args?: { in?: UGenInputLike; in2?: UGenInputLike; mix?: UGenInputLike; room?: UGenInputLike; damp?: UGenInputLike }): UGenInput;
}
export class FreqShift {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; phase?: UGenInputLike }): UGenInput;
}
export class GVerb {
    private constructor();
    static ar(args?: { in?: UGenInputLike; roomsize?: UGenInputLike; revtime?: UGenInputLike; damping?: UGenInputLike; inputbw?: UGenInputLike; spread?: UGenInputLike; drylevel?: UGenInputLike; earlyreflevel?: UGenInputLike; taillevel?: UGenInputLike; maxroomsize?: UGenInputLike }): UGenInput;
}
export class Gendy1 {
    private constructor();
    static ar(args?: { ampdist?: UGenInputLike; durdist?: UGenInputLike; adparam?: UGenInputLike; ddparam?: UGenInputLike; minfreq?: UGenInputLike; maxfreq?: UGenInputLike; ampscale?: UGenInputLike; durscale?: UGenInputLike; initCps?: UGenInputLike; knum?: UGenInputLike }): UGenInput;
    static kr(args?: { ampdist?: UGenInputLike; durdist?: UGenInputLike; adparam?: UGenInputLike; ddparam?: UGenInputLike; minfreq?: UGenInputLike; maxfreq?: UGenInputLike; ampscale?: UGenInputLike; durscale?: UGenInputLike; initCps?: UGenInputLike; knum?: UGenInputLike }): UGenInput;
}
export class Gendy2 {
    private constructor();
    static ar(args?: { ampdist?: UGenInputLike; durdist?: UGenInputLike; adparam?: UGenInputLike; ddparam?: UGenInputLike; minfreq?: UGenInputLike; maxfreq?: UGenInputLike; ampscale?: UGenInputLike; durscale?: UGenInputLike; initCps?: UGenInputLike; knum?: UGenInputLike; a?: UGenInputLike; c?: UGenInputLike }): UGenInput;
    static kr(args?: { ampdist?: UGenInputLike; durdist?: UGenInputLike; adparam?: UGenInputLike; ddparam?: UGenInputLike; minfreq?: UGenInputLike; maxfreq?: UGenInputLike; ampscale?: UGenInputLike; durscale?: UGenInputLike; initCps?: UGenInputLike; knum?: UGenInputLike; a?: UGenInputLike; c?: UGenInputLike }): UGenInput;
}
export class Gendy3 {
    private constructor();
    static ar(args?: { ampdist?: UGenInputLike; durdist?: UGenInputLike; adparam?: UGenInputLike; ddparam?: UGenInputLike; freq?: UGenInputLike; ampscale?: UGenInputLike; durscale?: UGenInputLike; initCps?: UGenInputLike; knum?: UGenInputLike }): UGenInput;
    static kr(args?: { ampdist?: UGenInputLike; durdist?: UGenInputLike; adparam?: UGenInputLike; ddparam?: UGenInputLike; freq?: UGenInputLike; ampscale?: UGenInputLike; durscale?: UGenInputLike; initCps?: UGenInputLike; knum?: UGenInputLike }): UGenInput;
}
export class Hilbert {
    private constructor();
    static ar(args?: { in?: UGenInputLike }): UGenInput;
}
export class MoogFF {
    private constructor();
    static ar(args?: { in?: UGenInputLike; freq?: UGenInputLike; gain?: UGenInputLike; reset?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; freq?: UGenInputLike; gain?: UGenInputLike; reset?: UGenInputLike }): UGenInput;
}
export class PartConv {
    private constructor();
    static ar(args?: { in?: UGenInputLike; fftsize?: UGenInputLike; irbufnum?: UGenInputLike }): UGenInput;
}
export class PitchShift {
    private constructor();
    static ar(args?: { in?: UGenInputLike; windowSize?: UGenInputLike; pitchRatio?: UGenInputLike; pitchDispersion?: UGenInputLike; timeDispersion?: UGenInputLike }): UGenInput;
}
export class Pluck {
    private constructor();
    static ar(args?: { in?: UGenInputLike; trig?: UGenInputLike; maxdelaytime?: UGenInputLike; delaytime?: UGenInputLike; decaytime?: UGenInputLike; coef?: UGenInputLike }): UGenInput;
}
export class Spring {
    private constructor();
    static ar(args?: { in?: UGenInputLike; spring?: UGenInputLike; damp?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; spring?: UGenInputLike; damp?: UGenInputLike }): UGenInput;
}
export class TBall {
    private constructor();
    static ar(args?: { in?: UGenInputLike; g?: UGenInputLike; damp?: UGenInputLike; friction?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; g?: UGenInputLike; damp?: UGenInputLike; friction?: UGenInputLike }): UGenInput;
}
export class BrownNoise {
    private constructor();
    static ar(args?: Record<string, never>): UGenInput;
    static kr(args?: Record<string, never>): UGenInput;
}
export class ClipNoise {
    private constructor();
    static ar(args?: Record<string, never>): UGenInput;
    static kr(args?: Record<string, never>): UGenInput;
}
export class Crackle {
    private constructor();
    static ar(args?: { chaosParam?: UGenInputLike }): UGenInput;
    static kr(args?: { chaosParam?: UGenInputLike }): UGenInput;
}
export class Dust {
    private constructor();
    static ar(args?: { density?: UGenInputLike }): UGenInput;
    static kr(args?: { density?: UGenInputLike }): UGenInput;
}
export class Dust2 {
    private constructor();
    static ar(args?: { density?: UGenInputLike }): UGenInput;
    static kr(args?: { density?: UGenInputLike }): UGenInput;
}
export class GrayNoise {
    private constructor();
    static ar(args?: Record<string, never>): UGenInput;
    static kr(args?: Record<string, never>): UGenInput;
}
export class Hasher {
    private constructor();
    static ar(args?: { in?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike }): UGenInput;
}
export class LFClipNoise {
    private constructor();
    static ar(args?: { freq?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike }): UGenInput;
}
export class LFDClipNoise {
    private constructor();
    static ar(args?: { freq?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike }): UGenInput;
}
export class LFDNoise0 {
    private constructor();
    static ar(args?: { freq?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike }): UGenInput;
}
export class LFDNoise1 {
    private constructor();
    static ar(args?: { freq?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike }): UGenInput;
}
export class LFDNoise3 {
    private constructor();
    static ar(args?: { freq?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike }): UGenInput;
}
export class LFNoise0 {
    private constructor();
    static ar(args?: { freq?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike }): UGenInput;
}
export class LFNoise1 {
    private constructor();
    static ar(args?: { freq?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike }): UGenInput;
}
export class LFNoise2 {
    private constructor();
    static ar(args?: { freq?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike }): UGenInput;
}
export class Logistic {
    private constructor();
    static ar(args?: { chaosParam?: UGenInputLike; freq?: UGenInputLike; init?: UGenInputLike }): UGenInput;
    static kr(args?: { chaosParam?: UGenInputLike; freq?: UGenInputLike; init?: UGenInputLike }): UGenInput;
}
export class MantissaMask {
    private constructor();
    static ar(args?: { in?: UGenInputLike; bits?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; bits?: UGenInputLike }): UGenInput;
}
export class PinkNoise {
    private constructor();
    static ar(args?: Record<string, never>): UGenInput;
    static kr(args?: Record<string, never>): UGenInput;
}
export class WhiteNoise {
    private constructor();
    static ar(args?: Record<string, never>): UGenInput;
    static kr(args?: Record<string, never>): UGenInput;
}
export class COsc {
    private constructor();
    static ar(args?: { bufnum?: UGenInputLike; freq?: UGenInputLike; beats?: UGenInputLike }): UGenInput;
    static kr(args?: { bufnum?: UGenInputLike; freq?: UGenInputLike; beats?: UGenInputLike }): UGenInput;
}
export class DegreeToKey {
    private constructor();
    static ar(args?: { bufnum?: UGenInputLike; in?: UGenInputLike; octave?: UGenInputLike }): UGenInput;
    static kr(args?: { bufnum?: UGenInputLike; in?: UGenInputLike; octave?: UGenInputLike }): UGenInput;
}
export class DetectIndex {
    private constructor();
    static ar(args?: { bufnum?: UGenInputLike; in?: UGenInputLike }): UGenInput;
    static kr(args?: { bufnum?: UGenInputLike; in?: UGenInputLike }): UGenInput;
}
export class Formant {
    private constructor();
    static ar(args?: { fundfreq?: UGenInputLike; formfreq?: UGenInputLike; bwfreq?: UGenInputLike }): UGenInput;
}
export class Impulse {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; phase?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike; phase?: UGenInputLike }): UGenInput;
}
export class Index {
    private constructor();
    static ar(args?: { bufnum?: UGenInputLike; in?: UGenInputLike }): UGenInput;
    static kr(args?: { bufnum?: UGenInputLike; in?: UGenInputLike }): UGenInput;
}
export class IndexInBetween {
    private constructor();
    static ar(args?: { bufnum?: UGenInputLike; in?: UGenInputLike }): UGenInput;
    static kr(args?: { bufnum?: UGenInputLike; in?: UGenInputLike }): UGenInput;
}
export class LFCub {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
}
export class LFGauss {
    private constructor();
    static ar(args?: { duration?: UGenInputLike; width?: UGenInputLike; iphase?: UGenInputLike; loop?: UGenInputLike; action?: UGenInputLike }): UGenInput;
    static kr(args?: { duration?: UGenInputLike; width?: UGenInputLike; iphase?: UGenInputLike; loop?: UGenInputLike; action?: UGenInputLike }): UGenInput;
}
export class LFPar {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
}
export class LFPulse {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; iphase?: UGenInputLike; width?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike; iphase?: UGenInputLike; width?: UGenInputLike }): UGenInput;
}
export class LFSaw {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
}
export class LFTri {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
}
export class Osc {
    private constructor();
    static ar(args?: { buffer?: UGenInputLike; freq?: UGenInputLike; phase?: UGenInputLike }): UGenInput;
    static kr(args?: { buffer?: UGenInputLike; freq?: UGenInputLike; phase?: UGenInputLike }): UGenInput;
}
export class Select {
    private constructor();
    static ar(args?: { which?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
    static kr(args?: { which?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
}
export class Shaper {
    private constructor();
    static ar(args?: { bufnum?: UGenInputLike; in?: UGenInputLike }): UGenInput;
    static kr(args?: { bufnum?: UGenInputLike; in?: UGenInputLike }): UGenInput;
}
export class SinOsc {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; phase?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike; phase?: UGenInputLike }): UGenInput;
}
export class SinOscFB {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; feedback?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike; feedback?: UGenInputLike }): UGenInput;
}
export class SyncSaw {
    private constructor();
    static ar(args?: { syncFreq?: UGenInputLike; sawFreq?: UGenInputLike }): UGenInput;
    static kr(args?: { syncFreq?: UGenInputLike; sawFreq?: UGenInputLike }): UGenInput;
}
export class VOsc {
    private constructor();
    static ar(args?: { bufpos?: UGenInputLike; freq?: UGenInputLike; phase?: UGenInputLike }): UGenInput;
    static kr(args?: { bufpos?: UGenInputLike; freq?: UGenInputLike; phase?: UGenInputLike }): UGenInput;
}
export class VOsc3 {
    private constructor();
    static ar(args?: { bufpos?: UGenInputLike; freq1?: UGenInputLike; freq2?: UGenInputLike; freq3?: UGenInputLike }): UGenInput;
    static kr(args?: { bufpos?: UGenInputLike; freq1?: UGenInputLike; freq2?: UGenInputLike; freq3?: UGenInputLike }): UGenInput;
}
export class VarSaw {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; iphase?: UGenInputLike; width?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike; iphase?: UGenInputLike; width?: UGenInputLike }): UGenInput;
}
export class Vibrato {
    private constructor();
    static ar(args?: { freq?: UGenInputLike; rate?: UGenInputLike; depth?: UGenInputLike; delay?: UGenInputLike; onset?: UGenInputLike; rateVariation?: UGenInputLike; depthVariation?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
    static kr(args?: { freq?: UGenInputLike; rate?: UGenInputLike; depth?: UGenInputLike; delay?: UGenInputLike; onset?: UGenInputLike; rateVariation?: UGenInputLike; depthVariation?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
}
export class WrapIndex {
    private constructor();
    static ar(args?: { bufnum?: UGenInputLike; in?: UGenInputLike }): UGenInput;
    static kr(args?: { bufnum?: UGenInputLike; in?: UGenInputLike }): UGenInput;
}
export class Balance2 {
    private constructor();
    static ar(args?: { left?: UGenInputLike; right?: UGenInputLike; pos?: UGenInputLike; level?: UGenInputLike }): UGenInput;
    static kr(args?: { left?: UGenInputLike; right?: UGenInputLike; pos?: UGenInputLike; level?: UGenInputLike }): UGenInput;
}
export class BiPanB2 {
    private constructor();
    static ar(args?: { inA?: UGenInputLike; inB?: UGenInputLike; azimuth?: UGenInputLike; gain?: UGenInputLike }): UGenInput;
    static kr(args?: { inA?: UGenInputLike; inB?: UGenInputLike; azimuth?: UGenInputLike; gain?: UGenInputLike }): UGenInput;
}
export class DecodeB2 {
    private constructor();
    static ar(args?: { numChannels?: number; w?: UGenInputLike; x?: UGenInputLike; y?: UGenInputLike; orientation?: UGenInputLike }): UGenInput;
    static kr(args?: { numChannels?: number; w?: UGenInputLike; x?: UGenInputLike; y?: UGenInputLike; orientation?: UGenInputLike }): UGenInput;
}
export class LinPan2 {
    private constructor();
    static ar(args?: { in?: UGenInputLike; pos?: UGenInputLike; level?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; pos?: UGenInputLike; level?: UGenInputLike }): UGenInput;
}
export class LinXFade2 {
    private constructor();
    static ar(args?: { inA?: UGenInputLike; inB?: UGenInputLike; pan?: UGenInputLike; level?: UGenInputLike }): UGenInput;
    static kr(args?: { inA?: UGenInputLike; inB?: UGenInputLike; pan?: UGenInputLike; level?: UGenInputLike }): UGenInput;
}
export class Pan2 {
    private constructor();
    static ar(args?: { in?: UGenInputLike; pos?: UGenInputLike; level?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; pos?: UGenInputLike; level?: UGenInputLike }): UGenInput;
}
export class Pan4 {
    private constructor();
    static ar(args?: { in?: UGenInputLike; xpos?: UGenInputLike; ypos?: UGenInputLike; level?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; xpos?: UGenInputLike; ypos?: UGenInputLike; level?: UGenInputLike }): UGenInput;
}
export class PanAz {
    private constructor();
    static ar(args?: { numChannels?: number; in?: UGenInputLike; pos?: UGenInputLike; level?: UGenInputLike; width?: UGenInputLike; orientation?: UGenInputLike }): UGenInput;
    static kr(args?: { numChannels?: number; in?: UGenInputLike; pos?: UGenInputLike; level?: UGenInputLike; width?: UGenInputLike; orientation?: UGenInputLike }): UGenInput;
}
export class PanB {
    private constructor();
    static ar(args?: { in?: UGenInputLike; azimuth?: UGenInputLike; elevation?: UGenInputLike; gain?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; azimuth?: UGenInputLike; elevation?: UGenInputLike; gain?: UGenInputLike }): UGenInput;
}
export class PanB2 {
    private constructor();
    static ar(args?: { in?: UGenInputLike; azimuth?: UGenInputLike; gain?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; azimuth?: UGenInputLike; gain?: UGenInputLike }): UGenInput;
}
export class Rotate2 {
    private constructor();
    static ar(args?: { x?: UGenInputLike; y?: UGenInputLike; pos?: UGenInputLike }): UGenInput;
    static kr(args?: { x?: UGenInputLike; y?: UGenInputLike; pos?: UGenInputLike }): UGenInput;
}
export class XFade2 {
    private constructor();
    static ar(args?: { inA?: UGenInputLike; inB?: UGenInputLike; pan?: UGenInputLike; level?: UGenInputLike }): UGenInput;
    static kr(args?: { inA?: UGenInputLike; inB?: UGenInputLike; pan?: UGenInputLike; level?: UGenInputLike }): UGenInput;
}
export class CoinGate {
    private constructor();
    static ar(args?: { prob?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
    static kr(args?: { prob?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
}
export class ExpRand {
    private constructor();
    static ir(args?: { lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
}
export class IRand {
    private constructor();
    static ir(args?: { lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
}
export class LinRand {
    private constructor();
    static ir(args?: { lo?: UGenInputLike; hi?: UGenInputLike; minmax?: UGenInputLike }): UGenInput;
}
export class NRand {
    private constructor();
    static ir(args?: { lo?: UGenInputLike; hi?: UGenInputLike; n?: UGenInputLike }): UGenInput;
}
export class Rand {
    private constructor();
    static ir(args?: { lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
}
export class RandID {
    private constructor();
    static kr(args?: { seed?: UGenInputLike }): UGenInput;
    static ir(args?: { seed?: UGenInputLike }): UGenInput;
}
export class RandSeed {
    private constructor();
    static ar(args?: { trig?: UGenInputLike; seed?: UGenInputLike }): UGenInput;
    static kr(args?: { trig?: UGenInputLike; seed?: UGenInputLike }): UGenInput;
    static ir(args?: { trig?: UGenInputLike; seed?: UGenInputLike }): UGenInput;
}
export class TExpRand {
    private constructor();
    static ar(args?: { lo?: UGenInputLike; hi?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
    static kr(args?: { lo?: UGenInputLike; hi?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
}
export class TIRand {
    private constructor();
    static ar(args?: { lo?: UGenInputLike; hi?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
    static kr(args?: { lo?: UGenInputLike; hi?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
}
export class TRand {
    private constructor();
    static ar(args?: { lo?: UGenInputLike; hi?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
    static kr(args?: { lo?: UGenInputLike; hi?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
}
export class Clip {
    private constructor();
    static ar(args?: { in?: UGenInputLike; lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
}
export class Fold {
    private constructor();
    static ar(args?: { in?: UGenInputLike; lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
}
export class Gate {
    private constructor();
    static ar(args?: { in?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
}
export class InRange {
    private constructor();
    static ar(args?: { in?: UGenInputLike; lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
    static ir(args?: { in?: UGenInputLike; lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
}
export class InRect {
    private constructor();
    static ar(args?: { x?: UGenInputLike; y?: UGenInputLike; left?: UGenInputLike; top?: UGenInputLike; right?: UGenInputLike; bottom?: UGenInputLike }): UGenInput;
    static kr(args?: { x?: UGenInputLike; y?: UGenInputLike; left?: UGenInputLike; top?: UGenInputLike; right?: UGenInputLike; bottom?: UGenInputLike }): UGenInput;
}
export class LastValue {
    private constructor();
    static ar(args?: { in?: UGenInputLike; diff?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; diff?: UGenInputLike }): UGenInput;
}
export class Latch {
    private constructor();
    static ar(args?: { in?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
}
export class LeastChange {
    private constructor();
    static ar(args?: { a?: UGenInputLike; b?: UGenInputLike }): UGenInput;
    static kr(args?: { a?: UGenInputLike; b?: UGenInputLike }): UGenInput;
}
export class MostChange {
    private constructor();
    static ar(args?: { a?: UGenInputLike; b?: UGenInputLike }): UGenInput;
    static kr(args?: { a?: UGenInputLike; b?: UGenInputLike }): UGenInput;
}
export class Peak {
    private constructor();
    static ar(args?: { trig?: UGenInputLike; reset?: UGenInputLike }): UGenInput;
    static kr(args?: { trig?: UGenInputLike; reset?: UGenInputLike }): UGenInput;
}
export class PeakFollower {
    private constructor();
    static ar(args?: { in?: UGenInputLike; decay?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; decay?: UGenInputLike }): UGenInput;
}
export class Phasor {
    private constructor();
    static ar(args?: { trig?: UGenInputLike; rate?: UGenInputLike; start?: UGenInputLike; end?: UGenInputLike; resetPos?: UGenInputLike }): UGenInput;
    static kr(args?: { trig?: UGenInputLike; rate?: UGenInputLike; start?: UGenInputLike; end?: UGenInputLike; resetPos?: UGenInputLike }): UGenInput;
}
export class Pitch {
    private constructor();
    static kr(args?: { in?: UGenInputLike; initFreq?: UGenInputLike; minFreq?: UGenInputLike; maxFreq?: UGenInputLike; execFreq?: UGenInputLike; maxBinsPerOctave?: UGenInputLike; median?: UGenInputLike; ampThreshold?: UGenInputLike; peakThreshold?: UGenInputLike; downSample?: UGenInputLike; clar?: UGenInputLike }): UGenInput;
}
export class PulseCount {
    private constructor();
    static ar(args?: { trig?: UGenInputLike; reset?: UGenInputLike }): UGenInput;
    static kr(args?: { trig?: UGenInputLike; reset?: UGenInputLike }): UGenInput;
}
export class PulseDivider {
    private constructor();
    static ar(args?: { trig?: UGenInputLike; div?: UGenInputLike; startVal?: UGenInputLike }): UGenInput;
    static kr(args?: { trig?: UGenInputLike; div?: UGenInputLike; startVal?: UGenInputLike }): UGenInput;
}
export class RunningMax {
    private constructor();
    static ar(args?: { in?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
}
export class RunningMin {
    private constructor();
    static ar(args?: { in?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
}
export class Schmidt {
    private constructor();
    static ar(args?: { in?: UGenInputLike; lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
}
export class SendReply {
    private constructor();
    static ar(args?: { trig?: UGenInputLike; cmdName?: UGenInputLike; values?: UGenInputLike; replyId?: UGenInputLike }): UGenInput;
    static kr(args?: { trig?: UGenInputLike; cmdName?: UGenInputLike; values?: UGenInputLike; replyId?: UGenInputLike }): UGenInput;
}
export class SendTrig {
    private constructor();
    static ar(args?: { in?: UGenInputLike; id?: UGenInputLike; value?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; id?: UGenInputLike; value?: UGenInputLike }): UGenInput;
}
export class SetResetFF {
    private constructor();
    static ar(args?: { trig?: UGenInputLike; reset?: UGenInputLike }): UGenInput;
    static kr(args?: { trig?: UGenInputLike; reset?: UGenInputLike }): UGenInput;
}
export class Stepper {
    private constructor();
    static ar(args?: { trig?: UGenInputLike; reset?: UGenInputLike; min?: UGenInputLike; max?: UGenInputLike; step?: UGenInputLike; resetval?: UGenInputLike }): UGenInput;
    static kr(args?: { trig?: UGenInputLike; reset?: UGenInputLike; min?: UGenInputLike; max?: UGenInputLike; step?: UGenInputLike; resetval?: UGenInputLike }): UGenInput;
}
export class Sweep {
    private constructor();
    static ar(args?: { trig?: UGenInputLike; rate?: UGenInputLike }): UGenInput;
    static kr(args?: { trig?: UGenInputLike; rate?: UGenInputLike }): UGenInput;
}
export class TDelay {
    private constructor();
    static ar(args?: { trig?: UGenInputLike; dur?: UGenInputLike }): UGenInput;
    static kr(args?: { trig?: UGenInputLike; dur?: UGenInputLike }): UGenInput;
}
export class TWindex {
    private constructor();
    static ar(args?: { trig?: UGenInputLike; channelsArray?: UGenInputLike[]; normalize?: UGenInputLike }): UGenInput;
    static kr(args?: { trig?: UGenInputLike; channelsArray?: UGenInputLike[]; normalize?: UGenInputLike }): UGenInput;
}
export class Timer {
    private constructor();
    static ar(args?: { trig?: UGenInputLike }): UGenInput;
    static kr(args?: { trig?: UGenInputLike }): UGenInput;
}
export class ToggleFF {
    private constructor();
    static ar(args?: { trig?: UGenInputLike }): UGenInput;
    static kr(args?: { trig?: UGenInputLike }): UGenInput;
}
export class Trapezoid {
    private constructor();
    static ar(args?: { in?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; c?: UGenInputLike; d?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; c?: UGenInputLike; d?: UGenInputLike }): UGenInput;
}
export class Trig {
    private constructor();
    static ar(args?: { trig?: UGenInputLike; dur?: UGenInputLike }): UGenInput;
    static kr(args?: { trig?: UGenInputLike; dur?: UGenInputLike }): UGenInput;
}
export class Trig1 {
    private constructor();
    static ar(args?: { trig?: UGenInputLike; dur?: UGenInputLike }): UGenInput;
    static kr(args?: { trig?: UGenInputLike; dur?: UGenInputLike }): UGenInput;
}
export class Wrap {
    private constructor();
    static ar(args?: { in?: UGenInputLike; lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike; lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
}
export class ZeroCrossing {
    private constructor();
    static ar(args?: { in?: UGenInputLike }): UGenInput;
    static kr(args?: { in?: UGenInputLike }): UGenInput;
}



/**
 * `specialIndex` for a binary operator name (`+`, `min`, …); undefined
 * for unknown operators.
 */
export function binaryOpIndex(op: string): number | undefined;

/**
 * Build one envelope shape and flatten it to the EnvGen `Env.asArray` run.
 * `args` is a `{ name: number | UGenInput | (number | UGenInput)[] }`
 * object; `curve`/`releaseNode`/`loopNode` are the sclang keyword args.
 * Error messages match the TS package verbatim (the app pins them).
 */
export function buildEnvRun(shape: string, args: any, curve: any, release_node?: number | null, loop_node?: number | null): UGenInput[];

/**
 * Flatten a raw envelope spec (levels/times/curves/releaseNode/loopNode)
 * to the EnvGen run — the generic path `Env.new`-style callers use.
 */
export function encodeEnvRun(levels: (UGenInput | number)[], times: (UGenInput | number)[], curves: any, release_node?: number | null, loop_node?: number | null): UGenInput[];

/**
 * Parse SCgf v2 bytes into the structured JSON form.
 */
export function parseScgf(bytes: Uint8Array): any;

/**
 * `specialIndex` for a unary operator name (`neg`, `abs`, …).
 */
export function unaryOpIndex(op: string): number | undefined;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_a2k_free: (a: number, b: number) => void;
    readonly __wbg_allpassc_free: (a: number, b: number) => void;
    readonly __wbg_allpassl_free: (a: number, b: number) => void;
    readonly __wbg_allpassn_free: (a: number, b: number) => void;
    readonly __wbg_ampcomp_free: (a: number, b: number) => void;
    readonly __wbg_ampcompa_free: (a: number, b: number) => void;
    readonly __wbg_amplitude_free: (a: number, b: number) => void;
    readonly __wbg_apf_free: (a: number, b: number) => void;
    readonly __wbg_balance2_free: (a: number, b: number) => void;
    readonly __wbg_ball_free: (a: number, b: number) => void;
    readonly __wbg_ballpass_free: (a: number, b: number) => void;
    readonly __wbg_bbandpass_free: (a: number, b: number) => void;
    readonly __wbg_bbandstop_free: (a: number, b: number) => void;
    readonly __wbg_beattrack2_free: (a: number, b: number) => void;
    readonly __wbg_beattrack_free: (a: number, b: number) => void;
    readonly __wbg_bhipass_free: (a: number, b: number) => void;
    readonly __wbg_bhishelf_free: (a: number, b: number) => void;
    readonly __wbg_bipanb2_free: (a: number, b: number) => void;
    readonly __wbg_blip_free: (a: number, b: number) => void;
    readonly __wbg_blowpass_free: (a: number, b: number) => void;
    readonly __wbg_blowshelf_free: (a: number, b: number) => void;
    readonly __wbg_bpeakeq_free: (a: number, b: number) => void;
    readonly __wbg_bpf_free: (a: number, b: number) => void;
    readonly __wbg_bpz2_free: (a: number, b: number) => void;
    readonly __wbg_brf_free: (a: number, b: number) => void;
    readonly __wbg_brownnoise_free: (a: number, b: number) => void;
    readonly __wbg_brz2_free: (a: number, b: number) => void;
    readonly __wbg_bufallpassc_free: (a: number, b: number) => void;
    readonly __wbg_bufallpassl_free: (a: number, b: number) => void;
    readonly __wbg_bufallpassn_free: (a: number, b: number) => void;
    readonly __wbg_bufchannels_free: (a: number, b: number) => void;
    readonly __wbg_bufcombc_free: (a: number, b: number) => void;
    readonly __wbg_bufcombl_free: (a: number, b: number) => void;
    readonly __wbg_bufcombn_free: (a: number, b: number) => void;
    readonly __wbg_bufdelayc_free: (a: number, b: number) => void;
    readonly __wbg_bufdelayl_free: (a: number, b: number) => void;
    readonly __wbg_bufdelayn_free: (a: number, b: number) => void;
    readonly __wbg_bufdur_free: (a: number, b: number) => void;
    readonly __wbg_bufframes_free: (a: number, b: number) => void;
    readonly __wbg_bufratescale_free: (a: number, b: number) => void;
    readonly __wbg_bufrd_free: (a: number, b: number) => void;
    readonly __wbg_bufsamplerate_free: (a: number, b: number) => void;
    readonly __wbg_bufsamples_free: (a: number, b: number) => void;
    readonly __wbg_bufwr_free: (a: number, b: number) => void;
    readonly __wbg_checkbadvalues_free: (a: number, b: number) => void;
    readonly __wbg_clearbuf_free: (a: number, b: number) => void;
    readonly __wbg_clip_free: (a: number, b: number) => void;
    readonly __wbg_clipnoise_free: (a: number, b: number) => void;
    readonly __wbg_coingate_free: (a: number, b: number) => void;
    readonly __wbg_combc_free: (a: number, b: number) => void;
    readonly __wbg_combl_free: (a: number, b: number) => void;
    readonly __wbg_combn_free: (a: number, b: number) => void;
    readonly __wbg_compander_free: (a: number, b: number) => void;
    readonly __wbg_controldur_free: (a: number, b: number) => void;
    readonly __wbg_controlrate_free: (a: number, b: number) => void;
    readonly __wbg_convolution2_free: (a: number, b: number) => void;
    readonly __wbg_convolution2l_free: (a: number, b: number) => void;
    readonly __wbg_convolution3_free: (a: number, b: number) => void;
    readonly __wbg_convolution_free: (a: number, b: number) => void;
    readonly __wbg_cosc_free: (a: number, b: number) => void;
    readonly __wbg_crackle_free: (a: number, b: number) => void;
    readonly __wbg_cuspl_free: (a: number, b: number) => void;
    readonly __wbg_cuspn_free: (a: number, b: number) => void;
    readonly __wbg_dc_free: (a: number, b: number) => void;
    readonly __wbg_decay2_free: (a: number, b: number) => void;
    readonly __wbg_decay_free: (a: number, b: number) => void;
    readonly __wbg_decodeb2_free: (a: number, b: number) => void;
    readonly __wbg_degreetokey_free: (a: number, b: number) => void;
    readonly __wbg_delay1_free: (a: number, b: number) => void;
    readonly __wbg_delay2_free: (a: number, b: number) => void;
    readonly __wbg_delayc_free: (a: number, b: number) => void;
    readonly __wbg_delayl_free: (a: number, b: number) => void;
    readonly __wbg_delayn_free: (a: number, b: number) => void;
    readonly __wbg_deltaprd_free: (a: number, b: number) => void;
    readonly __wbg_deltapwr_free: (a: number, b: number) => void;
    readonly __wbg_demand_free: (a: number, b: number) => void;
    readonly __wbg_demandenvgen_free: (a: number, b: number) => void;
    readonly __wbg_detectindex_free: (a: number, b: number) => void;
    readonly __wbg_detectsilence_free: (a: number, b: number) => void;
    readonly __wbg_diskin_free: (a: number, b: number) => void;
    readonly __wbg_diskout_free: (a: number, b: number) => void;
    readonly __wbg_done_free: (a: number, b: number) => void;
    readonly __wbg_dust2_free: (a: number, b: number) => void;
    readonly __wbg_dust_free: (a: number, b: number) => void;
    readonly __wbg_duty_free: (a: number, b: number) => void;
    readonly __wbg_envgen_free: (a: number, b: number) => void;
    readonly __wbg_exprand_free: (a: number, b: number) => void;
    readonly __wbg_fbsinec_free: (a: number, b: number) => void;
    readonly __wbg_fbsinel_free: (a: number, b: number) => void;
    readonly __wbg_fbsinen_free: (a: number, b: number) => void;
    readonly __wbg_fft_free: (a: number, b: number) => void;
    readonly __wbg_ffttrigger_free: (a: number, b: number) => void;
    readonly __wbg_fold_free: (a: number, b: number) => void;
    readonly __wbg_formant_free: (a: number, b: number) => void;
    readonly __wbg_formlet_free: (a: number, b: number) => void;
    readonly __wbg_fos_free: (a: number, b: number) => void;
    readonly __wbg_free_free: (a: number, b: number) => void;
    readonly __wbg_freeself_free: (a: number, b: number) => void;
    readonly __wbg_freeselfwhendone_free: (a: number, b: number) => void;
    readonly __wbg_freeverb2_free: (a: number, b: number) => void;
    readonly __wbg_freeverb_free: (a: number, b: number) => void;
    readonly __wbg_freqshift_free: (a: number, b: number) => void;
    readonly __wbg_fsinosc_free: (a: number, b: number) => void;
    readonly __wbg_gate_free: (a: number, b: number) => void;
    readonly __wbg_gbmanl_free: (a: number, b: number) => void;
    readonly __wbg_gbmann_free: (a: number, b: number) => void;
    readonly __wbg_gendy1_free: (a: number, b: number) => void;
    readonly __wbg_gendy2_free: (a: number, b: number) => void;
    readonly __wbg_gendy3_free: (a: number, b: number) => void;
    readonly __wbg_grainbuf_free: (a: number, b: number) => void;
    readonly __wbg_grainfm_free: (a: number, b: number) => void;
    readonly __wbg_grainin_free: (a: number, b: number) => void;
    readonly __wbg_grainsin_free: (a: number, b: number) => void;
    readonly __wbg_graynoise_free: (a: number, b: number) => void;
    readonly __wbg_gverb_free: (a: number, b: number) => void;
    readonly __wbg_hasher_free: (a: number, b: number) => void;
    readonly __wbg_henonc_free: (a: number, b: number) => void;
    readonly __wbg_henonl_free: (a: number, b: number) => void;
    readonly __wbg_henonn_free: (a: number, b: number) => void;
    readonly __wbg_hilbert_free: (a: number, b: number) => void;
    readonly __wbg_hpf_free: (a: number, b: number) => void;
    readonly __wbg_hpz1_free: (a: number, b: number) => void;
    readonly __wbg_hpz2_free: (a: number, b: number) => void;
    readonly __wbg_ienvgen_free: (a: number, b: number) => void;
    readonly __wbg_ifft_free: (a: number, b: number) => void;
    readonly __wbg_impulse_free: (a: number, b: number) => void;
    readonly __wbg_in_free: (a: number, b: number) => void;
    readonly __wbg_index_free: (a: number, b: number) => void;
    readonly __wbg_indexinbetween_free: (a: number, b: number) => void;
    readonly __wbg_infeedback_free: (a: number, b: number) => void;
    readonly __wbg_inrange_free: (a: number, b: number) => void;
    readonly __wbg_inrect_free: (a: number, b: number) => void;
    readonly __wbg_integrator_free: (a: number, b: number) => void;
    readonly __wbg_intrig_free: (a: number, b: number) => void;
    readonly __wbg_irand_free: (a: number, b: number) => void;
    readonly __wbg_k2a_free: (a: number, b: number) => void;
    readonly __wbg_keystate_free: (a: number, b: number) => void;
    readonly __wbg_keytrack_free: (a: number, b: number) => void;
    readonly __wbg_klang_free: (a: number, b: number) => void;
    readonly __wbg_klank_free: (a: number, b: number) => void;
    readonly __wbg_lag2_free: (a: number, b: number) => void;
    readonly __wbg_lag2ud_free: (a: number, b: number) => void;
    readonly __wbg_lag3_free: (a: number, b: number) => void;
    readonly __wbg_lag3ud_free: (a: number, b: number) => void;
    readonly __wbg_lag_free: (a: number, b: number) => void;
    readonly __wbg_lagin_free: (a: number, b: number) => void;
    readonly __wbg_lagud_free: (a: number, b: number) => void;
    readonly __wbg_lastvalue_free: (a: number, b: number) => void;
    readonly __wbg_latch_free: (a: number, b: number) => void;
    readonly __wbg_latoocarfianc_free: (a: number, b: number) => void;
    readonly __wbg_latoocarfianl_free: (a: number, b: number) => void;
    readonly __wbg_latoocarfiann_free: (a: number, b: number) => void;
    readonly __wbg_leakdc_free: (a: number, b: number) => void;
    readonly __wbg_leastchange_free: (a: number, b: number) => void;
    readonly __wbg_lfclipnoise_free: (a: number, b: number) => void;
    readonly __wbg_lfcub_free: (a: number, b: number) => void;
    readonly __wbg_lfdclipnoise_free: (a: number, b: number) => void;
    readonly __wbg_lfdnoise0_free: (a: number, b: number) => void;
    readonly __wbg_lfdnoise1_free: (a: number, b: number) => void;
    readonly __wbg_lfdnoise3_free: (a: number, b: number) => void;
    readonly __wbg_lfgauss_free: (a: number, b: number) => void;
    readonly __wbg_lfnoise0_free: (a: number, b: number) => void;
    readonly __wbg_lfnoise1_free: (a: number, b: number) => void;
    readonly __wbg_lfnoise2_free: (a: number, b: number) => void;
    readonly __wbg_lfpar_free: (a: number, b: number) => void;
    readonly __wbg_lfpulse_free: (a: number, b: number) => void;
    readonly __wbg_lfsaw_free: (a: number, b: number) => void;
    readonly __wbg_lftri_free: (a: number, b: number) => void;
    readonly __wbg_limiter_free: (a: number, b: number) => void;
    readonly __wbg_lincongc_free: (a: number, b: number) => void;
    readonly __wbg_lincongl_free: (a: number, b: number) => void;
    readonly __wbg_lincongn_free: (a: number, b: number) => void;
    readonly __wbg_line_free: (a: number, b: number) => void;
    readonly __wbg_linen_free: (a: number, b: number) => void;
    readonly __wbg_linexp_free: (a: number, b: number) => void;
    readonly __wbg_linpan2_free: (a: number, b: number) => void;
    readonly __wbg_linrand_free: (a: number, b: number) => void;
    readonly __wbg_linxfade2_free: (a: number, b: number) => void;
    readonly __wbg_localbuf_free: (a: number, b: number) => void;
    readonly __wbg_localin_free: (a: number, b: number) => void;
    readonly __wbg_localout_free: (a: number, b: number) => void;
    readonly __wbg_logistic_free: (a: number, b: number) => void;
    readonly __wbg_lorenzl_free: (a: number, b: number) => void;
    readonly __wbg_loudness_free: (a: number, b: number) => void;
    readonly __wbg_lpf_free: (a: number, b: number) => void;
    readonly __wbg_lpz1_free: (a: number, b: number) => void;
    readonly __wbg_lpz2_free: (a: number, b: number) => void;
    readonly __wbg_mantissamask_free: (a: number, b: number) => void;
    readonly __wbg_maxlocalbufs_free: (a: number, b: number) => void;
    readonly __wbg_median_free: (a: number, b: number) => void;
    readonly __wbg_mfcc_free: (a: number, b: number) => void;
    readonly __wbg_mideq_free: (a: number, b: number) => void;
    readonly __wbg_moogff_free: (a: number, b: number) => void;
    readonly __wbg_mostchange_free: (a: number, b: number) => void;
    readonly __wbg_mousebutton_free: (a: number, b: number) => void;
    readonly __wbg_mousex_free: (a: number, b: number) => void;
    readonly __wbg_mousey_free: (a: number, b: number) => void;
    readonly __wbg_muladd_free: (a: number, b: number) => void;
    readonly __wbg_normalizer_free: (a: number, b: number) => void;
    readonly __wbg_nrand_free: (a: number, b: number) => void;
    readonly __wbg_numaudiobuses_free: (a: number, b: number) => void;
    readonly __wbg_numbuffers_free: (a: number, b: number) => void;
    readonly __wbg_numcontrolbuses_free: (a: number, b: number) => void;
    readonly __wbg_numinputbuses_free: (a: number, b: number) => void;
    readonly __wbg_numoutputbuses_free: (a: number, b: number) => void;
    readonly __wbg_numrunningsynths_free: (a: number, b: number) => void;
    readonly __wbg_offsetout_free: (a: number, b: number) => void;
    readonly __wbg_onepole_free: (a: number, b: number) => void;
    readonly __wbg_onezero_free: (a: number, b: number) => void;
    readonly __wbg_onsets_free: (a: number, b: number) => void;
    readonly __wbg_osc_free: (a: number, b: number) => void;
    readonly __wbg_out_free: (a: number, b: number) => void;
    readonly __wbg_pan2_free: (a: number, b: number) => void;
    readonly __wbg_pan4_free: (a: number, b: number) => void;
    readonly __wbg_panaz_free: (a: number, b: number) => void;
    readonly __wbg_panb2_free: (a: number, b: number) => void;
    readonly __wbg_panb_free: (a: number, b: number) => void;
    readonly __wbg_partconv_free: (a: number, b: number) => void;
    readonly __wbg_pause_free: (a: number, b: number) => void;
    readonly __wbg_pauseself_free: (a: number, b: number) => void;
    readonly __wbg_pauseselfwhendone_free: (a: number, b: number) => void;
    readonly __wbg_peak_free: (a: number, b: number) => void;
    readonly __wbg_peakfollower_free: (a: number, b: number) => void;
    readonly __wbg_phasor_free: (a: number, b: number) => void;
    readonly __wbg_pinknoise_free: (a: number, b: number) => void;
    readonly __wbg_pitch_free: (a: number, b: number) => void;
    readonly __wbg_pitchshift_free: (a: number, b: number) => void;
    readonly __wbg_playbuf_free: (a: number, b: number) => void;
    readonly __wbg_pluck_free: (a: number, b: number) => void;
    readonly __wbg_poll_free: (a: number, b: number) => void;
    readonly __wbg_psingrain_free: (a: number, b: number) => void;
    readonly __wbg_pulse_free: (a: number, b: number) => void;
    readonly __wbg_pulsecount_free: (a: number, b: number) => void;
    readonly __wbg_pulsedivider_free: (a: number, b: number) => void;
    readonly __wbg_pv_add_free: (a: number, b: number) => void;
    readonly __wbg_pv_binscramble_free: (a: number, b: number) => void;
    readonly __wbg_pv_binshift_free: (a: number, b: number) => void;
    readonly __wbg_pv_binwipe_free: (a: number, b: number) => void;
    readonly __wbg_pv_brickwall_free: (a: number, b: number) => void;
    readonly __wbg_pv_conformalmap_free: (a: number, b: number) => void;
    readonly __wbg_pv_conj_free: (a: number, b: number) => void;
    readonly __wbg_pv_copy_free: (a: number, b: number) => void;
    readonly __wbg_pv_copyphase_free: (a: number, b: number) => void;
    readonly __wbg_pv_diffuser_free: (a: number, b: number) => void;
    readonly __wbg_pv_div_free: (a: number, b: number) => void;
    readonly __wbg_pv_hainsworthfoote_free: (a: number, b: number) => void;
    readonly __wbg_pv_jensenandersen_free: (a: number, b: number) => void;
    readonly __wbg_pv_localmax_free: (a: number, b: number) => void;
    readonly __wbg_pv_magabove_free: (a: number, b: number) => void;
    readonly __wbg_pv_magbelow_free: (a: number, b: number) => void;
    readonly __wbg_pv_magclip_free: (a: number, b: number) => void;
    readonly __wbg_pv_magdiv_free: (a: number, b: number) => void;
    readonly __wbg_pv_magfreeze_free: (a: number, b: number) => void;
    readonly __wbg_pv_magmul_free: (a: number, b: number) => void;
    readonly __wbg_pv_magnoise_free: (a: number, b: number) => void;
    readonly __wbg_pv_magshift_free: (a: number, b: number) => void;
    readonly __wbg_pv_magsmear_free: (a: number, b: number) => void;
    readonly __wbg_pv_magsquared_free: (a: number, b: number) => void;
    readonly __wbg_pv_max_free: (a: number, b: number) => void;
    readonly __wbg_pv_min_free: (a: number, b: number) => void;
    readonly __wbg_pv_mul_free: (a: number, b: number) => void;
    readonly __wbg_pv_phaseshift270_free: (a: number, b: number) => void;
    readonly __wbg_pv_phaseshift90_free: (a: number, b: number) => void;
    readonly __wbg_pv_phaseshift_free: (a: number, b: number) => void;
    readonly __wbg_pv_randcomb_free: (a: number, b: number) => void;
    readonly __wbg_pv_randwipe_free: (a: number, b: number) => void;
    readonly __wbg_pv_rectcomb2_free: (a: number, b: number) => void;
    readonly __wbg_pv_rectcomb_free: (a: number, b: number) => void;
    readonly __wbg_quadc_free: (a: number, b: number) => void;
    readonly __wbg_quadl_free: (a: number, b: number) => void;
    readonly __wbg_quadn_free: (a: number, b: number) => void;
    readonly __wbg_radianspersample_free: (a: number, b: number) => void;
    readonly __wbg_ramp_free: (a: number, b: number) => void;
    readonly __wbg_rand_free: (a: number, b: number) => void;
    readonly __wbg_randid_free: (a: number, b: number) => void;
    readonly __wbg_randseed_free: (a: number, b: number) => void;
    readonly __wbg_recordbuf_free: (a: number, b: number) => void;
    readonly __wbg_replaceout_free: (a: number, b: number) => void;
    readonly __wbg_resonz_free: (a: number, b: number) => void;
    readonly __wbg_rhpf_free: (a: number, b: number) => void;
    readonly __wbg_ringz_free: (a: number, b: number) => void;
    readonly __wbg_rlpf_free: (a: number, b: number) => void;
    readonly __wbg_rotate2_free: (a: number, b: number) => void;
    readonly __wbg_runningmax_free: (a: number, b: number) => void;
    readonly __wbg_runningmin_free: (a: number, b: number) => void;
    readonly __wbg_runningsum_free: (a: number, b: number) => void;
    readonly __wbg_sampledur_free: (a: number, b: number) => void;
    readonly __wbg_samplerate_free: (a: number, b: number) => void;
    readonly __wbg_saw_free: (a: number, b: number) => void;
    readonly __wbg_schmidt_free: (a: number, b: number) => void;
    readonly __wbg_scopeout2_free: (a: number, b: number) => void;
    readonly __wbg_scopeout_free: (a: number, b: number) => void;
    readonly __wbg_select_free: (a: number, b: number) => void;
    readonly __wbg_sendreply_free: (a: number, b: number) => void;
    readonly __wbg_sendtrig_free: (a: number, b: number) => void;
    readonly __wbg_setbuf_free: (a: number, b: number) => void;
    readonly __wbg_setresetff_free: (a: number, b: number) => void;
    readonly __wbg_shaper_free: (a: number, b: number) => void;
    readonly __wbg_sharedin_free: (a: number, b: number) => void;
    readonly __wbg_sharedout_free: (a: number, b: number) => void;
    readonly __wbg_silent_free: (a: number, b: number) => void;
    readonly __wbg_sinosc_free: (a: number, b: number) => void;
    readonly __wbg_sinoscfb_free: (a: number, b: number) => void;
    readonly __wbg_slew_free: (a: number, b: number) => void;
    readonly __wbg_slope_free: (a: number, b: number) => void;
    readonly __wbg_sos_free: (a: number, b: number) => void;
    readonly __wbg_speccentroid_free: (a: number, b: number) => void;
    readonly __wbg_specflatness_free: (a: number, b: number) => void;
    readonly __wbg_specpcile_free: (a: number, b: number) => void;
    readonly __wbg_spring_free: (a: number, b: number) => void;
    readonly __wbg_standardl_free: (a: number, b: number) => void;
    readonly __wbg_standardn_free: (a: number, b: number) => void;
    readonly __wbg_stepper_free: (a: number, b: number) => void;
    readonly __wbg_stereoconvolution2l_free: (a: number, b: number) => void;
    readonly __wbg_subsampleoffset_free: (a: number, b: number) => void;
    readonly __wbg_sweep_free: (a: number, b: number) => void;
    readonly __wbg_syncsaw_free: (a: number, b: number) => void;
    readonly __wbg_t2a_free: (a: number, b: number) => void;
    readonly __wbg_t2k_free: (a: number, b: number) => void;
    readonly __wbg_tball_free: (a: number, b: number) => void;
    readonly __wbg_tdelay_free: (a: number, b: number) => void;
    readonly __wbg_tduty_free: (a: number, b: number) => void;
    readonly __wbg_texprand_free: (a: number, b: number) => void;
    readonly __wbg_tgrains_free: (a: number, b: number) => void;
    readonly __wbg_timer_free: (a: number, b: number) => void;
    readonly __wbg_tirand_free: (a: number, b: number) => void;
    readonly __wbg_toggleff_free: (a: number, b: number) => void;
    readonly __wbg_trand_free: (a: number, b: number) => void;
    readonly __wbg_trapezoid_free: (a: number, b: number) => void;
    readonly __wbg_trig1_free: (a: number, b: number) => void;
    readonly __wbg_trig_free: (a: number, b: number) => void;
    readonly __wbg_twindex_free: (a: number, b: number) => void;
    readonly __wbg_twopole_free: (a: number, b: number) => void;
    readonly __wbg_twozero_free: (a: number, b: number) => void;
    readonly __wbg_varsaw_free: (a: number, b: number) => void;
    readonly __wbg_vdiskin_free: (a: number, b: number) => void;
    readonly __wbg_vibrato_free: (a: number, b: number) => void;
    readonly __wbg_vosc3_free: (a: number, b: number) => void;
    readonly __wbg_vosc_free: (a: number, b: number) => void;
    readonly __wbg_warp1_free: (a: number, b: number) => void;
    readonly __wbg_whitenoise_free: (a: number, b: number) => void;
    readonly __wbg_wrap_free: (a: number, b: number) => void;
    readonly __wbg_wrapindex_free: (a: number, b: number) => void;
    readonly __wbg_xfade2_free: (a: number, b: number) => void;
    readonly __wbg_xline_free: (a: number, b: number) => void;
    readonly __wbg_xout_free: (a: number, b: number) => void;
    readonly __wbg_zerocrossing_free: (a: number, b: number) => void;
    readonly a2k_kr: (a: any) => [number, number, number];
    readonly allpassc_ar: (a: any) => [number, number, number];
    readonly allpassc_kr: (a: any) => [number, number, number];
    readonly allpassl_ar: (a: any) => [number, number, number];
    readonly allpassl_kr: (a: any) => [number, number, number];
    readonly allpassn_ar: (a: any) => [number, number, number];
    readonly allpassn_kr: (a: any) => [number, number, number];
    readonly ampcomp_ar: (a: any) => [number, number, number];
    readonly ampcomp_ir: (a: any) => [number, number, number];
    readonly ampcomp_kr: (a: any) => [number, number, number];
    readonly ampcompa_ar: (a: any) => [number, number, number];
    readonly ampcompa_ir: (a: any) => [number, number, number];
    readonly ampcompa_kr: (a: any) => [number, number, number];
    readonly amplitude_ar: (a: any) => [number, number, number];
    readonly amplitude_kr: (a: any) => [number, number, number];
    readonly apf_ar: (a: any) => [number, number, number];
    readonly apf_kr: (a: any) => [number, number, number];
    readonly balance2_ar: (a: any) => [number, number, number];
    readonly balance2_kr: (a: any) => [number, number, number];
    readonly ball_ar: (a: any) => [number, number, number];
    readonly ball_kr: (a: any) => [number, number, number];
    readonly ballpass_ar: (a: any) => [number, number, number];
    readonly bbandpass_ar: (a: any) => [number, number, number];
    readonly bbandstop_ar: (a: any) => [number, number, number];
    readonly beattrack2_kr: (a: any) => [number, number, number];
    readonly beattrack_kr: (a: any) => [number, number, number];
    readonly bhipass_ar: (a: any) => [number, number, number];
    readonly bhishelf_ar: (a: any) => [number, number, number];
    readonly bipanb2_ar: (a: any) => [number, number, number];
    readonly bipanb2_kr: (a: any) => [number, number, number];
    readonly blip_ar: (a: any) => [number, number, number];
    readonly blip_kr: (a: any) => [number, number, number];
    readonly blowpass_ar: (a: any) => [number, number, number];
    readonly blowshelf_ar: (a: any) => [number, number, number];
    readonly bpeakeq_ar: (a: any) => [number, number, number];
    readonly bpf_ar: (a: any) => [number, number, number];
    readonly bpf_kr: (a: any) => [number, number, number];
    readonly bpz2_ar: (a: any) => [number, number, number];
    readonly bpz2_kr: (a: any) => [number, number, number];
    readonly brf_ar: (a: any) => [number, number, number];
    readonly brf_kr: (a: any) => [number, number, number];
    readonly brownnoise_ar: (a: any) => [number, number, number];
    readonly brownnoise_kr: (a: any) => [number, number, number];
    readonly brz2_ar: (a: any) => [number, number, number];
    readonly brz2_kr: (a: any) => [number, number, number];
    readonly bufallpassc_ar: (a: any) => [number, number, number];
    readonly bufallpassl_ar: (a: any) => [number, number, number];
    readonly bufallpassn_ar: (a: any) => [number, number, number];
    readonly bufchannels_ir: (a: any) => [number, number, number];
    readonly bufchannels_kr: (a: any) => [number, number, number];
    readonly bufcombc_ar: (a: any) => [number, number, number];
    readonly bufcombl_ar: (a: any) => [number, number, number];
    readonly bufcombn_ar: (a: any) => [number, number, number];
    readonly bufdelayc_ar: (a: any) => [number, number, number];
    readonly bufdelayc_kr: (a: any) => [number, number, number];
    readonly bufdelayl_ar: (a: any) => [number, number, number];
    readonly bufdelayl_kr: (a: any) => [number, number, number];
    readonly bufdelayn_ar: (a: any) => [number, number, number];
    readonly bufdelayn_kr: (a: any) => [number, number, number];
    readonly bufdur_ir: (a: any) => [number, number, number];
    readonly bufdur_kr: (a: any) => [number, number, number];
    readonly bufframes_ir: (a: any) => [number, number, number];
    readonly bufframes_kr: (a: any) => [number, number, number];
    readonly bufratescale_ir: (a: any) => [number, number, number];
    readonly bufratescale_kr: (a: any) => [number, number, number];
    readonly bufrd_ar: (a: any) => [number, number, number];
    readonly bufrd_kr: (a: any) => [number, number, number];
    readonly bufsamplerate_ir: (a: any) => [number, number, number];
    readonly bufsamplerate_kr: (a: any) => [number, number, number];
    readonly bufsamples_ir: (a: any) => [number, number, number];
    readonly bufsamples_kr: (a: any) => [number, number, number];
    readonly bufwr_ar: (a: any) => [number, number, number];
    readonly bufwr_kr: (a: any) => [number, number, number];
    readonly checkbadvalues_ar: (a: any) => [number, number, number];
    readonly checkbadvalues_kr: (a: any) => [number, number, number];
    readonly clearbuf_ir: (a: any) => [number, number, number];
    readonly clip_ar: (a: any) => [number, number, number];
    readonly clip_kr: (a: any) => [number, number, number];
    readonly clipnoise_ar: (a: any) => [number, number, number];
    readonly clipnoise_kr: (a: any) => [number, number, number];
    readonly coingate_ar: (a: any) => [number, number, number];
    readonly coingate_kr: (a: any) => [number, number, number];
    readonly combc_ar: (a: any) => [number, number, number];
    readonly combc_kr: (a: any) => [number, number, number];
    readonly combl_ar: (a: any) => [number, number, number];
    readonly combl_kr: (a: any) => [number, number, number];
    readonly combn_ar: (a: any) => [number, number, number];
    readonly combn_kr: (a: any) => [number, number, number];
    readonly compander_ar: (a: any) => [number, number, number];
    readonly controldur_ir: (a: any) => [number, number, number];
    readonly controlrate_ir: (a: any) => [number, number, number];
    readonly convolution2_ar: (a: any) => [number, number, number];
    readonly convolution2l_ar: (a: any) => [number, number, number];
    readonly convolution3_ar: (a: any) => [number, number, number];
    readonly convolution3_kr: (a: any) => [number, number, number];
    readonly convolution_ar: (a: any) => [number, number, number];
    readonly cosc_ar: (a: any) => [number, number, number];
    readonly cosc_kr: (a: any) => [number, number, number];
    readonly crackle_ar: (a: any) => [number, number, number];
    readonly crackle_kr: (a: any) => [number, number, number];
    readonly cuspl_ar: (a: any) => [number, number, number];
    readonly cuspn_ar: (a: any) => [number, number, number];
    readonly dc_ar: (a: any) => [number, number, number];
    readonly dc_kr: (a: any) => [number, number, number];
    readonly decay2_ar: (a: any) => [number, number, number];
    readonly decay2_kr: (a: any) => [number, number, number];
    readonly decay_ar: (a: any) => [number, number, number];
    readonly decay_kr: (a: any) => [number, number, number];
    readonly decodeb2_ar: (a: any) => [number, number, number];
    readonly decodeb2_kr: (a: any) => [number, number, number];
    readonly degreetokey_ar: (a: any) => [number, number, number];
    readonly degreetokey_kr: (a: any) => [number, number, number];
    readonly delay1_ar: (a: any) => [number, number, number];
    readonly delay1_kr: (a: any) => [number, number, number];
    readonly delay2_ar: (a: any) => [number, number, number];
    readonly delay2_kr: (a: any) => [number, number, number];
    readonly delayc_ar: (a: any) => [number, number, number];
    readonly delayc_kr: (a: any) => [number, number, number];
    readonly delayl_ar: (a: any) => [number, number, number];
    readonly delayl_kr: (a: any) => [number, number, number];
    readonly delayn_ar: (a: any) => [number, number, number];
    readonly delayn_kr: (a: any) => [number, number, number];
    readonly deltaprd_ar: (a: any) => [number, number, number];
    readonly deltaprd_kr: (a: any) => [number, number, number];
    readonly deltapwr_ar: (a: any) => [number, number, number];
    readonly deltapwr_kr: (a: any) => [number, number, number];
    readonly demand_ar: (a: any) => [number, number, number];
    readonly demand_kr: (a: any) => [number, number, number];
    readonly demandenvgen_ar: (a: any) => [number, number, number];
    readonly demandenvgen_kr: (a: any) => [number, number, number];
    readonly detectindex_ar: (a: any) => [number, number, number];
    readonly detectindex_kr: (a: any) => [number, number, number];
    readonly detectsilence_ar: (a: any) => [number, number, number];
    readonly detectsilence_kr: (a: any) => [number, number, number];
    readonly diskin_ar: (a: any) => [number, number, number];
    readonly diskout_ar: (a: any) => [number, number, number];
    readonly done_kr: (a: any) => [number, number, number];
    readonly dust2_ar: (a: any) => [number, number, number];
    readonly dust2_kr: (a: any) => [number, number, number];
    readonly dust_ar: (a: any) => [number, number, number];
    readonly dust_kr: (a: any) => [number, number, number];
    readonly duty_ar: (a: any) => [number, number, number];
    readonly duty_kr: (a: any) => [number, number, number];
    readonly envgen_ar: (a: any) => [number, number, number];
    readonly envgen_kr: (a: any) => [number, number, number];
    readonly exprand_ir: (a: any) => [number, number, number];
    readonly fbsinec_ar: (a: any) => [number, number, number];
    readonly fbsinel_ar: (a: any) => [number, number, number];
    readonly fbsinen_ar: (a: any) => [number, number, number];
    readonly fft_kr: (a: any) => [number, number, number];
    readonly ffttrigger_kr: (a: any) => [number, number, number];
    readonly fold_ar: (a: any) => [number, number, number];
    readonly fold_kr: (a: any) => [number, number, number];
    readonly formant_ar: (a: any) => [number, number, number];
    readonly formlet_ar: (a: any) => [number, number, number];
    readonly formlet_kr: (a: any) => [number, number, number];
    readonly fos_ar: (a: any) => [number, number, number];
    readonly fos_kr: (a: any) => [number, number, number];
    readonly free_kr: (a: any) => [number, number, number];
    readonly freeself_kr: (a: any) => [number, number, number];
    readonly freeselfwhendone_kr: (a: any) => [number, number, number];
    readonly freeverb2_ar: (a: any) => [number, number, number];
    readonly freeverb_ar: (a: any) => [number, number, number];
    readonly freqshift_ar: (a: any) => [number, number, number];
    readonly fsinosc_ar: (a: any) => [number, number, number];
    readonly fsinosc_kr: (a: any) => [number, number, number];
    readonly gate_ar: (a: any) => [number, number, number];
    readonly gate_kr: (a: any) => [number, number, number];
    readonly gbmanl_ar: (a: any) => [number, number, number];
    readonly gbmann_ar: (a: any) => [number, number, number];
    readonly gendy1_ar: (a: any) => [number, number, number];
    readonly gendy1_kr: (a: any) => [number, number, number];
    readonly gendy2_ar: (a: any) => [number, number, number];
    readonly gendy2_kr: (a: any) => [number, number, number];
    readonly gendy3_ar: (a: any) => [number, number, number];
    readonly gendy3_kr: (a: any) => [number, number, number];
    readonly grainbuf_ar: (a: any) => [number, number, number];
    readonly grainfm_ar: (a: any) => [number, number, number];
    readonly grainin_ar: (a: any) => [number, number, number];
    readonly grainsin_ar: (a: any) => [number, number, number];
    readonly graynoise_ar: (a: any) => [number, number, number];
    readonly graynoise_kr: (a: any) => [number, number, number];
    readonly gverb_ar: (a: any) => [number, number, number];
    readonly hasher_ar: (a: any) => [number, number, number];
    readonly hasher_kr: (a: any) => [number, number, number];
    readonly henonc_ar: (a: any) => [number, number, number];
    readonly henonl_ar: (a: any) => [number, number, number];
    readonly henonn_ar: (a: any) => [number, number, number];
    readonly hilbert_ar: (a: any) => [number, number, number];
    readonly hpf_ar: (a: any) => [number, number, number];
    readonly hpf_kr: (a: any) => [number, number, number];
    readonly hpz1_ar: (a: any) => [number, number, number];
    readonly hpz1_kr: (a: any) => [number, number, number];
    readonly hpz2_ar: (a: any) => [number, number, number];
    readonly hpz2_kr: (a: any) => [number, number, number];
    readonly ienvgen_ar: (a: any) => [number, number, number];
    readonly ienvgen_kr: (a: any) => [number, number, number];
    readonly ifft_ar: (a: any) => [number, number, number];
    readonly ifft_kr: (a: any) => [number, number, number];
    readonly impulse_ar: (a: any) => [number, number, number];
    readonly impulse_kr: (a: any) => [number, number, number];
    readonly in_ar: (a: any) => [number, number, number];
    readonly in_kr: (a: any) => [number, number, number];
    readonly index_ar: (a: any) => [number, number, number];
    readonly index_kr: (a: any) => [number, number, number];
    readonly indexinbetween_ar: (a: any) => [number, number, number];
    readonly indexinbetween_kr: (a: any) => [number, number, number];
    readonly infeedback_ar: (a: any) => [number, number, number];
    readonly inrange_ar: (a: any) => [number, number, number];
    readonly inrange_ir: (a: any) => [number, number, number];
    readonly inrange_kr: (a: any) => [number, number, number];
    readonly inrect_ar: (a: any) => [number, number, number];
    readonly inrect_kr: (a: any) => [number, number, number];
    readonly integrator_ar: (a: any) => [number, number, number];
    readonly integrator_kr: (a: any) => [number, number, number];
    readonly intrig_kr: (a: any) => [number, number, number];
    readonly irand_ir: (a: any) => [number, number, number];
    readonly k2a_ar: (a: any) => [number, number, number];
    readonly keystate_kr: (a: any) => [number, number, number];
    readonly keytrack_kr: (a: any) => [number, number, number];
    readonly klang_ar: (a: any) => [number, number, number];
    readonly klank_ar: (a: any) => [number, number, number];
    readonly lag2_ar: (a: any) => [number, number, number];
    readonly lag2_kr: (a: any) => [number, number, number];
    readonly lag2ud_ar: (a: any) => [number, number, number];
    readonly lag2ud_kr: (a: any) => [number, number, number];
    readonly lag3_ar: (a: any) => [number, number, number];
    readonly lag3_kr: (a: any) => [number, number, number];
    readonly lag3ud_ar: (a: any) => [number, number, number];
    readonly lag3ud_kr: (a: any) => [number, number, number];
    readonly lag_ar: (a: any) => [number, number, number];
    readonly lag_kr: (a: any) => [number, number, number];
    readonly lagin_kr: (a: any) => [number, number, number];
    readonly lagud_ar: (a: any) => [number, number, number];
    readonly lagud_kr: (a: any) => [number, number, number];
    readonly lastvalue_ar: (a: any) => [number, number, number];
    readonly lastvalue_kr: (a: any) => [number, number, number];
    readonly latch_ar: (a: any) => [number, number, number];
    readonly latch_kr: (a: any) => [number, number, number];
    readonly latoocarfianc_ar: (a: any) => [number, number, number];
    readonly latoocarfianl_ar: (a: any) => [number, number, number];
    readonly latoocarfiann_ar: (a: any) => [number, number, number];
    readonly leakdc_ar: (a: any) => [number, number, number];
    readonly leakdc_kr: (a: any) => [number, number, number];
    readonly leastchange_ar: (a: any) => [number, number, number];
    readonly leastchange_kr: (a: any) => [number, number, number];
    readonly lfclipnoise_ar: (a: any) => [number, number, number];
    readonly lfclipnoise_kr: (a: any) => [number, number, number];
    readonly lfcub_ar: (a: any) => [number, number, number];
    readonly lfcub_kr: (a: any) => [number, number, number];
    readonly lfdclipnoise_ar: (a: any) => [number, number, number];
    readonly lfdclipnoise_kr: (a: any) => [number, number, number];
    readonly lfdnoise0_ar: (a: any) => [number, number, number];
    readonly lfdnoise0_kr: (a: any) => [number, number, number];
    readonly lfdnoise1_ar: (a: any) => [number, number, number];
    readonly lfdnoise1_kr: (a: any) => [number, number, number];
    readonly lfdnoise3_ar: (a: any) => [number, number, number];
    readonly lfdnoise3_kr: (a: any) => [number, number, number];
    readonly lfgauss_ar: (a: any) => [number, number, number];
    readonly lfgauss_kr: (a: any) => [number, number, number];
    readonly lfnoise0_ar: (a: any) => [number, number, number];
    readonly lfnoise0_kr: (a: any) => [number, number, number];
    readonly lfnoise1_ar: (a: any) => [number, number, number];
    readonly lfnoise1_kr: (a: any) => [number, number, number];
    readonly lfnoise2_ar: (a: any) => [number, number, number];
    readonly lfnoise2_kr: (a: any) => [number, number, number];
    readonly lfpar_ar: (a: any) => [number, number, number];
    readonly lfpar_kr: (a: any) => [number, number, number];
    readonly lfpulse_ar: (a: any) => [number, number, number];
    readonly lfpulse_kr: (a: any) => [number, number, number];
    readonly lfsaw_ar: (a: any) => [number, number, number];
    readonly lfsaw_kr: (a: any) => [number, number, number];
    readonly lftri_ar: (a: any) => [number, number, number];
    readonly lftri_kr: (a: any) => [number, number, number];
    readonly limiter_ar: (a: any) => [number, number, number];
    readonly lincongc_ar: (a: any) => [number, number, number];
    readonly lincongl_ar: (a: any) => [number, number, number];
    readonly lincongn_ar: (a: any) => [number, number, number];
    readonly line_ar: (a: any) => [number, number, number];
    readonly line_kr: (a: any) => [number, number, number];
    readonly linen_kr: (a: any) => [number, number, number];
    readonly linexp_ar: (a: any) => [number, number, number];
    readonly linexp_kr: (a: any) => [number, number, number];
    readonly linpan2_ar: (a: any) => [number, number, number];
    readonly linpan2_kr: (a: any) => [number, number, number];
    readonly linrand_ir: (a: any) => [number, number, number];
    readonly linxfade2_ar: (a: any) => [number, number, number];
    readonly linxfade2_kr: (a: any) => [number, number, number];
    readonly localbuf_ir: (a: any) => [number, number, number];
    readonly localin_ar: (a: any) => [number, number, number];
    readonly localin_kr: (a: any) => [number, number, number];
    readonly localout_ar: (a: any) => [number, number, number];
    readonly localout_kr: (a: any) => [number, number, number];
    readonly logistic_ar: (a: any) => [number, number, number];
    readonly logistic_kr: (a: any) => [number, number, number];
    readonly lorenzl_ar: (a: any) => [number, number, number];
    readonly loudness_kr: (a: any) => [number, number, number];
    readonly lpf_ar: (a: any) => [number, number, number];
    readonly lpf_kr: (a: any) => [number, number, number];
    readonly lpz1_ar: (a: any) => [number, number, number];
    readonly lpz1_kr: (a: any) => [number, number, number];
    readonly lpz2_ar: (a: any) => [number, number, number];
    readonly lpz2_kr: (a: any) => [number, number, number];
    readonly mantissamask_ar: (a: any) => [number, number, number];
    readonly mantissamask_kr: (a: any) => [number, number, number];
    readonly maxlocalbufs_ir: (a: any) => [number, number, number];
    readonly median_ar: (a: any) => [number, number, number];
    readonly median_kr: (a: any) => [number, number, number];
    readonly mfcc_kr: (a: any) => [number, number, number];
    readonly mideq_ar: (a: any) => [number, number, number];
    readonly mideq_kr: (a: any) => [number, number, number];
    readonly moogff_ar: (a: any) => [number, number, number];
    readonly moogff_kr: (a: any) => [number, number, number];
    readonly mostchange_ar: (a: any) => [number, number, number];
    readonly mostchange_kr: (a: any) => [number, number, number];
    readonly mousebutton_kr: (a: any) => [number, number, number];
    readonly mousex_kr: (a: any) => [number, number, number];
    readonly mousey_kr: (a: any) => [number, number, number];
    readonly muladd_ar: (a: any) => [number, number, number];
    readonly muladd_ir: (a: any) => [number, number, number];
    readonly muladd_kr: (a: any) => [number, number, number];
    readonly normalizer_ar: (a: any) => [number, number, number];
    readonly nrand_ir: (a: any) => [number, number, number];
    readonly numaudiobuses_ir: (a: any) => [number, number, number];
    readonly numbuffers_ir: (a: any) => [number, number, number];
    readonly numcontrolbuses_ir: (a: any) => [number, number, number];
    readonly numinputbuses_ir: (a: any) => [number, number, number];
    readonly numoutputbuses_ir: (a: any) => [number, number, number];
    readonly numrunningsynths_ir: (a: any) => [number, number, number];
    readonly numrunningsynths_kr: (a: any) => [number, number, number];
    readonly offsetout_ar: (a: any) => [number, number, number];
    readonly offsetout_kr: (a: any) => [number, number, number];
    readonly onepole_ar: (a: any) => [number, number, number];
    readonly onepole_kr: (a: any) => [number, number, number];
    readonly onezero_ar: (a: any) => [number, number, number];
    readonly onezero_kr: (a: any) => [number, number, number];
    readonly onsets_kr: (a: any) => [number, number, number];
    readonly osc_ar: (a: any) => [number, number, number];
    readonly osc_kr: (a: any) => [number, number, number];
    readonly out_ar: (a: any) => [number, number, number];
    readonly out_kr: (a: any) => [number, number, number];
    readonly pan2_ar: (a: any) => [number, number, number];
    readonly pan2_kr: (a: any) => [number, number, number];
    readonly pan4_ar: (a: any) => [number, number, number];
    readonly pan4_kr: (a: any) => [number, number, number];
    readonly panaz_ar: (a: any) => [number, number, number];
    readonly panaz_kr: (a: any) => [number, number, number];
    readonly panb2_ar: (a: any) => [number, number, number];
    readonly panb2_kr: (a: any) => [number, number, number];
    readonly panb_ar: (a: any) => [number, number, number];
    readonly panb_kr: (a: any) => [number, number, number];
    readonly partconv_ar: (a: any) => [number, number, number];
    readonly pause_kr: (a: any) => [number, number, number];
    readonly pauseself_kr: (a: any) => [number, number, number];
    readonly pauseselfwhendone_kr: (a: any) => [number, number, number];
    readonly peak_ar: (a: any) => [number, number, number];
    readonly peak_kr: (a: any) => [number, number, number];
    readonly peakfollower_ar: (a: any) => [number, number, number];
    readonly peakfollower_kr: (a: any) => [number, number, number];
    readonly phasor_ar: (a: any) => [number, number, number];
    readonly phasor_kr: (a: any) => [number, number, number];
    readonly pinknoise_ar: (a: any) => [number, number, number];
    readonly pinknoise_kr: (a: any) => [number, number, number];
    readonly pitch_kr: (a: any) => [number, number, number];
    readonly pitchshift_ar: (a: any) => [number, number, number];
    readonly playbuf_ar: (a: any) => [number, number, number];
    readonly playbuf_kr: (a: any) => [number, number, number];
    readonly pluck_ar: (a: any) => [number, number, number];
    readonly poll_ar: (a: any) => [number, number, number];
    readonly poll_kr: (a: any) => [number, number, number];
    readonly psingrain_ar: (a: any) => [number, number, number];
    readonly pulse_ar: (a: any) => [number, number, number];
    readonly pulse_kr: (a: any) => [number, number, number];
    readonly pulsecount_ar: (a: any) => [number, number, number];
    readonly pulsecount_kr: (a: any) => [number, number, number];
    readonly pulsedivider_ar: (a: any) => [number, number, number];
    readonly pulsedivider_kr: (a: any) => [number, number, number];
    readonly pv_add_kr: (a: any) => [number, number, number];
    readonly pv_binscramble_kr: (a: any) => [number, number, number];
    readonly pv_binshift_kr: (a: any) => [number, number, number];
    readonly pv_binwipe_kr: (a: any) => [number, number, number];
    readonly pv_brickwall_kr: (a: any) => [number, number, number];
    readonly pv_conformalmap_kr: (a: any) => [number, number, number];
    readonly pv_conj_kr: (a: any) => [number, number, number];
    readonly pv_copy_kr: (a: any) => [number, number, number];
    readonly pv_copyphase_kr: (a: any) => [number, number, number];
    readonly pv_diffuser_kr: (a: any) => [number, number, number];
    readonly pv_div_kr: (a: any) => [number, number, number];
    readonly pv_hainsworthfoote_ar: (a: any) => [number, number, number];
    readonly pv_jensenandersen_ar: (a: any) => [number, number, number];
    readonly pv_localmax_kr: (a: any) => [number, number, number];
    readonly pv_magabove_kr: (a: any) => [number, number, number];
    readonly pv_magbelow_kr: (a: any) => [number, number, number];
    readonly pv_magclip_kr: (a: any) => [number, number, number];
    readonly pv_magdiv_kr: (a: any) => [number, number, number];
    readonly pv_magfreeze_kr: (a: any) => [number, number, number];
    readonly pv_magmul_kr: (a: any) => [number, number, number];
    readonly pv_magnoise_kr: (a: any) => [number, number, number];
    readonly pv_magshift_kr: (a: any) => [number, number, number];
    readonly pv_magsmear_kr: (a: any) => [number, number, number];
    readonly pv_magsquared_kr: (a: any) => [number, number, number];
    readonly pv_max_kr: (a: any) => [number, number, number];
    readonly pv_min_kr: (a: any) => [number, number, number];
    readonly pv_mul_kr: (a: any) => [number, number, number];
    readonly pv_phaseshift270_kr: (a: any) => [number, number, number];
    readonly pv_phaseshift90_kr: (a: any) => [number, number, number];
    readonly pv_phaseshift_kr: (a: any) => [number, number, number];
    readonly pv_randcomb_kr: (a: any) => [number, number, number];
    readonly pv_randwipe_kr: (a: any) => [number, number, number];
    readonly pv_rectcomb2_kr: (a: any) => [number, number, number];
    readonly pv_rectcomb_kr: (a: any) => [number, number, number];
    readonly quadc_ar: (a: any) => [number, number, number];
    readonly quadl_ar: (a: any) => [number, number, number];
    readonly quadn_ar: (a: any) => [number, number, number];
    readonly radianspersample_ir: (a: any) => [number, number, number];
    readonly ramp_ar: (a: any) => [number, number, number];
    readonly ramp_kr: (a: any) => [number, number, number];
    readonly rand_ir: (a: any) => [number, number, number];
    readonly randid_ir: (a: any) => [number, number, number];
    readonly randid_kr: (a: any) => [number, number, number];
    readonly randseed_ar: (a: any) => [number, number, number];
    readonly randseed_ir: (a: any) => [number, number, number];
    readonly randseed_kr: (a: any) => [number, number, number];
    readonly recordbuf_ar: (a: any) => [number, number, number];
    readonly recordbuf_kr: (a: any) => [number, number, number];
    readonly replaceout_ar: (a: any) => [number, number, number];
    readonly replaceout_kr: (a: any) => [number, number, number];
    readonly resonz_ar: (a: any) => [number, number, number];
    readonly resonz_kr: (a: any) => [number, number, number];
    readonly rhpf_ar: (a: any) => [number, number, number];
    readonly rhpf_kr: (a: any) => [number, number, number];
    readonly ringz_ar: (a: any) => [number, number, number];
    readonly ringz_kr: (a: any) => [number, number, number];
    readonly rlpf_ar: (a: any) => [number, number, number];
    readonly rlpf_kr: (a: any) => [number, number, number];
    readonly rotate2_ar: (a: any) => [number, number, number];
    readonly rotate2_kr: (a: any) => [number, number, number];
    readonly runningmax_ar: (a: any) => [number, number, number];
    readonly runningmax_kr: (a: any) => [number, number, number];
    readonly runningmin_ar: (a: any) => [number, number, number];
    readonly runningmin_kr: (a: any) => [number, number, number];
    readonly runningsum_ar: (a: any) => [number, number, number];
    readonly runningsum_kr: (a: any) => [number, number, number];
    readonly sampledur_ir: (a: any) => [number, number, number];
    readonly samplerate_ir: (a: any) => [number, number, number];
    readonly saw_ar: (a: any) => [number, number, number];
    readonly saw_kr: (a: any) => [number, number, number];
    readonly schmidt_ar: (a: any) => [number, number, number];
    readonly schmidt_kr: (a: any) => [number, number, number];
    readonly scopeout2_ar: (a: any) => [number, number, number];
    readonly scopeout2_kr: (a: any) => [number, number, number];
    readonly scopeout_ar: (a: any) => [number, number, number];
    readonly scopeout_kr: (a: any) => [number, number, number];
    readonly select_ar: (a: any) => [number, number, number];
    readonly select_kr: (a: any) => [number, number, number];
    readonly sendreply_ar: (a: any) => [number, number, number];
    readonly sendreply_kr: (a: any) => [number, number, number];
    readonly sendtrig_ar: (a: any) => [number, number, number];
    readonly sendtrig_kr: (a: any) => [number, number, number];
    readonly setbuf_ar: (a: any) => [number, number, number];
    readonly setbuf_kr: (a: any) => [number, number, number];
    readonly setresetff_ar: (a: any) => [number, number, number];
    readonly setresetff_kr: (a: any) => [number, number, number];
    readonly shaper_ar: (a: any) => [number, number, number];
    readonly shaper_kr: (a: any) => [number, number, number];
    readonly sharedin_kr: (a: any) => [number, number, number];
    readonly sharedout_kr: (a: any) => [number, number, number];
    readonly silent_ar: (a: any) => [number, number, number];
    readonly sinosc_ar: (a: any) => [number, number, number];
    readonly sinosc_kr: (a: any) => [number, number, number];
    readonly sinoscfb_ar: (a: any) => [number, number, number];
    readonly sinoscfb_kr: (a: any) => [number, number, number];
    readonly slew_ar: (a: any) => [number, number, number];
    readonly slew_kr: (a: any) => [number, number, number];
    readonly slope_ar: (a: any) => [number, number, number];
    readonly slope_kr: (a: any) => [number, number, number];
    readonly sos_ar: (a: any) => [number, number, number];
    readonly sos_kr: (a: any) => [number, number, number];
    readonly speccentroid_kr: (a: any) => [number, number, number];
    readonly specflatness_kr: (a: any) => [number, number, number];
    readonly specpcile_kr: (a: any) => [number, number, number];
    readonly spring_ar: (a: any) => [number, number, number];
    readonly spring_kr: (a: any) => [number, number, number];
    readonly standardl_ar: (a: any) => [number, number, number];
    readonly standardn_ar: (a: any) => [number, number, number];
    readonly stepper_ar: (a: any) => [number, number, number];
    readonly stepper_kr: (a: any) => [number, number, number];
    readonly stereoconvolution2l_ar: (a: any) => [number, number, number];
    readonly subsampleoffset_ir: (a: any) => [number, number, number];
    readonly sweep_ar: (a: any) => [number, number, number];
    readonly sweep_kr: (a: any) => [number, number, number];
    readonly syncsaw_ar: (a: any) => [number, number, number];
    readonly syncsaw_kr: (a: any) => [number, number, number];
    readonly t2a_ar: (a: any) => [number, number, number];
    readonly t2k_kr: (a: any) => [number, number, number];
    readonly tball_ar: (a: any) => [number, number, number];
    readonly tball_kr: (a: any) => [number, number, number];
    readonly tdelay_ar: (a: any) => [number, number, number];
    readonly tdelay_kr: (a: any) => [number, number, number];
    readonly tduty_ar: (a: any) => [number, number, number];
    readonly tduty_kr: (a: any) => [number, number, number];
    readonly texprand_ar: (a: any) => [number, number, number];
    readonly texprand_kr: (a: any) => [number, number, number];
    readonly tgrains_ar: (a: any) => [number, number, number];
    readonly timer_ar: (a: any) => [number, number, number];
    readonly timer_kr: (a: any) => [number, number, number];
    readonly tirand_ar: (a: any) => [number, number, number];
    readonly tirand_kr: (a: any) => [number, number, number];
    readonly toggleff_ar: (a: any) => [number, number, number];
    readonly toggleff_kr: (a: any) => [number, number, number];
    readonly trand_ar: (a: any) => [number, number, number];
    readonly trand_kr: (a: any) => [number, number, number];
    readonly trapezoid_ar: (a: any) => [number, number, number];
    readonly trapezoid_kr: (a: any) => [number, number, number];
    readonly trig1_ar: (a: any) => [number, number, number];
    readonly trig1_kr: (a: any) => [number, number, number];
    readonly trig_ar: (a: any) => [number, number, number];
    readonly trig_kr: (a: any) => [number, number, number];
    readonly twindex_ar: (a: any) => [number, number, number];
    readonly twindex_kr: (a: any) => [number, number, number];
    readonly twopole_ar: (a: any) => [number, number, number];
    readonly twopole_kr: (a: any) => [number, number, number];
    readonly twozero_ar: (a: any) => [number, number, number];
    readonly twozero_kr: (a: any) => [number, number, number];
    readonly varsaw_ar: (a: any) => [number, number, number];
    readonly varsaw_kr: (a: any) => [number, number, number];
    readonly vdiskin_ar: (a: any) => [number, number, number];
    readonly vibrato_ar: (a: any) => [number, number, number];
    readonly vibrato_kr: (a: any) => [number, number, number];
    readonly vosc3_ar: (a: any) => [number, number, number];
    readonly vosc3_kr: (a: any) => [number, number, number];
    readonly vosc_ar: (a: any) => [number, number, number];
    readonly vosc_kr: (a: any) => [number, number, number];
    readonly warp1_ar: (a: any) => [number, number, number];
    readonly whitenoise_ar: (a: any) => [number, number, number];
    readonly whitenoise_kr: (a: any) => [number, number, number];
    readonly wrap_ar: (a: any) => [number, number, number];
    readonly wrap_kr: (a: any) => [number, number, number];
    readonly wrapindex_ar: (a: any) => [number, number, number];
    readonly wrapindex_kr: (a: any) => [number, number, number];
    readonly xfade2_ar: (a: any) => [number, number, number];
    readonly xfade2_kr: (a: any) => [number, number, number];
    readonly xline_ar: (a: any) => [number, number, number];
    readonly xline_kr: (a: any) => [number, number, number];
    readonly xout_ar: (a: any) => [number, number, number];
    readonly xout_kr: (a: any) => [number, number, number];
    readonly zerocrossing_ar: (a: any) => [number, number, number];
    readonly zerocrossing_kr: (a: any) => [number, number, number];
    readonly __wbg_synthdef_free: (a: number, b: number) => void;
    readonly binaryOpIndex: (a: number, b: number) => number;
    readonly buildEnvRun: (a: number, b: number, c: any, d: any, e: number, f: number) => [number, number, number];
    readonly encodeEnvRun: (a: number, b: number, c: number, d: number, e: any, f: number, g: number) => [number, number, number];
    readonly parseScgf: (a: number, b: number) => [number, number, number];
    readonly synthdef_addControl: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly synthdef_addControlArray: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly synthdef_addUgen: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number, number];
    readonly synthdef_new: (a: number, b: number, c: number) => [number, number, number];
    readonly synthdef_nodeRate: (a: number, b: number) => [number, number];
    readonly synthdef_toBytes: (a: number) => [number, number, number, number];
    readonly synthdef_toJson: (a: number) => [number, number, number];
    readonly unaryOpIndex: (a: number, b: number) => number;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
