// @generated — DO NOT EDIT. Regenerate with scripts/generate_ugens_wasm.mjs
//
// The typed UGen builder surface over wasm: one function per builder ×
// rate, delegating to the crate's typed builders (registry defaults come
// from the builders' factory seeds). Signatures are declared precisely in
// the typescript_custom_section at the bottom (every function here is
// skip_typescript).

#![allow(warnings)]

use wasm_bindgen::prelude::*;

use crate::builders;
use crate::wasm::{input_from_js, input_to_js, WasmSynthDef};

fn opt(args: &JsValue, key: &str) -> Option<JsValue> {
    if args.is_undefined() || args.is_null() {
        return None;
    }
    let v = js_sys::Reflect::get(args, &JsValue::from_str(key)).ok()?;
    if v.is_undefined() {
        None
    } else {
        Some(v)
    }
}

fn inputs_from_js(v: &JsValue) -> Result<Vec<crate::UGenInput>, JsError> {
    js_sys::Array::from(v)
        .iter()
        .map(|x| input_from_js(&x))
        .collect()
}

#[wasm_bindgen(js_name = "a2KKr", skip_typescript)]
pub fn a2_k_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::A2K::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "allpassCAr", skip_typescript)]
pub fn allpass_c_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::AllpassC::ar();
    if let Some(v) = opt(&args, "maxDelayTime") {
        b = b.max_delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "allpassCKr", skip_typescript)]
pub fn allpass_c_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::AllpassC::kr();
    if let Some(v) = opt(&args, "maxDelayTime") {
        b = b.max_delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "allpassLAr", skip_typescript)]
pub fn allpass_l_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::AllpassL::ar();
    if let Some(v) = opt(&args, "maxDelayTime") {
        b = b.max_delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "allpassLKr", skip_typescript)]
pub fn allpass_l_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::AllpassL::kr();
    if let Some(v) = opt(&args, "maxDelayTime") {
        b = b.max_delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "allpassNAr", skip_typescript)]
pub fn allpass_n_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::AllpassN::ar();
    if let Some(v) = opt(&args, "maxDelayTime") {
        b = b.max_delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "allpassNKr", skip_typescript)]
pub fn allpass_n_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::AllpassN::kr();
    if let Some(v) = opt(&args, "maxDelayTime") {
        b = b.max_delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "ampCompIr", skip_typescript)]
pub fn amp_comp_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::AmpComp::ir();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "root") {
        b = b.root(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "exp") {
        b = b.exp(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "ampCompAr", skip_typescript)]
pub fn amp_comp_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::AmpComp::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "root") {
        b = b.root(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "exp") {
        b = b.exp(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "ampCompKr", skip_typescript)]
pub fn amp_comp_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::AmpComp::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "root") {
        b = b.root(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "exp") {
        b = b.exp(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "ampCompAIr", skip_typescript)]
pub fn amp_comp_a_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::AmpCompA::ir();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "root") {
        b = b.root(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "minAmp") {
        b = b.min_amp(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rootAmp") {
        b = b.root_amp(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "ampCompAAr", skip_typescript)]
pub fn amp_comp_a_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::AmpCompA::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "root") {
        b = b.root(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "minAmp") {
        b = b.min_amp(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rootAmp") {
        b = b.root_amp(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "ampCompAKr", skip_typescript)]
pub fn amp_comp_a_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::AmpCompA::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "root") {
        b = b.root(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "minAmp") {
        b = b.min_amp(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rootAmp") {
        b = b.root_amp(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "amplitudeAr", skip_typescript)]
pub fn amplitude_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Amplitude::ar();
    if let Some(v) = opt(&args, "attackTime") {
        b = b.attack_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "releaseTime") {
        b = b.release_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "amplitudeKr", skip_typescript)]
pub fn amplitude_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Amplitude::kr();
    if let Some(v) = opt(&args, "attackTime") {
        b = b.attack_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "releaseTime") {
        b = b.release_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "apfAr", skip_typescript)]
pub fn apf_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::APF::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "radius") {
        b = b.radius(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "apfKr", skip_typescript)]
pub fn apf_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::APF::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "radius") {
        b = b.radius(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "balance2Ar", skip_typescript)]
pub fn balance2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Balance2::ar();
    if let Some(v) = opt(&args, "left") {
        b = b.left(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "right") {
        b = b.right(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "pos") {
        b = b.pos(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "balance2Kr", skip_typescript)]
pub fn balance2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Balance2::kr();
    if let Some(v) = opt(&args, "left") {
        b = b.left(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "right") {
        b = b.right(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "pos") {
        b = b.pos(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "ballAr", skip_typescript)]
pub fn ball_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Ball::ar();
    if let Some(v) = opt(&args, "g") {
        b = b.g(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "damp") {
        b = b.damp(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "friction") {
        b = b.friction(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "ballKr", skip_typescript)]
pub fn ball_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Ball::kr();
    if let Some(v) = opt(&args, "g") {
        b = b.g(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "damp") {
        b = b.damp(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "friction") {
        b = b.friction(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bAllPassAr", skip_typescript)]
pub fn b_all_pass_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BAllPass::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rq") {
        b = b.rq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bBandPassAr", skip_typescript)]
pub fn b_band_pass_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BBandPass::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bw") {
        b = b.bw(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bBandStopAr", skip_typescript)]
pub fn b_band_stop_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BBandStop::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bw") {
        b = b.bw(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "beatTrackKr", skip_typescript)]
pub fn beat_track_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BeatTrack::kr();
    if let Some(v) = opt(&args, "chain") {
        b = b.chain(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "lock") {
        b = b.lock(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "beatTrack2Kr", skip_typescript)]
pub fn beat_track2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BeatTrack2::kr();
    if let Some(v) = opt(&args, "busindex") {
        b = b.busindex(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numfeatures") {
        b = b.numfeatures(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "windowsize") {
        b = b.windowsize(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "phaseaccuracy") {
        b = b.phaseaccuracy(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "lock") {
        b = b.lock(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "weightingscheme") {
        b = b.weightingscheme(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bHiPassAr", skip_typescript)]
pub fn b_hi_pass_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BHiPass::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rq") {
        b = b.rq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bHiShelfAr", skip_typescript)]
pub fn b_hi_shelf_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BHiShelf::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rs") {
        b = b.rs(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "db") {
        b = b.db(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "biPanB2Ar", skip_typescript)]
pub fn bi_pan_b2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BiPanB2::ar();
    if let Some(v) = opt(&args, "inA") {
        b = b.in_a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "inB") {
        b = b.in_b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "azimuth") {
        b = b.azimuth(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "gain") {
        b = b.gain(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "biPanB2Kr", skip_typescript)]
pub fn bi_pan_b2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BiPanB2::kr();
    if let Some(v) = opt(&args, "inA") {
        b = b.in_a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "inB") {
        b = b.in_b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "azimuth") {
        b = b.azimuth(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "gain") {
        b = b.gain(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "blipAr", skip_typescript)]
pub fn blip_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Blip::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numharm") {
        b = b.numharm(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "blipKr", skip_typescript)]
pub fn blip_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Blip::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numharm") {
        b = b.numharm(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bLowPassAr", skip_typescript)]
pub fn b_low_pass_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BLowPass::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rq") {
        b = b.rq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bLowShelfAr", skip_typescript)]
pub fn b_low_shelf_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BLowShelf::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rs") {
        b = b.rs(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "db") {
        b = b.db(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bPeakEqAr", skip_typescript)]
pub fn b_peak_eq_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BPeakEQ::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rq") {
        b = b.rq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "db") {
        b = b.db(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bpfAr", skip_typescript)]
pub fn bpf_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BPF::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rq") {
        b = b.rq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bpfKr", skip_typescript)]
pub fn bpf_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BPF::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rq") {
        b = b.rq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bpz2Ar", skip_typescript)]
pub fn bpz2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BPZ2::ar();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bpz2Kr", skip_typescript)]
pub fn bpz2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BPZ2::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "brfAr", skip_typescript)]
pub fn brf_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BRF::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rq") {
        b = b.rq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "brfKr", skip_typescript)]
pub fn brf_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BRF::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rq") {
        b = b.rq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "brownNoiseAr", skip_typescript)]
pub fn brown_noise_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BrownNoise::ar();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "brownNoiseKr", skip_typescript)]
pub fn brown_noise_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BrownNoise::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "brz2Ar", skip_typescript)]
pub fn brz2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BRZ2::ar();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "brz2Kr", skip_typescript)]
pub fn brz2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BRZ2::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufAllpassCAr", skip_typescript)]
pub fn buf_allpass_c_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufAllpassC::ar();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufAllpassLAr", skip_typescript)]
pub fn buf_allpass_l_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufAllpassL::ar();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufAllpassNAr", skip_typescript)]
pub fn buf_allpass_n_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufAllpassN::ar();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufChannelsKr", skip_typescript)]
pub fn buf_channels_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufChannels::kr();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufChannelsIr", skip_typescript)]
pub fn buf_channels_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufChannels::ir();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufCombCAr", skip_typescript)]
pub fn buf_comb_c_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufCombC::ar();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufCombLAr", skip_typescript)]
pub fn buf_comb_l_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufCombL::ar();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufCombNAr", skip_typescript)]
pub fn buf_comb_n_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufCombN::ar();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufDelayCAr", skip_typescript)]
pub fn buf_delay_c_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufDelayC::ar();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufDelayCKr", skip_typescript)]
pub fn buf_delay_c_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufDelayC::kr();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufDelayLAr", skip_typescript)]
pub fn buf_delay_l_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufDelayL::ar();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufDelayLKr", skip_typescript)]
pub fn buf_delay_l_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufDelayL::kr();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufDelayNAr", skip_typescript)]
pub fn buf_delay_n_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufDelayN::ar();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufDelayNKr", skip_typescript)]
pub fn buf_delay_n_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufDelayN::kr();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufDurKr", skip_typescript)]
pub fn buf_dur_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufDur::kr();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufDurIr", skip_typescript)]
pub fn buf_dur_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufDur::ir();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufFramesKr", skip_typescript)]
pub fn buf_frames_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufFrames::kr();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufFramesIr", skip_typescript)]
pub fn buf_frames_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufFrames::ir();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufRateScaleKr", skip_typescript)]
pub fn buf_rate_scale_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufRateScale::kr();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufRateScaleIr", skip_typescript)]
pub fn buf_rate_scale_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufRateScale::ir();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufRdAr", skip_typescript)]
pub fn buf_rd_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufRd::ar();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "phase") {
        b = b.phase(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "interpolation") {
        b = b.interpolation(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufRdKr", skip_typescript)]
pub fn buf_rd_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufRd::kr();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "phase") {
        b = b.phase(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "interpolation") {
        b = b.interpolation(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufSampleRateKr", skip_typescript)]
pub fn buf_sample_rate_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufSampleRate::kr();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufSampleRateIr", skip_typescript)]
pub fn buf_sample_rate_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufSampleRate::ir();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufSamplesKr", skip_typescript)]
pub fn buf_samples_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufSamples::kr();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufSamplesIr", skip_typescript)]
pub fn buf_samples_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufSamples::ir();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufWrAr", skip_typescript)]
pub fn buf_wr_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufWr::ar();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "phase") {
        b = b.phase(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "inputArray") {
        b = b.input_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "bufWrKr", skip_typescript)]
pub fn buf_wr_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::BufWr::kr();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "phase") {
        b = b.phase(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "inputArray") {
        b = b.input_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "checkBadValuesKr", skip_typescript)]
pub fn check_bad_values_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::CheckBadValues::kr();
    if let Some(v) = opt(&args, "id") {
        b = b.id(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "post") {
        b = b.post(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "checkBadValuesAr", skip_typescript)]
pub fn check_bad_values_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::CheckBadValues::ar();
    if let Some(v) = opt(&args, "id") {
        b = b.id(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "post") {
        b = b.post(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "clearBufIr", skip_typescript)]
pub fn clear_buf_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::ClearBuf::ir();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "clipAr", skip_typescript)]
pub fn clip_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Clip::ar();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "clipKr", skip_typescript)]
pub fn clip_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Clip::kr();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "clipNoiseAr", skip_typescript)]
pub fn clip_noise_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::ClipNoise::ar();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "clipNoiseKr", skip_typescript)]
pub fn clip_noise_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::ClipNoise::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "coinGateKr", skip_typescript)]
pub fn coin_gate_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::CoinGate::kr();
    if let Some(v) = opt(&args, "prob") {
        b = b.prob(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "coinGateAr", skip_typescript)]
pub fn coin_gate_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::CoinGate::ar();
    if let Some(v) = opt(&args, "prob") {
        b = b.prob(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "combCAr", skip_typescript)]
pub fn comb_c_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::CombC::ar();
    if let Some(v) = opt(&args, "maxDelayTime") {
        b = b.max_delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "combCKr", skip_typescript)]
pub fn comb_c_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::CombC::kr();
    if let Some(v) = opt(&args, "maxDelayTime") {
        b = b.max_delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "combLAr", skip_typescript)]
pub fn comb_l_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::CombL::ar();
    if let Some(v) = opt(&args, "maxDelayTime") {
        b = b.max_delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "combLKr", skip_typescript)]
pub fn comb_l_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::CombL::kr();
    if let Some(v) = opt(&args, "maxDelayTime") {
        b = b.max_delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "combNAr", skip_typescript)]
pub fn comb_n_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::CombN::ar();
    if let Some(v) = opt(&args, "maxDelayTime") {
        b = b.max_delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "combNKr", skip_typescript)]
pub fn comb_n_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::CombN::kr();
    if let Some(v) = opt(&args, "maxDelayTime") {
        b = b.max_delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "companderAr", skip_typescript)]
pub fn compander_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Compander::ar();
    if let Some(v) = opt(&args, "control") {
        b = b.control(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "thresh") {
        b = b.thresh(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "slopeBelow") {
        b = b.slope_below(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "slopeAbove") {
        b = b.slope_above(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "clampTime") {
        b = b.clamp_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "relaxTime") {
        b = b.relax_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "controlDurIr", skip_typescript)]
pub fn control_dur_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::ControlDur::ir();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "controlRateIr", skip_typescript)]
pub fn control_rate_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::ControlRate::ir();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "convolutionAr", skip_typescript)]
pub fn convolution_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Convolution::ar();
    if let Some(v) = opt(&args, "kernel") {
        b = b.kernel(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "framesize") {
        b = b.framesize(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "convolution2Ar", skip_typescript)]
pub fn convolution2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Convolution2::ar();
    if let Some(v) = opt(&args, "kernel") {
        b = b.kernel(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trigger") {
        b = b.trigger(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "framesize") {
        b = b.framesize(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "convolution2LAr", skip_typescript)]
pub fn convolution2_l_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Convolution2L::ar();
    if let Some(v) = opt(&args, "kernel") {
        b = b.kernel(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trigger") {
        b = b.trigger(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "framesize") {
        b = b.framesize(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "crossfade") {
        b = b.crossfade(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "convolution3Ar", skip_typescript)]
pub fn convolution3_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Convolution3::ar();
    if let Some(v) = opt(&args, "kernel") {
        b = b.kernel(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trigger") {
        b = b.trigger(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "framesize") {
        b = b.framesize(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "convolution3Kr", skip_typescript)]
pub fn convolution3_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Convolution3::kr();
    if let Some(v) = opt(&args, "kernel") {
        b = b.kernel(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trigger") {
        b = b.trigger(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "framesize") {
        b = b.framesize(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "cOscAr", skip_typescript)]
pub fn c_osc_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::COsc::ar();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "beats") {
        b = b.beats(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "cOscKr", skip_typescript)]
pub fn c_osc_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::COsc::kr();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "beats") {
        b = b.beats(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "crackleAr", skip_typescript)]
pub fn crackle_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Crackle::ar();
    if let Some(v) = opt(&args, "chaosParam") {
        b = b.chaos_param(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "crackleKr", skip_typescript)]
pub fn crackle_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Crackle::kr();
    if let Some(v) = opt(&args, "chaosParam") {
        b = b.chaos_param(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "cuspLAr", skip_typescript)]
pub fn cusp_l_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::CuspL::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b") {
        b = b.b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xi") {
        b = b.xi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "cuspNAr", skip_typescript)]
pub fn cusp_n_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::CuspN::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b") {
        b = b.b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xi") {
        b = b.xi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "dcAr", skip_typescript)]
pub fn dc_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DC::ar();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "dcKr", skip_typescript)]
pub fn dc_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DC::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "decayAr", skip_typescript)]
pub fn decay_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Decay::ar();
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "decayKr", skip_typescript)]
pub fn decay_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Decay::kr();
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "decay2Ar", skip_typescript)]
pub fn decay2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Decay2::ar();
    if let Some(v) = opt(&args, "attackTime") {
        b = b.attack_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "decay2Kr", skip_typescript)]
pub fn decay2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Decay2::kr();
    if let Some(v) = opt(&args, "attackTime") {
        b = b.attack_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "decodeB2Ar", skip_typescript)]
pub fn decode_b2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DecodeB2::ar();
    if let Some(v) = opt(&args, "w") {
        b = b.w(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "x") {
        b = b.x(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "y") {
        b = b.y(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "orientation") {
        b = b.orientation(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "decodeB2Kr", skip_typescript)]
pub fn decode_b2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DecodeB2::kr();
    if let Some(v) = opt(&args, "w") {
        b = b.w(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "x") {
        b = b.x(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "y") {
        b = b.y(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "orientation") {
        b = b.orientation(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "degreeToKeyAr", skip_typescript)]
pub fn degree_to_key_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DegreeToKey::ar();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "octave") {
        b = b.octave(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "degreeToKeyKr", skip_typescript)]
pub fn degree_to_key_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DegreeToKey::kr();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "octave") {
        b = b.octave(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "delay1Ar", skip_typescript)]
pub fn delay1_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Delay1::ar();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "delay1Kr", skip_typescript)]
pub fn delay1_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Delay1::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "delay2Ar", skip_typescript)]
pub fn delay2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Delay2::ar();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "delay2Kr", skip_typescript)]
pub fn delay2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Delay2::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "delayCAr", skip_typescript)]
pub fn delay_c_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DelayC::ar();
    if let Some(v) = opt(&args, "maxDelayTime") {
        b = b.max_delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "delayCKr", skip_typescript)]
pub fn delay_c_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DelayC::kr();
    if let Some(v) = opt(&args, "maxDelayTime") {
        b = b.max_delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "delayLAr", skip_typescript)]
pub fn delay_l_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DelayL::ar();
    if let Some(v) = opt(&args, "maxDelayTime") {
        b = b.max_delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "delayLKr", skip_typescript)]
pub fn delay_l_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DelayL::kr();
    if let Some(v) = opt(&args, "maxDelayTime") {
        b = b.max_delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "delayNAr", skip_typescript)]
pub fn delay_n_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DelayN::ar();
    if let Some(v) = opt(&args, "maxDelayTime") {
        b = b.max_delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "delayNKr", skip_typescript)]
pub fn delay_n_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DelayN::kr();
    if let Some(v) = opt(&args, "maxDelayTime") {
        b = b.max_delay_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delayTime") {
        b = b.delay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "delTapRdAr", skip_typescript)]
pub fn del_tap_rd_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DelTapRd::ar();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "phase") {
        b = b.phase(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delay") {
        b = b.delay(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "interp") {
        b = b.interp(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "delTapRdKr", skip_typescript)]
pub fn del_tap_rd_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DelTapRd::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "phase") {
        b = b.phase(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delay") {
        b = b.delay(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "interp") {
        b = b.interp(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "delTapWrAr", skip_typescript)]
pub fn del_tap_wr_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DelTapWr::ar();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "delTapWrKr", skip_typescript)]
pub fn del_tap_wr_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DelTapWr::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "demandAr", skip_typescript)]
pub fn demand_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Demand::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "reset") {
        b = b.reset(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "demandUgens") {
        b = b.demand_ugens(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "demandKr", skip_typescript)]
pub fn demand_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Demand::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "reset") {
        b = b.reset(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "demandUgens") {
        b = b.demand_ugens(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "demandEnvGenAr", skip_typescript)]
pub fn demand_env_gen_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DemandEnvGen::ar();
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "shape") {
        b = b.shape(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "curve") {
        b = b.curve(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "gate") {
        b = b.gate(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "reset") {
        b = b.reset(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "levelScale") {
        b = b.level_scale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "levelBias") {
        b = b.level_bias(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "timeScale") {
        b = b.time_scale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "demandEnvGenKr", skip_typescript)]
pub fn demand_env_gen_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DemandEnvGen::kr();
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "shape") {
        b = b.shape(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "curve") {
        b = b.curve(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "gate") {
        b = b.gate(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "reset") {
        b = b.reset(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "levelScale") {
        b = b.level_scale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "levelBias") {
        b = b.level_bias(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "timeScale") {
        b = b.time_scale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "detectIndexKr", skip_typescript)]
pub fn detect_index_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DetectIndex::kr();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "detectIndexAr", skip_typescript)]
pub fn detect_index_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DetectIndex::ar();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "detectSilenceAr", skip_typescript)]
pub fn detect_silence_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DetectSilence::ar();
    if let Some(v) = opt(&args, "amp") {
        b = b.amp(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "time") {
        b = b.time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "detectSilenceKr", skip_typescript)]
pub fn detect_silence_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DetectSilence::kr();
    if let Some(v) = opt(&args, "amp") {
        b = b.amp(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "time") {
        b = b.time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "diskInAr", skip_typescript)]
pub fn disk_in_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DiskIn::ar();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "diskOutAr", skip_typescript)]
pub fn disk_out_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::DiskOut::ar();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "channelsArray") {
        b = b.channels_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "doneKr", skip_typescript)]
pub fn done_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Done::kr();
    if let Some(v) = opt(&args, "src") {
        b = b.src(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "dustAr", skip_typescript)]
pub fn dust_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Dust::ar();
    if let Some(v) = opt(&args, "density") {
        b = b.density(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "dustKr", skip_typescript)]
pub fn dust_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Dust::kr();
    if let Some(v) = opt(&args, "density") {
        b = b.density(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "dust2Ar", skip_typescript)]
pub fn dust2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Dust2::ar();
    if let Some(v) = opt(&args, "density") {
        b = b.density(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "dust2Kr", skip_typescript)]
pub fn dust2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Dust2::kr();
    if let Some(v) = opt(&args, "density") {
        b = b.density(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "dutyAr", skip_typescript)]
pub fn duty_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Duty::ar();
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "reset") {
        b = b.reset(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "dutyKr", skip_typescript)]
pub fn duty_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Duty::kr();
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "reset") {
        b = b.reset(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "envGenAr", skip_typescript)]
pub fn env_gen_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::EnvGen::ar();
    if let Some(v) = opt(&args, "envelope") {
        b = b.envelope(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "gate") {
        b = b.gate(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "levelScale") {
        b = b.level_scale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "levelBias") {
        b = b.level_bias(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "timeScale") {
        b = b.time_scale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "envGenKr", skip_typescript)]
pub fn env_gen_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::EnvGen::kr();
    if let Some(v) = opt(&args, "envelope") {
        b = b.envelope(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "gate") {
        b = b.gate(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "levelScale") {
        b = b.level_scale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "levelBias") {
        b = b.level_bias(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "timeScale") {
        b = b.time_scale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "expRandIr", skip_typescript)]
pub fn exp_rand_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::ExpRand::ir();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "fbSineCAr", skip_typescript)]
pub fn fb_sine_c_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::FBSineC::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "im") {
        b = b.im(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "fb") {
        b = b.fb(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "c") {
        b = b.c(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xi") {
        b = b.xi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "yi") {
        b = b.yi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "fbSineLAr", skip_typescript)]
pub fn fb_sine_l_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::FBSineL::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "im") {
        b = b.im(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "fb") {
        b = b.fb(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "c") {
        b = b.c(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xi") {
        b = b.xi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "yi") {
        b = b.yi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "fbSineNAr", skip_typescript)]
pub fn fb_sine_n_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::FBSineN::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "im") {
        b = b.im(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "fb") {
        b = b.fb(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "c") {
        b = b.c(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xi") {
        b = b.xi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "yi") {
        b = b.yi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "fftKr", skip_typescript)]
pub fn fft_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::FFT::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hop") {
        b = b.hop(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "wintype") {
        b = b.wintype(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "active") {
        b = b.active(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "winsize") {
        b = b.winsize(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "fftTriggerKr", skip_typescript)]
pub fn fft_trigger_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::FFTTrigger::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hop") {
        b = b.hop(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "polar") {
        b = b.polar(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "foldAr", skip_typescript)]
pub fn fold_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Fold::ar();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "foldKr", skip_typescript)]
pub fn fold_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Fold::kr();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "formantAr", skip_typescript)]
pub fn formant_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Formant::ar();
    if let Some(v) = opt(&args, "fundfreq") {
        b = b.fundfreq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "formfreq") {
        b = b.formfreq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bwfreq") {
        b = b.bwfreq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "formletAr", skip_typescript)]
pub fn formlet_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Formlet::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "attackTime") {
        b = b.attack_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "formletKr", skip_typescript)]
pub fn formlet_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Formlet::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "attackTime") {
        b = b.attack_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "fosAr", skip_typescript)]
pub fn fos_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::FOS::ar();
    if let Some(v) = opt(&args, "a0") {
        b = b.a0(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a1") {
        b = b.a1(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b1") {
        b = b.b1(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "fosKr", skip_typescript)]
pub fn fos_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::FOS::kr();
    if let Some(v) = opt(&args, "a0") {
        b = b.a0(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a1") {
        b = b.a1(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b1") {
        b = b.b1(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "freeKr", skip_typescript)]
pub fn free_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Free::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "id") {
        b = b.id(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "freeSelfKr", skip_typescript)]
pub fn free_self_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::FreeSelf::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "freeSelfWhenDoneKr", skip_typescript)]
pub fn free_self_when_done_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::FreeSelfWhenDone::kr();
    if let Some(v) = opt(&args, "src") {
        b = b.src(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "freeVerbAr", skip_typescript)]
pub fn free_verb_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::FreeVerb::ar();
    if let Some(v) = opt(&args, "mix") {
        b = b.mix(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "room") {
        b = b.room(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "damp") {
        b = b.damp(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "freeVerb2Ar", skip_typescript)]
pub fn free_verb2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::FreeVerb2::ar();
    if let Some(v) = opt(&args, "in2") {
        b = b.in2(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "mix") {
        b = b.mix(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "room") {
        b = b.room(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "damp") {
        b = b.damp(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "freqShiftAr", skip_typescript)]
pub fn freq_shift_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::FreqShift::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "phase") {
        b = b.phase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "fSinOscAr", skip_typescript)]
pub fn f_sin_osc_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::FSinOsc::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "iphase") {
        b = b.iphase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "fSinOscKr", skip_typescript)]
pub fn f_sin_osc_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::FSinOsc::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "iphase") {
        b = b.iphase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "gateAr", skip_typescript)]
pub fn gate_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Gate::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "gateKr", skip_typescript)]
pub fn gate_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Gate::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "gbmanLAr", skip_typescript)]
pub fn gbman_l_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::GbmanL::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xi") {
        b = b.xi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "yi") {
        b = b.yi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "gbmanNAr", skip_typescript)]
pub fn gbman_n_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::GbmanN::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xi") {
        b = b.xi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "yi") {
        b = b.yi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "gendy1Ar", skip_typescript)]
pub fn gendy1_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Gendy1::ar();
    if let Some(v) = opt(&args, "ampdist") {
        b = b.ampdist(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "durdist") {
        b = b.durdist(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "adparam") {
        b = b.adparam(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "ddparam") {
        b = b.ddparam(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "minfreq") {
        b = b.minfreq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "maxfreq") {
        b = b.maxfreq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "ampscale") {
        b = b.ampscale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "durscale") {
        b = b.durscale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "initCps") {
        b = b.init_cps(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "knum") {
        b = b.knum(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "gendy1Kr", skip_typescript)]
pub fn gendy1_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Gendy1::kr();
    if let Some(v) = opt(&args, "ampdist") {
        b = b.ampdist(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "durdist") {
        b = b.durdist(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "adparam") {
        b = b.adparam(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "ddparam") {
        b = b.ddparam(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "minfreq") {
        b = b.minfreq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "maxfreq") {
        b = b.maxfreq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "ampscale") {
        b = b.ampscale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "durscale") {
        b = b.durscale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "initCps") {
        b = b.init_cps(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "knum") {
        b = b.knum(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "gendy2Ar", skip_typescript)]
pub fn gendy2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Gendy2::ar();
    if let Some(v) = opt(&args, "ampdist") {
        b = b.ampdist(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "durdist") {
        b = b.durdist(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "adparam") {
        b = b.adparam(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "ddparam") {
        b = b.ddparam(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "minfreq") {
        b = b.minfreq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "maxfreq") {
        b = b.maxfreq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "ampscale") {
        b = b.ampscale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "durscale") {
        b = b.durscale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "initCps") {
        b = b.init_cps(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "knum") {
        b = b.knum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "c") {
        b = b.c(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "gendy2Kr", skip_typescript)]
pub fn gendy2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Gendy2::kr();
    if let Some(v) = opt(&args, "ampdist") {
        b = b.ampdist(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "durdist") {
        b = b.durdist(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "adparam") {
        b = b.adparam(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "ddparam") {
        b = b.ddparam(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "minfreq") {
        b = b.minfreq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "maxfreq") {
        b = b.maxfreq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "ampscale") {
        b = b.ampscale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "durscale") {
        b = b.durscale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "initCps") {
        b = b.init_cps(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "knum") {
        b = b.knum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "c") {
        b = b.c(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "gendy3Ar", skip_typescript)]
pub fn gendy3_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Gendy3::ar();
    if let Some(v) = opt(&args, "ampdist") {
        b = b.ampdist(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "durdist") {
        b = b.durdist(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "adparam") {
        b = b.adparam(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "ddparam") {
        b = b.ddparam(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "ampscale") {
        b = b.ampscale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "durscale") {
        b = b.durscale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "initCps") {
        b = b.init_cps(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "knum") {
        b = b.knum(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "gendy3Kr", skip_typescript)]
pub fn gendy3_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Gendy3::kr();
    if let Some(v) = opt(&args, "ampdist") {
        b = b.ampdist(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "durdist") {
        b = b.durdist(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "adparam") {
        b = b.adparam(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "ddparam") {
        b = b.ddparam(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "ampscale") {
        b = b.ampscale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "durscale") {
        b = b.durscale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "initCps") {
        b = b.init_cps(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "knum") {
        b = b.knum(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "grainBufAr", skip_typescript)]
pub fn grain_buf_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::GrainBuf::ar();
    if let Some(v) = opt(&args, "trigger") {
        b = b.trigger(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "sndbuf") {
        b = b.sndbuf(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rate") {
        b = b.rate(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "pos") {
        b = b.pos(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "interp") {
        b = b.interp(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "pan") {
        b = b.pan(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "envbufnum") {
        b = b.envbufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "maxGrains") {
        b = b.max_grains(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "grainFmAr", skip_typescript)]
pub fn grain_fm_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::GrainFM::ar();
    if let Some(v) = opt(&args, "trigger") {
        b = b.trigger(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "carFreq") {
        b = b.car_freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "modFreq") {
        b = b.mod_freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "index") {
        b = b.index(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "pan") {
        b = b.pan(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "envbufnum") {
        b = b.envbufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "maxGrains") {
        b = b.max_grains(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "grainInAr", skip_typescript)]
pub fn grain_in_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::GrainIn::ar();
    if let Some(v) = opt(&args, "trigger") {
        b = b.trigger(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "pan") {
        b = b.pan(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "envbufnum") {
        b = b.envbufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "maxGrains") {
        b = b.max_grains(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "grainSinAr", skip_typescript)]
pub fn grain_sin_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::GrainSin::ar();
    if let Some(v) = opt(&args, "trigger") {
        b = b.trigger(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "pan") {
        b = b.pan(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "envbufnum") {
        b = b.envbufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "maxGrains") {
        b = b.max_grains(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "grayNoiseAr", skip_typescript)]
pub fn gray_noise_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::GrayNoise::ar();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "grayNoiseKr", skip_typescript)]
pub fn gray_noise_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::GrayNoise::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "gVerbAr", skip_typescript)]
pub fn g_verb_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::GVerb::ar();
    if let Some(v) = opt(&args, "roomsize") {
        b = b.roomsize(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "revtime") {
        b = b.revtime(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "damping") {
        b = b.damping(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "inputbw") {
        b = b.inputbw(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "spread") {
        b = b.spread(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "drylevel") {
        b = b.drylevel(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "earlyreflevel") {
        b = b.earlyreflevel(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "taillevel") {
        b = b.taillevel(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "maxroomsize") {
        b = b.maxroomsize(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "hasherAr", skip_typescript)]
pub fn hasher_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Hasher::ar();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "hasherKr", skip_typescript)]
pub fn hasher_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Hasher::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "henonCAr", skip_typescript)]
pub fn henon_c_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::HenonC::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b") {
        b = b.b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "x0") {
        b = b.x0(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "x1") {
        b = b.x1(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "henonLAr", skip_typescript)]
pub fn henon_l_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::HenonL::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b") {
        b = b.b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "x0") {
        b = b.x0(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "x1") {
        b = b.x1(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "henonNAr", skip_typescript)]
pub fn henon_n_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::HenonN::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b") {
        b = b.b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "x0") {
        b = b.x0(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "x1") {
        b = b.x1(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "hilbertAr", skip_typescript)]
pub fn hilbert_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Hilbert::ar();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "hpfAr", skip_typescript)]
pub fn hpf_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::HPF::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "hpfKr", skip_typescript)]
pub fn hpf_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::HPF::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "hpz1Ar", skip_typescript)]
pub fn hpz1_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::HPZ1::ar();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "hpz1Kr", skip_typescript)]
pub fn hpz1_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::HPZ1::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "hpz2Ar", skip_typescript)]
pub fn hpz2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::HPZ2::ar();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "hpz2Kr", skip_typescript)]
pub fn hpz2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::HPZ2::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "iEnvGenAr", skip_typescript)]
pub fn i_env_gen_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::IEnvGen::ar();
    if let Some(v) = opt(&args, "ienvelope") {
        b = b.ienvelope(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "index") {
        b = b.index(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "iEnvGenKr", skip_typescript)]
pub fn i_env_gen_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::IEnvGen::kr();
    if let Some(v) = opt(&args, "ienvelope") {
        b = b.ienvelope(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "index") {
        b = b.index(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "ifftAr", skip_typescript)]
pub fn ifft_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::IFFT::ar();
    if let Some(v) = opt(&args, "chain") {
        b = b.chain(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "wintype") {
        b = b.wintype(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "winsize") {
        b = b.winsize(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "ifftKr", skip_typescript)]
pub fn ifft_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::IFFT::kr();
    if let Some(v) = opt(&args, "chain") {
        b = b.chain(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "wintype") {
        b = b.wintype(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "winsize") {
        b = b.winsize(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "impulseAr", skip_typescript)]
pub fn impulse_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Impulse::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "phase") {
        b = b.phase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "impulseKr", skip_typescript)]
pub fn impulse_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Impulse::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "phase") {
        b = b.phase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "inAr", skip_typescript)]
pub fn in_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::In::ar();
    if let Some(v) = opt(&args, "bus") {
        b = b.bus(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "inKr", skip_typescript)]
pub fn in_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::In::kr();
    if let Some(v) = opt(&args, "bus") {
        b = b.bus(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "indexKr", skip_typescript)]
pub fn index_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Index::kr();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "indexAr", skip_typescript)]
pub fn index_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Index::ar();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "indexInBetweenKr", skip_typescript)]
pub fn index_in_between_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::IndexInBetween::kr();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "indexInBetweenAr", skip_typescript)]
pub fn index_in_between_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::IndexInBetween::ar();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "inFeedbackAr", skip_typescript)]
pub fn in_feedback_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::InFeedback::ar();
    if let Some(v) = opt(&args, "bus") {
        b = b.bus(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "inRangeAr", skip_typescript)]
pub fn in_range_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::InRange::ar();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "inRangeKr", skip_typescript)]
pub fn in_range_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::InRange::kr();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "inRangeIr", skip_typescript)]
pub fn in_range_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::InRange::ir();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "inRectAr", skip_typescript)]
pub fn in_rect_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::InRect::ar();
    if let Some(v) = opt(&args, "x") {
        b = b.x(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "y") {
        b = b.y(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "left") {
        b = b.left(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "top") {
        b = b.top(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "right") {
        b = b.right(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bottom") {
        b = b.bottom(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "inRectKr", skip_typescript)]
pub fn in_rect_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::InRect::kr();
    if let Some(v) = opt(&args, "x") {
        b = b.x(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "y") {
        b = b.y(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "left") {
        b = b.left(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "top") {
        b = b.top(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "right") {
        b = b.right(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bottom") {
        b = b.bottom(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "integratorAr", skip_typescript)]
pub fn integrator_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Integrator::ar();
    if let Some(v) = opt(&args, "coef") {
        b = b.coef(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "integratorKr", skip_typescript)]
pub fn integrator_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Integrator::kr();
    if let Some(v) = opt(&args, "coef") {
        b = b.coef(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "inTrigKr", skip_typescript)]
pub fn in_trig_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::InTrig::kr();
    if let Some(v) = opt(&args, "bus") {
        b = b.bus(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "iRandIr", skip_typescript)]
pub fn i_rand_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::IRand::ir();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "k2AAr", skip_typescript)]
pub fn k2_a_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::K2A::ar();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "keyStateKr", skip_typescript)]
pub fn key_state_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::KeyState::kr();
    if let Some(v) = opt(&args, "keycode") {
        b = b.keycode(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "minval") {
        b = b.minval(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "maxval") {
        b = b.maxval(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "lag") {
        b = b.lag(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "keyTrackKr", skip_typescript)]
pub fn key_track_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::KeyTrack::kr();
    if let Some(v) = opt(&args, "chain") {
        b = b.chain(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "keydecay") {
        b = b.keydecay(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "chromaleak") {
        b = b.chromaleak(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "klangAr", skip_typescript)]
pub fn klang_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Klang::ar();
    if let Some(v) = opt(&args, "specs") {
        b = b.specs(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freqscale") {
        b = b.freqscale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freqoffset") {
        b = b.freqoffset(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "klankAr", skip_typescript)]
pub fn klank_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Klank::ar();
    if let Some(v) = opt(&args, "specs") {
        b = b.specs(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "input") {
        b = b.input(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freqscale") {
        b = b.freqscale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freqoffset") {
        b = b.freqoffset(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayscale") {
        b = b.decayscale(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lagAr", skip_typescript)]
pub fn lag_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Lag::ar();
    if let Some(v) = opt(&args, "lagTime") {
        b = b.lag_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lagKr", skip_typescript)]
pub fn lag_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Lag::kr();
    if let Some(v) = opt(&args, "lagTime") {
        b = b.lag_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lag2Ar", skip_typescript)]
pub fn lag2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Lag2::ar();
    if let Some(v) = opt(&args, "lagTime") {
        b = b.lag_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lag2Kr", skip_typescript)]
pub fn lag2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Lag2::kr();
    if let Some(v) = opt(&args, "lagTime") {
        b = b.lag_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lag2UdAr", skip_typescript)]
pub fn lag2_ud_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Lag2UD::ar();
    if let Some(v) = opt(&args, "lagTimeUp") {
        b = b.lag_time_up(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "lagTimeDown") {
        b = b.lag_time_down(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lag2UdKr", skip_typescript)]
pub fn lag2_ud_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Lag2UD::kr();
    if let Some(v) = opt(&args, "lagTimeUp") {
        b = b.lag_time_up(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "lagTimeDown") {
        b = b.lag_time_down(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lag3Ar", skip_typescript)]
pub fn lag3_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Lag3::ar();
    if let Some(v) = opt(&args, "lagTime") {
        b = b.lag_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lag3Kr", skip_typescript)]
pub fn lag3_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Lag3::kr();
    if let Some(v) = opt(&args, "lagTime") {
        b = b.lag_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lag3UdAr", skip_typescript)]
pub fn lag3_ud_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Lag3UD::ar();
    if let Some(v) = opt(&args, "lagTimeUp") {
        b = b.lag_time_up(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "lagTimeDown") {
        b = b.lag_time_down(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lag3UdKr", skip_typescript)]
pub fn lag3_ud_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Lag3UD::kr();
    if let Some(v) = opt(&args, "lagTimeUp") {
        b = b.lag_time_up(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "lagTimeDown") {
        b = b.lag_time_down(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lagInKr", skip_typescript)]
pub fn lag_in_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LagIn::kr();
    if let Some(v) = opt(&args, "bus") {
        b = b.bus(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "lag") {
        b = b.lag(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lagUdAr", skip_typescript)]
pub fn lag_ud_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LagUD::ar();
    if let Some(v) = opt(&args, "lagTimeUp") {
        b = b.lag_time_up(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "lagTimeDown") {
        b = b.lag_time_down(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lagUdKr", skip_typescript)]
pub fn lag_ud_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LagUD::kr();
    if let Some(v) = opt(&args, "lagTimeUp") {
        b = b.lag_time_up(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "lagTimeDown") {
        b = b.lag_time_down(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lastValueAr", skip_typescript)]
pub fn last_value_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LastValue::ar();
    if let Some(v) = opt(&args, "diff") {
        b = b.diff(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lastValueKr", skip_typescript)]
pub fn last_value_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LastValue::kr();
    if let Some(v) = opt(&args, "diff") {
        b = b.diff(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "latchAr", skip_typescript)]
pub fn latch_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Latch::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "latchKr", skip_typescript)]
pub fn latch_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Latch::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "latoocarfianCAr", skip_typescript)]
pub fn latoocarfian_c_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LatoocarfianC::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b") {
        b = b.b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "c") {
        b = b.c(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "d") {
        b = b.d(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xi") {
        b = b.xi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "yi") {
        b = b.yi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "latoocarfianLAr", skip_typescript)]
pub fn latoocarfian_l_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LatoocarfianL::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b") {
        b = b.b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "c") {
        b = b.c(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "d") {
        b = b.d(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xi") {
        b = b.xi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "yi") {
        b = b.yi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "latoocarfianNAr", skip_typescript)]
pub fn latoocarfian_n_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LatoocarfianN::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b") {
        b = b.b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "c") {
        b = b.c(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "d") {
        b = b.d(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xi") {
        b = b.xi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "yi") {
        b = b.yi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "leakDcAr", skip_typescript)]
pub fn leak_dc_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LeakDC::ar();
    if let Some(v) = opt(&args, "coef") {
        b = b.coef(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "leakDcKr", skip_typescript)]
pub fn leak_dc_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LeakDC::kr();
    if let Some(v) = opt(&args, "coef") {
        b = b.coef(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "leastChangeAr", skip_typescript)]
pub fn least_change_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LeastChange::ar();
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b") {
        b = b.b(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "leastChangeKr", skip_typescript)]
pub fn least_change_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LeastChange::kr();
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b") {
        b = b.b(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfClipNoiseAr", skip_typescript)]
pub fn lf_clip_noise_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFClipNoise::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfClipNoiseKr", skip_typescript)]
pub fn lf_clip_noise_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFClipNoise::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfCubAr", skip_typescript)]
pub fn lf_cub_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFCub::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "iphase") {
        b = b.iphase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfCubKr", skip_typescript)]
pub fn lf_cub_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFCub::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "iphase") {
        b = b.iphase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfdClipNoiseAr", skip_typescript)]
pub fn lfd_clip_noise_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFDClipNoise::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfdClipNoiseKr", skip_typescript)]
pub fn lfd_clip_noise_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFDClipNoise::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfdNoise0Ar", skip_typescript)]
pub fn lfd_noise0_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFDNoise0::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfdNoise0Kr", skip_typescript)]
pub fn lfd_noise0_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFDNoise0::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfdNoise1Ar", skip_typescript)]
pub fn lfd_noise1_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFDNoise1::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfdNoise1Kr", skip_typescript)]
pub fn lfd_noise1_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFDNoise1::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfdNoise3Ar", skip_typescript)]
pub fn lfd_noise3_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFDNoise3::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfdNoise3Kr", skip_typescript)]
pub fn lfd_noise3_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFDNoise3::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfGaussAr", skip_typescript)]
pub fn lf_gauss_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFGauss::ar();
    if let Some(v) = opt(&args, "duration") {
        b = b.duration(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "width") {
        b = b.width(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "iphase") {
        b = b.iphase(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfGaussKr", skip_typescript)]
pub fn lf_gauss_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFGauss::kr();
    if let Some(v) = opt(&args, "duration") {
        b = b.duration(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "width") {
        b = b.width(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "iphase") {
        b = b.iphase(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfNoise0Ar", skip_typescript)]
pub fn lf_noise0_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFNoise0::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfNoise0Kr", skip_typescript)]
pub fn lf_noise0_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFNoise0::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfNoise1Ar", skip_typescript)]
pub fn lf_noise1_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFNoise1::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfNoise1Kr", skip_typescript)]
pub fn lf_noise1_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFNoise1::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfNoise2Ar", skip_typescript)]
pub fn lf_noise2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFNoise2::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfNoise2Kr", skip_typescript)]
pub fn lf_noise2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFNoise2::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfParAr", skip_typescript)]
pub fn lf_par_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFPar::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "iphase") {
        b = b.iphase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfParKr", skip_typescript)]
pub fn lf_par_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFPar::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "iphase") {
        b = b.iphase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfPulseAr", skip_typescript)]
pub fn lf_pulse_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFPulse::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "iphase") {
        b = b.iphase(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "width") {
        b = b.width(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfPulseKr", skip_typescript)]
pub fn lf_pulse_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFPulse::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "iphase") {
        b = b.iphase(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "width") {
        b = b.width(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfSawAr", skip_typescript)]
pub fn lf_saw_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFSaw::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "iphase") {
        b = b.iphase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfSawKr", skip_typescript)]
pub fn lf_saw_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFSaw::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "iphase") {
        b = b.iphase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfTriAr", skip_typescript)]
pub fn lf_tri_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFTri::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "iphase") {
        b = b.iphase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lfTriKr", skip_typescript)]
pub fn lf_tri_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LFTri::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "iphase") {
        b = b.iphase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "limiterAr", skip_typescript)]
pub fn limiter_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Limiter::ar();
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "linCongCAr", skip_typescript)]
pub fn lin_cong_c_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LinCongC::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "c") {
        b = b.c(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "m") {
        b = b.m(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xi") {
        b = b.xi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "linCongLAr", skip_typescript)]
pub fn lin_cong_l_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LinCongL::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "c") {
        b = b.c(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "m") {
        b = b.m(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xi") {
        b = b.xi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "linCongNAr", skip_typescript)]
pub fn lin_cong_n_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LinCongN::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "c") {
        b = b.c(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "m") {
        b = b.m(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xi") {
        b = b.xi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lineAr", skip_typescript)]
pub fn line_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Line::ar();
    if let Some(v) = opt(&args, "start") {
        b = b.start(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "end") {
        b = b.end(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lineKr", skip_typescript)]
pub fn line_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Line::kr();
    if let Some(v) = opt(&args, "start") {
        b = b.start(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "end") {
        b = b.end(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "linenKr", skip_typescript)]
pub fn linen_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Linen::kr();
    if let Some(v) = opt(&args, "gate") {
        b = b.gate(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "attackTime") {
        b = b.attack_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "susLevel") {
        b = b.sus_level(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "releaseTime") {
        b = b.release_time(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "linExpAr", skip_typescript)]
pub fn lin_exp_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LinExp::ar();
    if let Some(v) = opt(&args, "srclo") {
        b = b.srclo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "srchi") {
        b = b.srchi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dstlo") {
        b = b.dstlo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dsthi") {
        b = b.dsthi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "linExpKr", skip_typescript)]
pub fn lin_exp_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LinExp::kr();
    if let Some(v) = opt(&args, "srclo") {
        b = b.srclo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "srchi") {
        b = b.srchi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dstlo") {
        b = b.dstlo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dsthi") {
        b = b.dsthi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "linPan2Ar", skip_typescript)]
pub fn lin_pan2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LinPan2::ar();
    if let Some(v) = opt(&args, "pos") {
        b = b.pos(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "linPan2Kr", skip_typescript)]
pub fn lin_pan2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LinPan2::kr();
    if let Some(v) = opt(&args, "pos") {
        b = b.pos(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "linRandIr", skip_typescript)]
pub fn lin_rand_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LinRand::ir();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "minmax") {
        b = b.minmax(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "linXFade2Ar", skip_typescript)]
pub fn lin_x_fade2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LinXFade2::ar();
    if let Some(v) = opt(&args, "inA") {
        b = b.in_a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "inB") {
        b = b.in_b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "pan") {
        b = b.pan(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "linXFade2Kr", skip_typescript)]
pub fn lin_x_fade2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LinXFade2::kr();
    if let Some(v) = opt(&args, "inA") {
        b = b.in_a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "inB") {
        b = b.in_b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "pan") {
        b = b.pan(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "localBufIr", skip_typescript)]
pub fn local_buf_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LocalBuf::ir();
    if let Some(v) = opt(&args, "numFrames") {
        b = b.num_frames(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "localInAr", skip_typescript)]
pub fn local_in_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LocalIn::ar();
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "localInKr", skip_typescript)]
pub fn local_in_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LocalIn::kr();
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "localOutAr", skip_typescript)]
pub fn local_out_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LocalOut::ar();
    if let Some(v) = opt(&args, "channelsArray") {
        b = b.channels_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "localOutKr", skip_typescript)]
pub fn local_out_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LocalOut::kr();
    if let Some(v) = opt(&args, "channelsArray") {
        b = b.channels_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "logisticAr", skip_typescript)]
pub fn logistic_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Logistic::ar();
    if let Some(v) = opt(&args, "chaosParam") {
        b = b.chaos_param(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "init") {
        b = b.init(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "logisticKr", skip_typescript)]
pub fn logistic_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Logistic::kr();
    if let Some(v) = opt(&args, "chaosParam") {
        b = b.chaos_param(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "init") {
        b = b.init(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lorenzLAr", skip_typescript)]
pub fn lorenz_l_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LorenzL::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "s") {
        b = b.s(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "r") {
        b = b.r(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b") {
        b = b.b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "h") {
        b = b.h(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xi") {
        b = b.xi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "yi") {
        b = b.yi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "zi") {
        b = b.zi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "loudnessKr", skip_typescript)]
pub fn loudness_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Loudness::kr();
    if let Some(v) = opt(&args, "chain") {
        b = b.chain(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "smask") {
        b = b.smask(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "tmask") {
        b = b.tmask(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lpfAr", skip_typescript)]
pub fn lpf_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LPF::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lpfKr", skip_typescript)]
pub fn lpf_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LPF::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lpz1Ar", skip_typescript)]
pub fn lpz1_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LPZ1::ar();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lpz1Kr", skip_typescript)]
pub fn lpz1_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LPZ1::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lpz2Ar", skip_typescript)]
pub fn lpz2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LPZ2::ar();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "lpz2Kr", skip_typescript)]
pub fn lpz2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::LPZ2::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "mantissaMaskAr", skip_typescript)]
pub fn mantissa_mask_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::MantissaMask::ar();
    if let Some(v) = opt(&args, "bits") {
        b = b.bits(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "mantissaMaskKr", skip_typescript)]
pub fn mantissa_mask_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::MantissaMask::kr();
    if let Some(v) = opt(&args, "bits") {
        b = b.bits(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "maxLocalBufsIr", skip_typescript)]
pub fn max_local_bufs_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::MaxLocalBufs::ir();
    if let Some(v) = opt(&args, "numLocalBufs") {
        b = b.num_local_bufs(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "medianAr", skip_typescript)]
pub fn median_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Median::ar();
    if let Some(v) = opt(&args, "length") {
        b = b.length(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "medianKr", skip_typescript)]
pub fn median_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Median::kr();
    if let Some(v) = opt(&args, "length") {
        b = b.length(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "mfccKr", skip_typescript)]
pub fn mfcc_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::MFCC::kr();
    if let Some(v) = opt(&args, "chain") {
        b = b.chain(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numcoeff") {
        b = b.numcoeff(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "midEqAr", skip_typescript)]
pub fn mid_eq_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::MidEQ::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rq") {
        b = b.rq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "db") {
        b = b.db(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "midEqKr", skip_typescript)]
pub fn mid_eq_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::MidEQ::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rq") {
        b = b.rq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "db") {
        b = b.db(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "moogFfAr", skip_typescript)]
pub fn moog_ff_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::MoogFF::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "gain") {
        b = b.gain(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "reset") {
        b = b.reset(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "moogFfKr", skip_typescript)]
pub fn moog_ff_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::MoogFF::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "gain") {
        b = b.gain(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "reset") {
        b = b.reset(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "mostChangeAr", skip_typescript)]
pub fn most_change_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::MostChange::ar();
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b") {
        b = b.b(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "mostChangeKr", skip_typescript)]
pub fn most_change_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::MostChange::kr();
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b") {
        b = b.b(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "mouseButtonKr", skip_typescript)]
pub fn mouse_button_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::MouseButton::kr();
    if let Some(v) = opt(&args, "up") {
        b = b.up(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "down") {
        b = b.down(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "lag") {
        b = b.lag(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "mouseXKr", skip_typescript)]
pub fn mouse_x_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::MouseX::kr();
    if let Some(v) = opt(&args, "min") {
        b = b.min(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "max") {
        b = b.max(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "warp") {
        b = b.warp(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "lag") {
        b = b.lag(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "mouseYKr", skip_typescript)]
pub fn mouse_y_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::MouseY::kr();
    if let Some(v) = opt(&args, "min") {
        b = b.min(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "max") {
        b = b.max(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "warp") {
        b = b.warp(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "lag") {
        b = b.lag(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "mulAddIr", skip_typescript)]
pub fn mul_add_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::MulAdd::ir();
    if let Some(v) = opt(&args, "mul") {
        b = b.mul(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "add") {
        b = b.add(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "mulAddAr", skip_typescript)]
pub fn mul_add_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::MulAdd::ar();
    if let Some(v) = opt(&args, "mul") {
        b = b.mul(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "add") {
        b = b.add(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "mulAddKr", skip_typescript)]
pub fn mul_add_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::MulAdd::kr();
    if let Some(v) = opt(&args, "mul") {
        b = b.mul(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "add") {
        b = b.add(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "normalizerAr", skip_typescript)]
pub fn normalizer_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Normalizer::ar();
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "nRandIr", skip_typescript)]
pub fn n_rand_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::NRand::ir();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "n") {
        b = b.n(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "numAudioBusesIr", skip_typescript)]
pub fn num_audio_buses_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::NumAudioBuses::ir();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "numBuffersIr", skip_typescript)]
pub fn num_buffers_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::NumBuffers::ir();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "numControlBusesIr", skip_typescript)]
pub fn num_control_buses_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::NumControlBuses::ir();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "numInputBusesIr", skip_typescript)]
pub fn num_input_buses_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::NumInputBuses::ir();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "numOutputBusesIr", skip_typescript)]
pub fn num_output_buses_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::NumOutputBuses::ir();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "numRunningSynthsIr", skip_typescript)]
pub fn num_running_synths_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::NumRunningSynths::ir();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "numRunningSynthsKr", skip_typescript)]
pub fn num_running_synths_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::NumRunningSynths::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "offsetOutAr", skip_typescript)]
pub fn offset_out_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::OffsetOut::ar();
    if let Some(v) = opt(&args, "bus") {
        b = b.bus(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "channelsArray") {
        b = b.channels_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "offsetOutKr", skip_typescript)]
pub fn offset_out_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::OffsetOut::kr();
    if let Some(v) = opt(&args, "bus") {
        b = b.bus(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "channelsArray") {
        b = b.channels_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "onePoleAr", skip_typescript)]
pub fn one_pole_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::OnePole::ar();
    if let Some(v) = opt(&args, "coef") {
        b = b.coef(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "onePoleKr", skip_typescript)]
pub fn one_pole_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::OnePole::kr();
    if let Some(v) = opt(&args, "coef") {
        b = b.coef(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "oneZeroAr", skip_typescript)]
pub fn one_zero_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::OneZero::ar();
    if let Some(v) = opt(&args, "coef") {
        b = b.coef(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "oneZeroKr", skip_typescript)]
pub fn one_zero_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::OneZero::kr();
    if let Some(v) = opt(&args, "coef") {
        b = b.coef(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "onsetsKr", skip_typescript)]
pub fn onsets_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Onsets::kr();
    if let Some(v) = opt(&args, "chain") {
        b = b.chain(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "threshold") {
        b = b.threshold(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "odftype") {
        b = b.odftype(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "relaxtime") {
        b = b.relaxtime(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "floor") {
        b = b.floor(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "mingap") {
        b = b.mingap(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "medianspan") {
        b = b.medianspan(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "whtype") {
        b = b.whtype(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rawodf") {
        b = b.rawodf(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "oscAr", skip_typescript)]
pub fn osc_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Osc::ar();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "phase") {
        b = b.phase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "oscKr", skip_typescript)]
pub fn osc_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Osc::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "phase") {
        b = b.phase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "outAr", skip_typescript)]
pub fn out_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Out::ar();
    if let Some(v) = opt(&args, "bus") {
        b = b.bus(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "channelsArray") {
        b = b.channels_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "outKr", skip_typescript)]
pub fn out_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Out::kr();
    if let Some(v) = opt(&args, "bus") {
        b = b.bus(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "channelsArray") {
        b = b.channels_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pan2Ar", skip_typescript)]
pub fn pan2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Pan2::ar();
    if let Some(v) = opt(&args, "pos") {
        b = b.pos(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pan2Kr", skip_typescript)]
pub fn pan2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Pan2::kr();
    if let Some(v) = opt(&args, "pos") {
        b = b.pos(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pan4Ar", skip_typescript)]
pub fn pan4_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Pan4::ar();
    if let Some(v) = opt(&args, "xpos") {
        b = b.xpos(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "ypos") {
        b = b.ypos(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pan4Kr", skip_typescript)]
pub fn pan4_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Pan4::kr();
    if let Some(v) = opt(&args, "xpos") {
        b = b.xpos(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "ypos") {
        b = b.ypos(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "panAzAr", skip_typescript)]
pub fn pan_az_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PanAz::ar();
    if let Some(v) = opt(&args, "pos") {
        b = b.pos(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "width") {
        b = b.width(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "orientation") {
        b = b.orientation(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "panAzKr", skip_typescript)]
pub fn pan_az_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PanAz::kr();
    if let Some(v) = opt(&args, "pos") {
        b = b.pos(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "width") {
        b = b.width(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "orientation") {
        b = b.orientation(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "panBAr", skip_typescript)]
pub fn pan_b_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PanB::ar();
    if let Some(v) = opt(&args, "azimuth") {
        b = b.azimuth(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "elevation") {
        b = b.elevation(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "gain") {
        b = b.gain(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "panBKr", skip_typescript)]
pub fn pan_b_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PanB::kr();
    if let Some(v) = opt(&args, "azimuth") {
        b = b.azimuth(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "elevation") {
        b = b.elevation(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "gain") {
        b = b.gain(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "panB2Ar", skip_typescript)]
pub fn pan_b2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PanB2::ar();
    if let Some(v) = opt(&args, "azimuth") {
        b = b.azimuth(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "gain") {
        b = b.gain(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "panB2Kr", skip_typescript)]
pub fn pan_b2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PanB2::kr();
    if let Some(v) = opt(&args, "azimuth") {
        b = b.azimuth(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "gain") {
        b = b.gain(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "partConvAr", skip_typescript)]
pub fn part_conv_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PartConv::ar();
    if let Some(v) = opt(&args, "fftsize") {
        b = b.fftsize(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "irbufnum") {
        b = b.irbufnum(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pauseKr", skip_typescript)]
pub fn pause_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Pause::kr();
    if let Some(v) = opt(&args, "gate") {
        b = b.gate(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "id") {
        b = b.id(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pauseSelfKr", skip_typescript)]
pub fn pause_self_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PauseSelf::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pauseSelfWhenDoneKr", skip_typescript)]
pub fn pause_self_when_done_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PauseSelfWhenDone::kr();
    if let Some(v) = opt(&args, "src") {
        b = b.src(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "peakAr", skip_typescript)]
pub fn peak_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Peak::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "reset") {
        b = b.reset(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "peakKr", skip_typescript)]
pub fn peak_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Peak::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "reset") {
        b = b.reset(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "peakFollowerAr", skip_typescript)]
pub fn peak_follower_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PeakFollower::ar();
    if let Some(v) = opt(&args, "decay") {
        b = b.decay(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "peakFollowerKr", skip_typescript)]
pub fn peak_follower_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PeakFollower::kr();
    if let Some(v) = opt(&args, "decay") {
        b = b.decay(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "phasorAr", skip_typescript)]
pub fn phasor_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Phasor::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rate") {
        b = b.rate(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "start") {
        b = b.start(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "end") {
        b = b.end(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "resetPos") {
        b = b.reset_pos(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "phasorKr", skip_typescript)]
pub fn phasor_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Phasor::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rate") {
        b = b.rate(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "start") {
        b = b.start(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "end") {
        b = b.end(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "resetPos") {
        b = b.reset_pos(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pinkNoiseAr", skip_typescript)]
pub fn pink_noise_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PinkNoise::ar();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pinkNoiseKr", skip_typescript)]
pub fn pink_noise_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PinkNoise::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pitchKr", skip_typescript)]
pub fn pitch_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Pitch::kr();
    if let Some(v) = opt(&args, "initFreq") {
        b = b.init_freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "minFreq") {
        b = b.min_freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "maxFreq") {
        b = b.max_freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "execFreq") {
        b = b.exec_freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "maxBinsPerOctave") {
        b = b.max_bins_per_octave(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "median") {
        b = b.median(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "ampThreshold") {
        b = b.amp_threshold(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "peakThreshold") {
        b = b.peak_threshold(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "downSample") {
        b = b.down_sample(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "clar") {
        b = b.clar(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pitchShiftAr", skip_typescript)]
pub fn pitch_shift_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PitchShift::ar();
    if let Some(v) = opt(&args, "windowSize") {
        b = b.window_size(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "pitchRatio") {
        b = b.pitch_ratio(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "pitchDispersion") {
        b = b.pitch_dispersion(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "timeDispersion") {
        b = b.time_dispersion(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "playBufAr", skip_typescript)]
pub fn play_buf_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PlayBuf::ar();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rate") {
        b = b.rate(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trigger") {
        b = b.trigger(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "startPos") {
        b = b.start_pos(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "playBufKr", skip_typescript)]
pub fn play_buf_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PlayBuf::kr();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rate") {
        b = b.rate(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trigger") {
        b = b.trigger(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "startPos") {
        b = b.start_pos(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pluckAr", skip_typescript)]
pub fn pluck_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Pluck::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "maxdelaytime") {
        b = b.maxdelaytime(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delaytime") {
        b = b.delaytime(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decaytime") {
        b = b.decaytime(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "coef") {
        b = b.coef(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pollAr", skip_typescript)]
pub fn poll_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Poll::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "label") {
        b = b.label(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trigId") {
        b = b.trig_id(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pollKr", skip_typescript)]
pub fn poll_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Poll::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "label") {
        b = b.label(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trigId") {
        b = b.trig_id(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pSinGrainAr", skip_typescript)]
pub fn p_sin_grain_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PSinGrain::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "amp") {
        b = b.amp(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pulseAr", skip_typescript)]
pub fn pulse_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Pulse::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "width") {
        b = b.width(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pulseKr", skip_typescript)]
pub fn pulse_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Pulse::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "width") {
        b = b.width(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pulseCountAr", skip_typescript)]
pub fn pulse_count_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PulseCount::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "reset") {
        b = b.reset(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pulseCountKr", skip_typescript)]
pub fn pulse_count_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PulseCount::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "reset") {
        b = b.reset(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pulseDividerAr", skip_typescript)]
pub fn pulse_divider_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PulseDivider::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "div") {
        b = b.div(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "startVal") {
        b = b.start_val(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pulseDividerKr", skip_typescript)]
pub fn pulse_divider_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PulseDivider::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "div") {
        b = b.div(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "startVal") {
        b = b.start_val(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvAddKr", skip_typescript)]
pub fn pv_add_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_Add::kr();
    if let Some(v) = opt(&args, "bufferA") {
        b = b.buffer_a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bufferB") {
        b = b.buffer_b(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvBinScrambleKr", skip_typescript)]
pub fn pv_bin_scramble_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_BinScramble::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "wipe") {
        b = b.wipe(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "width") {
        b = b.width(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvBinShiftKr", skip_typescript)]
pub fn pv_bin_shift_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_BinShift::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "stretch") {
        b = b.stretch(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "shift") {
        b = b.shift(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvBinWipeKr", skip_typescript)]
pub fn pv_bin_wipe_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_BinWipe::kr();
    if let Some(v) = opt(&args, "bufferA") {
        b = b.buffer_a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bufferB") {
        b = b.buffer_b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "wipe") {
        b = b.wipe(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvBrickWallKr", skip_typescript)]
pub fn pv_brick_wall_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_BrickWall::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "wipe") {
        b = b.wipe(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvConformalMapKr", skip_typescript)]
pub fn pv_conformal_map_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_ConformalMap::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "areal") {
        b = b.areal(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "aimag") {
        b = b.aimag(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvConjKr", skip_typescript)]
pub fn pv_conj_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_Conj::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvCopyKr", skip_typescript)]
pub fn pv_copy_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_Copy::kr();
    if let Some(v) = opt(&args, "bufferA") {
        b = b.buffer_a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bufferB") {
        b = b.buffer_b(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvCopyPhaseKr", skip_typescript)]
pub fn pv_copy_phase_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_CopyPhase::kr();
    if let Some(v) = opt(&args, "bufferA") {
        b = b.buffer_a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bufferB") {
        b = b.buffer_b(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvDiffuserKr", skip_typescript)]
pub fn pv_diffuser_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_Diffuser::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvDivKr", skip_typescript)]
pub fn pv_div_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_Div::kr();
    if let Some(v) = opt(&args, "bufferA") {
        b = b.buffer_a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bufferB") {
        b = b.buffer_b(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvHainsworthFooteAr", skip_typescript)]
pub fn pv_hainsworth_foote_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_HainsworthFoote::ar();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "proph") {
        b = b.proph(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "propf") {
        b = b.propf(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "threshold") {
        b = b.threshold(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "waitTime") {
        b = b.wait_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvJensenAndersenAr", skip_typescript)]
pub fn pv_jensen_andersen_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_JensenAndersen::ar();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "propsc") {
        b = b.propsc(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "prophfe") {
        b = b.prophfe(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "prophfc") {
        b = b.prophfc(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "propsf") {
        b = b.propsf(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "threshold") {
        b = b.threshold(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "waitTime") {
        b = b.wait_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvLocalMaxKr", skip_typescript)]
pub fn pv_local_max_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_LocalMax::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "threshold") {
        b = b.threshold(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvMagAboveKr", skip_typescript)]
pub fn pv_mag_above_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_MagAbove::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "threshold") {
        b = b.threshold(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvMagBelowKr", skip_typescript)]
pub fn pv_mag_below_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_MagBelow::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "threshold") {
        b = b.threshold(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvMagClipKr", skip_typescript)]
pub fn pv_mag_clip_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_MagClip::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "threshold") {
        b = b.threshold(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvMagDivKr", skip_typescript)]
pub fn pv_mag_div_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_MagDiv::kr();
    if let Some(v) = opt(&args, "bufferA") {
        b = b.buffer_a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bufferB") {
        b = b.buffer_b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "zeroed") {
        b = b.zeroed(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvMagFreezeKr", skip_typescript)]
pub fn pv_mag_freeze_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_MagFreeze::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freeze") {
        b = b.freeze(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvMagMulKr", skip_typescript)]
pub fn pv_mag_mul_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_MagMul::kr();
    if let Some(v) = opt(&args, "bufferA") {
        b = b.buffer_a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bufferB") {
        b = b.buffer_b(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvMagNoiseKr", skip_typescript)]
pub fn pv_mag_noise_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_MagNoise::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvMagShiftKr", skip_typescript)]
pub fn pv_mag_shift_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_MagShift::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "stretch") {
        b = b.stretch(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "shift") {
        b = b.shift(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvMagSmearKr", skip_typescript)]
pub fn pv_mag_smear_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_MagSmear::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bins") {
        b = b.bins(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvMagSquaredKr", skip_typescript)]
pub fn pv_mag_squared_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_MagSquared::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvMaxKr", skip_typescript)]
pub fn pv_max_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_Max::kr();
    if let Some(v) = opt(&args, "bufferA") {
        b = b.buffer_a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bufferB") {
        b = b.buffer_b(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvMinKr", skip_typescript)]
pub fn pv_min_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_Min::kr();
    if let Some(v) = opt(&args, "bufferA") {
        b = b.buffer_a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bufferB") {
        b = b.buffer_b(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvMulKr", skip_typescript)]
pub fn pv_mul_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_Mul::kr();
    if let Some(v) = opt(&args, "bufferA") {
        b = b.buffer_a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bufferB") {
        b = b.buffer_b(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvPhaseShiftKr", skip_typescript)]
pub fn pv_phase_shift_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_PhaseShift::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "shift") {
        b = b.shift(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvPhaseShift270Kr", skip_typescript)]
pub fn pv_phase_shift270_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_PhaseShift270::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvPhaseShift90Kr", skip_typescript)]
pub fn pv_phase_shift90_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_PhaseShift90::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvRandCombKr", skip_typescript)]
pub fn pv_rand_comb_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_RandComb::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "wipe") {
        b = b.wipe(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvRandWipeKr", skip_typescript)]
pub fn pv_rand_wipe_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_RandWipe::kr();
    if let Some(v) = opt(&args, "bufferA") {
        b = b.buffer_a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bufferB") {
        b = b.buffer_b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "wipe") {
        b = b.wipe(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvRectCombKr", skip_typescript)]
pub fn pv_rect_comb_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_RectComb::kr();
    if let Some(v) = opt(&args, "buffer") {
        b = b.buffer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numTeeth") {
        b = b.num_teeth(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "phase") {
        b = b.phase(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "width") {
        b = b.width(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "pvRectComb2Kr", skip_typescript)]
pub fn pv_rect_comb2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::PV_RectComb2::kr();
    if let Some(v) = opt(&args, "bufferA") {
        b = b.buffer_a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bufferB") {
        b = b.buffer_b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numTeeth") {
        b = b.num_teeth(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "phase") {
        b = b.phase(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "width") {
        b = b.width(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "quadCAr", skip_typescript)]
pub fn quad_c_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::QuadC::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b") {
        b = b.b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "c") {
        b = b.c(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xi") {
        b = b.xi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "quadLAr", skip_typescript)]
pub fn quad_l_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::QuadL::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b") {
        b = b.b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "c") {
        b = b.c(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xi") {
        b = b.xi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "quadNAr", skip_typescript)]
pub fn quad_n_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::QuadN::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b") {
        b = b.b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "c") {
        b = b.c(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xi") {
        b = b.xi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "radiansPerSampleIr", skip_typescript)]
pub fn radians_per_sample_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::RadiansPerSample::ir();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "rampAr", skip_typescript)]
pub fn ramp_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Ramp::ar();
    if let Some(v) = opt(&args, "lagTime") {
        b = b.lag_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "rampKr", skip_typescript)]
pub fn ramp_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Ramp::kr();
    if let Some(v) = opt(&args, "lagTime") {
        b = b.lag_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "randIr", skip_typescript)]
pub fn rand_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Rand::ir();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "randIdIr", skip_typescript)]
pub fn rand_id_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::RandID::ir();
    if let Some(v) = opt(&args, "seed") {
        b = b.seed(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "randIdKr", skip_typescript)]
pub fn rand_id_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::RandID::kr();
    if let Some(v) = opt(&args, "seed") {
        b = b.seed(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "randSeedIr", skip_typescript)]
pub fn rand_seed_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::RandSeed::ir();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "seed") {
        b = b.seed(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "randSeedKr", skip_typescript)]
pub fn rand_seed_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::RandSeed::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "seed") {
        b = b.seed(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "randSeedAr", skip_typescript)]
pub fn rand_seed_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::RandSeed::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "seed") {
        b = b.seed(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "recordBufAr", skip_typescript)]
pub fn record_buf_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::RecordBuf::ar();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "offset") {
        b = b.offset(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "recLevel") {
        b = b.rec_level(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "preLevel") {
        b = b.pre_level(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "run") {
        b = b.run(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trigger") {
        b = b.trigger(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "inputArray") {
        b = b.input_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "recordBufKr", skip_typescript)]
pub fn record_buf_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::RecordBuf::kr();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "offset") {
        b = b.offset(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "recLevel") {
        b = b.rec_level(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "preLevel") {
        b = b.pre_level(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "run") {
        b = b.run(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trigger") {
        b = b.trigger(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "inputArray") {
        b = b.input_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "replaceOutAr", skip_typescript)]
pub fn replace_out_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::ReplaceOut::ar();
    if let Some(v) = opt(&args, "bus") {
        b = b.bus(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "channelsArray") {
        b = b.channels_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "replaceOutKr", skip_typescript)]
pub fn replace_out_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::ReplaceOut::kr();
    if let Some(v) = opt(&args, "bus") {
        b = b.bus(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "channelsArray") {
        b = b.channels_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "resonzAr", skip_typescript)]
pub fn resonz_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Resonz::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bwr") {
        b = b.bwr(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "resonzKr", skip_typescript)]
pub fn resonz_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Resonz::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bwr") {
        b = b.bwr(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "rhpfAr", skip_typescript)]
pub fn rhpf_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::RHPF::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rq") {
        b = b.rq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "rhpfKr", skip_typescript)]
pub fn rhpf_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::RHPF::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rq") {
        b = b.rq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "ringzAr", skip_typescript)]
pub fn ringz_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Ringz::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "ringzKr", skip_typescript)]
pub fn ringz_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Ringz::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "decayTime") {
        b = b.decay_time(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "rlpfAr", skip_typescript)]
pub fn rlpf_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::RLPF::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rq") {
        b = b.rq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "rlpfKr", skip_typescript)]
pub fn rlpf_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::RLPF::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rq") {
        b = b.rq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "rotate2Ar", skip_typescript)]
pub fn rotate2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Rotate2::ar();
    if let Some(v) = opt(&args, "x") {
        b = b.x(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "y") {
        b = b.y(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "pos") {
        b = b.pos(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "rotate2Kr", skip_typescript)]
pub fn rotate2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Rotate2::kr();
    if let Some(v) = opt(&args, "x") {
        b = b.x(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "y") {
        b = b.y(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "pos") {
        b = b.pos(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "runningMaxAr", skip_typescript)]
pub fn running_max_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::RunningMax::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "runningMaxKr", skip_typescript)]
pub fn running_max_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::RunningMax::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "runningMinAr", skip_typescript)]
pub fn running_min_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::RunningMin::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "runningMinKr", skip_typescript)]
pub fn running_min_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::RunningMin::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "runningSumAr", skip_typescript)]
pub fn running_sum_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::RunningSum::ar();
    if let Some(v) = opt(&args, "numsamp") {
        b = b.numsamp(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "runningSumKr", skip_typescript)]
pub fn running_sum_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::RunningSum::kr();
    if let Some(v) = opt(&args, "numsamp") {
        b = b.numsamp(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "sampleDurIr", skip_typescript)]
pub fn sample_dur_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SampleDur::ir();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "sampleRateIr", skip_typescript)]
pub fn sample_rate_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SampleRate::ir();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "sawAr", skip_typescript)]
pub fn saw_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Saw::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "sawKr", skip_typescript)]
pub fn saw_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Saw::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "schmidtAr", skip_typescript)]
pub fn schmidt_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Schmidt::ar();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "schmidtKr", skip_typescript)]
pub fn schmidt_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Schmidt::kr();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "scopeOutAr", skip_typescript)]
pub fn scope_out_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::ScopeOut::ar();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "inputArray") {
        b = b.input_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "scopeOutKr", skip_typescript)]
pub fn scope_out_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::ScopeOut::kr();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "inputArray") {
        b = b.input_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "scopeOut2Ar", skip_typescript)]
pub fn scope_out2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::ScopeOut2::ar();
    if let Some(v) = opt(&args, "scopeNum") {
        b = b.scope_num(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "maxFrames") {
        b = b.max_frames(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "scopeFrames") {
        b = b.scope_frames(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "inputArray") {
        b = b.input_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "scopeOut2Kr", skip_typescript)]
pub fn scope_out2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::ScopeOut2::kr();
    if let Some(v) = opt(&args, "scopeNum") {
        b = b.scope_num(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "maxFrames") {
        b = b.max_frames(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "scopeFrames") {
        b = b.scope_frames(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "inputArray") {
        b = b.input_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "selectAr", skip_typescript)]
pub fn select_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Select::ar();
    if let Some(v) = opt(&args, "which") {
        b = b.which(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "channelsArray") {
        b = b.channels_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "selectKr", skip_typescript)]
pub fn select_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Select::kr();
    if let Some(v) = opt(&args, "which") {
        b = b.which(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "channelsArray") {
        b = b.channels_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "sendReplyAr", skip_typescript)]
pub fn send_reply_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SendReply::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "cmdName") {
        b = b.cmd_name(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "values") {
        b = b.values(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "replyId") {
        b = b.reply_id(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "sendReplyKr", skip_typescript)]
pub fn send_reply_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SendReply::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "cmdName") {
        b = b.cmd_name(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "values") {
        b = b.values(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "replyId") {
        b = b.reply_id(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "sendTrigAr", skip_typescript)]
pub fn send_trig_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SendTrig::ar();
    if let Some(v) = opt(&args, "id") {
        b = b.id(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "value") {
        b = b.value(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "sendTrigKr", skip_typescript)]
pub fn send_trig_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SendTrig::kr();
    if let Some(v) = opt(&args, "id") {
        b = b.id(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "value") {
        b = b.value(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "setBufAr", skip_typescript)]
pub fn set_buf_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SetBuf::ar();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "values") {
        b = b.values(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "offset") {
        b = b.offset(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "setBufKr", skip_typescript)]
pub fn set_buf_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SetBuf::kr();
    if let Some(v) = opt(&args, "buf") {
        b = b.buf(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "values") {
        b = b.values(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "offset") {
        b = b.offset(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "setResetFfAr", skip_typescript)]
pub fn set_reset_ff_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SetResetFF::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "reset") {
        b = b.reset(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "setResetFfKr", skip_typescript)]
pub fn set_reset_ff_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SetResetFF::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "reset") {
        b = b.reset(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "shaperKr", skip_typescript)]
pub fn shaper_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Shaper::kr();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "shaperAr", skip_typescript)]
pub fn shaper_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Shaper::ar();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "sharedInKr", skip_typescript)]
pub fn shared_in_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SharedIn::kr();
    if let Some(v) = opt(&args, "bus") {
        b = b.bus(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "sharedOutKr", skip_typescript)]
pub fn shared_out_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SharedOut::kr();
    if let Some(v) = opt(&args, "bus") {
        b = b.bus(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "channelsArray") {
        b = b.channels_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "silentAr", skip_typescript)]
pub fn silent_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Silent::ar();
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "sinOscAr", skip_typescript)]
pub fn sin_osc_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SinOsc::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "phase") {
        b = b.phase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "sinOscKr", skip_typescript)]
pub fn sin_osc_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SinOsc::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "phase") {
        b = b.phase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "sinOscFbAr", skip_typescript)]
pub fn sin_osc_fb_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SinOscFB::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "feedback") {
        b = b.feedback(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "sinOscFbKr", skip_typescript)]
pub fn sin_osc_fb_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SinOscFB::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "feedback") {
        b = b.feedback(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "slewAr", skip_typescript)]
pub fn slew_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Slew::ar();
    if let Some(v) = opt(&args, "up") {
        b = b.up(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dn") {
        b = b.dn(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "slewKr", skip_typescript)]
pub fn slew_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Slew::kr();
    if let Some(v) = opt(&args, "up") {
        b = b.up(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dn") {
        b = b.dn(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "slopeAr", skip_typescript)]
pub fn slope_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Slope::ar();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "slopeKr", skip_typescript)]
pub fn slope_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Slope::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "sosAr", skip_typescript)]
pub fn sos_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SOS::ar();
    if let Some(v) = opt(&args, "a0") {
        b = b.a0(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a1") {
        b = b.a1(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a2") {
        b = b.a2(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b1") {
        b = b.b1(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b2") {
        b = b.b2(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "sosKr", skip_typescript)]
pub fn sos_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SOS::kr();
    if let Some(v) = opt(&args, "a0") {
        b = b.a0(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a1") {
        b = b.a1(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "a2") {
        b = b.a2(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b1") {
        b = b.b1(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b2") {
        b = b.b2(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "specCentroidKr", skip_typescript)]
pub fn spec_centroid_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SpecCentroid::kr();
    if let Some(v) = opt(&args, "chain") {
        b = b.chain(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "specFlatnessKr", skip_typescript)]
pub fn spec_flatness_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SpecFlatness::kr();
    if let Some(v) = opt(&args, "chain") {
        b = b.chain(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "specPcileKr", skip_typescript)]
pub fn spec_pcile_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SpecPcile::kr();
    if let Some(v) = opt(&args, "chain") {
        b = b.chain(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "fraction") {
        b = b.fraction(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "interpolate") {
        b = b.interpolate(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "springAr", skip_typescript)]
pub fn spring_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Spring::ar();
    if let Some(v) = opt(&args, "spring") {
        b = b.spring(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "damp") {
        b = b.damp(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "springKr", skip_typescript)]
pub fn spring_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Spring::kr();
    if let Some(v) = opt(&args, "spring") {
        b = b.spring(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "damp") {
        b = b.damp(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "standardLAr", skip_typescript)]
pub fn standard_l_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::StandardL::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "k") {
        b = b.k(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xi") {
        b = b.xi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "yi") {
        b = b.yi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "standardNAr", skip_typescript)]
pub fn standard_n_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::StandardN::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "k") {
        b = b.k(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xi") {
        b = b.xi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "yi") {
        b = b.yi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "stepperAr", skip_typescript)]
pub fn stepper_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Stepper::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "reset") {
        b = b.reset(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "min") {
        b = b.min(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "max") {
        b = b.max(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "step") {
        b = b.step(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "resetval") {
        b = b.resetval(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "stepperKr", skip_typescript)]
pub fn stepper_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Stepper::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "reset") {
        b = b.reset(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "min") {
        b = b.min(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "max") {
        b = b.max(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "step") {
        b = b.step(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "resetval") {
        b = b.resetval(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "stereoConvolution2LAr", skip_typescript)]
pub fn stereo_convolution2_l_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::StereoConvolution2L::ar();
    if let Some(v) = opt(&args, "kernelL") {
        b = b.kernel_l(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "kernelR") {
        b = b.kernel_r(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trigger") {
        b = b.trigger(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "framesize") {
        b = b.framesize(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "crossfade") {
        b = b.crossfade(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "subsampleOffsetIr", skip_typescript)]
pub fn subsample_offset_ir(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SubsampleOffset::ir();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "sweepAr", skip_typescript)]
pub fn sweep_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Sweep::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rate") {
        b = b.rate(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "sweepKr", skip_typescript)]
pub fn sweep_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Sweep::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rate") {
        b = b.rate(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "syncSawAr", skip_typescript)]
pub fn sync_saw_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SyncSaw::ar();
    if let Some(v) = opt(&args, "syncFreq") {
        b = b.sync_freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "sawFreq") {
        b = b.saw_freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "syncSawKr", skip_typescript)]
pub fn sync_saw_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::SyncSaw::kr();
    if let Some(v) = opt(&args, "syncFreq") {
        b = b.sync_freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "sawFreq") {
        b = b.saw_freq(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "t2AAr", skip_typescript)]
pub fn t2_a_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::T2A::ar();
    if let Some(v) = opt(&args, "offset") {
        b = b.offset(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "t2KKr", skip_typescript)]
pub fn t2_k_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::T2K::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "tBallAr", skip_typescript)]
pub fn t_ball_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::TBall::ar();
    if let Some(v) = opt(&args, "g") {
        b = b.g(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "damp") {
        b = b.damp(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "friction") {
        b = b.friction(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "tBallKr", skip_typescript)]
pub fn t_ball_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::TBall::kr();
    if let Some(v) = opt(&args, "g") {
        b = b.g(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "damp") {
        b = b.damp(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "friction") {
        b = b.friction(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "tDelayAr", skip_typescript)]
pub fn t_delay_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::TDelay::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "tDelayKr", skip_typescript)]
pub fn t_delay_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::TDelay::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "tDutyAr", skip_typescript)]
pub fn t_duty_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::TDuty::ar();
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "reset") {
        b = b.reset(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "gapFirst") {
        b = b.gap_first(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "tDutyKr", skip_typescript)]
pub fn t_duty_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::TDuty::kr();
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "reset") {
        b = b.reset(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "gapFirst") {
        b = b.gap_first(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "tExpRandAr", skip_typescript)]
pub fn t_exp_rand_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::TExpRand::ar();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "tExpRandKr", skip_typescript)]
pub fn t_exp_rand_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::TExpRand::kr();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "tGrainsAr", skip_typescript)]
pub fn t_grains_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::TGrains::ar();
    if let Some(v) = opt(&args, "trigger") {
        b = b.trigger(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rate") {
        b = b.rate(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "centerPos") {
        b = b.center_pos(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "pan") {
        b = b.pan(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "amp") {
        b = b.amp(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "interp") {
        b = b.interp(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "timerAr", skip_typescript)]
pub fn timer_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Timer::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "timerKr", skip_typescript)]
pub fn timer_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Timer::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "tiRandKr", skip_typescript)]
pub fn ti_rand_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::TIRand::kr();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "tiRandAr", skip_typescript)]
pub fn ti_rand_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::TIRand::ar();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "toggleFfAr", skip_typescript)]
pub fn toggle_ff_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::ToggleFF::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "toggleFfKr", skip_typescript)]
pub fn toggle_ff_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::ToggleFF::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "tRandKr", skip_typescript)]
pub fn t_rand_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::TRand::kr();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "tRandAr", skip_typescript)]
pub fn t_rand_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::TRand::ar();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "trapezoidAr", skip_typescript)]
pub fn trapezoid_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Trapezoid::ar();
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b") {
        b = b.b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "c") {
        b = b.c(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "d") {
        b = b.d(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "trapezoidKr", skip_typescript)]
pub fn trapezoid_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Trapezoid::kr();
    if let Some(v) = opt(&args, "a") {
        b = b.a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "b") {
        b = b.b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "c") {
        b = b.c(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "d") {
        b = b.d(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "trigAr", skip_typescript)]
pub fn trig_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Trig::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "trigKr", skip_typescript)]
pub fn trig_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Trig::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "trig1Ar", skip_typescript)]
pub fn trig1_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Trig1::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "trig1Kr", skip_typescript)]
pub fn trig1_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Trig1::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "tWindexAr", skip_typescript)]
pub fn t_windex_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::TWindex::ar();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "normalize") {
        b = b.normalize(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "channelsArray") {
        b = b.channels_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "tWindexKr", skip_typescript)]
pub fn t_windex_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::TWindex::kr();
    if let Some(v) = opt(&args, "trig") {
        b = b.trig(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "normalize") {
        b = b.normalize(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "channelsArray") {
        b = b.channels_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "twoPoleAr", skip_typescript)]
pub fn two_pole_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::TwoPole::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "radius") {
        b = b.radius(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "twoPoleKr", skip_typescript)]
pub fn two_pole_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::TwoPole::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "radius") {
        b = b.radius(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "twoZeroAr", skip_typescript)]
pub fn two_zero_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::TwoZero::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "radius") {
        b = b.radius(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "twoZeroKr", skip_typescript)]
pub fn two_zero_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::TwoZero::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "radius") {
        b = b.radius(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "varSawAr", skip_typescript)]
pub fn var_saw_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::VarSaw::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "iphase") {
        b = b.iphase(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "width") {
        b = b.width(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "varSawKr", skip_typescript)]
pub fn var_saw_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::VarSaw::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "iphase") {
        b = b.iphase(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "width") {
        b = b.width(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "vDiskInAr", skip_typescript)]
pub fn v_disk_in_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::VDiskIn::ar();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rate") {
        b = b.rate(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "sendId") {
        b = b.send_id(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "vibratoAr", skip_typescript)]
pub fn vibrato_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Vibrato::ar();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rate") {
        b = b.rate(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "depth") {
        b = b.depth(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delay") {
        b = b.delay(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "onset") {
        b = b.onset(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rateVariation") {
        b = b.rate_variation(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "depthVariation") {
        b = b.depth_variation(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "iphase") {
        b = b.iphase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "vibratoKr", skip_typescript)]
pub fn vibrato_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Vibrato::kr();
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rate") {
        b = b.rate(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "depth") {
        b = b.depth(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "delay") {
        b = b.delay(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "onset") {
        b = b.onset(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "rateVariation") {
        b = b.rate_variation(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "depthVariation") {
        b = b.depth_variation(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "iphase") {
        b = b.iphase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "vOscAr", skip_typescript)]
pub fn v_osc_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::VOsc::ar();
    if let Some(v) = opt(&args, "bufpos") {
        b = b.bufpos(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "phase") {
        b = b.phase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "vOscKr", skip_typescript)]
pub fn v_osc_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::VOsc::kr();
    if let Some(v) = opt(&args, "bufpos") {
        b = b.bufpos(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freq") {
        b = b.freq(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "phase") {
        b = b.phase(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "vOsc3Ar", skip_typescript)]
pub fn v_osc3_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::VOsc3::ar();
    if let Some(v) = opt(&args, "bufpos") {
        b = b.bufpos(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freq1") {
        b = b.freq1(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freq2") {
        b = b.freq2(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freq3") {
        b = b.freq3(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "vOsc3Kr", skip_typescript)]
pub fn v_osc3_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::VOsc3::kr();
    if let Some(v) = opt(&args, "bufpos") {
        b = b.bufpos(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freq1") {
        b = b.freq1(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freq2") {
        b = b.freq2(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freq3") {
        b = b.freq3(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "warp1Ar", skip_typescript)]
pub fn warp1_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Warp1::ar();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "pointer") {
        b = b.pointer(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "freqScale") {
        b = b.freq_scale(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "windowSize") {
        b = b.window_size(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "envbufnum") {
        b = b.envbufnum(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "overlaps") {
        b = b.overlaps(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "windowRandRatio") {
        b = b.window_rand_ratio(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "interp") {
        b = b.interp(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "numChannels") {
        b = b.num_channels(
            v.as_f64()
                .ok_or_else(|| JsError::new("numChannels: expected a number"))? as u32,
        );
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "whiteNoiseAr", skip_typescript)]
pub fn white_noise_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::WhiteNoise::ar();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "whiteNoiseKr", skip_typescript)]
pub fn white_noise_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::WhiteNoise::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "wrapAr", skip_typescript)]
pub fn wrap_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Wrap::ar();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "wrapKr", skip_typescript)]
pub fn wrap_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::Wrap::kr();
    if let Some(v) = opt(&args, "lo") {
        b = b.lo(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "hi") {
        b = b.hi(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "wrapIndexKr", skip_typescript)]
pub fn wrap_index_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::WrapIndex::kr();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "wrapIndexAr", skip_typescript)]
pub fn wrap_index_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::WrapIndex::ar();
    if let Some(v) = opt(&args, "bufnum") {
        b = b.bufnum(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "xFade2Ar", skip_typescript)]
pub fn x_fade2_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::XFade2::ar();
    if let Some(v) = opt(&args, "inA") {
        b = b.in_a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "inB") {
        b = b.in_b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "pan") {
        b = b.pan(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "xFade2Kr", skip_typescript)]
pub fn x_fade2_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::XFade2::kr();
    if let Some(v) = opt(&args, "inA") {
        b = b.in_a(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "inB") {
        b = b.in_b(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "pan") {
        b = b.pan(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "level") {
        b = b.level(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "xLineAr", skip_typescript)]
pub fn x_line_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::XLine::ar();
    if let Some(v) = opt(&args, "start") {
        b = b.start(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "end") {
        b = b.end(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "xLineKr", skip_typescript)]
pub fn x_line_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::XLine::kr();
    if let Some(v) = opt(&args, "start") {
        b = b.start(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "end") {
        b = b.end(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "dur") {
        b = b.dur(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "action") {
        b = b.action(input_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "xOutAr", skip_typescript)]
pub fn x_out_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::XOut::ar();
    if let Some(v) = opt(&args, "bus") {
        b = b.bus(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xfade") {
        b = b.xfade(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "channelsArray") {
        b = b.channels_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "xOutKr", skip_typescript)]
pub fn x_out_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::XOut::kr();
    if let Some(v) = opt(&args, "bus") {
        b = b.bus(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "xfade") {
        b = b.xfade(input_from_js(&v)?);
    }
    if let Some(v) = opt(&args, "channelsArray") {
        b = b.channels_array(inputs_from_js(&v)?);
    }
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "zeroCrossingAr", skip_typescript)]
pub fn zero_crossing_ar(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::ZeroCrossing::ar();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(js_name = "zeroCrossingKr", skip_typescript)]
pub fn zero_crossing_kr(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {
    let mut b = builders::ZeroCrossing::kr();
    input_to_js(&b.build(&mut def.inner))
}

#[wasm_bindgen(typescript_custom_section)]
const TS_BUILDERS: &'static str = r#"
export function a2KKr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function allpassCAr(def: SynthDef, args?: { maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function allpassCKr(def: SynthDef, args?: { maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function allpassLAr(def: SynthDef, args?: { maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function allpassLKr(def: SynthDef, args?: { maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function allpassNAr(def: SynthDef, args?: { maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function allpassNKr(def: SynthDef, args?: { maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function ampCompIr(def: SynthDef, args?: { freq?: UGenInputLike; root?: UGenInputLike; exp?: UGenInputLike }): UGenInput;
export function ampCompAr(def: SynthDef, args?: { freq?: UGenInputLike; root?: UGenInputLike; exp?: UGenInputLike }): UGenInput;
export function ampCompKr(def: SynthDef, args?: { freq?: UGenInputLike; root?: UGenInputLike; exp?: UGenInputLike }): UGenInput;
export function ampCompAIr(def: SynthDef, args?: { freq?: UGenInputLike; root?: UGenInputLike; minAmp?: UGenInputLike; rootAmp?: UGenInputLike }): UGenInput;
export function ampCompAAr(def: SynthDef, args?: { freq?: UGenInputLike; root?: UGenInputLike; minAmp?: UGenInputLike; rootAmp?: UGenInputLike }): UGenInput;
export function ampCompAKr(def: SynthDef, args?: { freq?: UGenInputLike; root?: UGenInputLike; minAmp?: UGenInputLike; rootAmp?: UGenInputLike }): UGenInput;
export function amplitudeAr(def: SynthDef, args?: { attackTime?: UGenInputLike; releaseTime?: UGenInputLike }): UGenInput;
export function amplitudeKr(def: SynthDef, args?: { attackTime?: UGenInputLike; releaseTime?: UGenInputLike }): UGenInput;
export function apfAr(def: SynthDef, args?: { freq?: UGenInputLike; radius?: UGenInputLike }): UGenInput;
export function apfKr(def: SynthDef, args?: { freq?: UGenInputLike; radius?: UGenInputLike }): UGenInput;
export function balance2Ar(def: SynthDef, args?: { left?: UGenInputLike; right?: UGenInputLike; pos?: UGenInputLike; level?: UGenInputLike }): UGenInput;
export function balance2Kr(def: SynthDef, args?: { left?: UGenInputLike; right?: UGenInputLike; pos?: UGenInputLike; level?: UGenInputLike }): UGenInput;
export function ballAr(def: SynthDef, args?: { g?: UGenInputLike; damp?: UGenInputLike; friction?: UGenInputLike }): UGenInput;
export function ballKr(def: SynthDef, args?: { g?: UGenInputLike; damp?: UGenInputLike; friction?: UGenInputLike }): UGenInput;
export function bAllPassAr(def: SynthDef, args?: { freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
export function bBandPassAr(def: SynthDef, args?: { freq?: UGenInputLike; bw?: UGenInputLike }): UGenInput;
export function bBandStopAr(def: SynthDef, args?: { freq?: UGenInputLike; bw?: UGenInputLike }): UGenInput;
export function beatTrackKr(def: SynthDef, args?: { chain?: UGenInputLike; lock?: UGenInputLike }): UGenInput;
export function beatTrack2Kr(def: SynthDef, args?: { busindex?: UGenInputLike; numfeatures?: UGenInputLike; windowsize?: UGenInputLike; phaseaccuracy?: UGenInputLike; lock?: UGenInputLike; weightingscheme?: UGenInputLike }): UGenInput;
export function bHiPassAr(def: SynthDef, args?: { freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
export function bHiShelfAr(def: SynthDef, args?: { freq?: UGenInputLike; rs?: UGenInputLike; db?: UGenInputLike }): UGenInput;
export function biPanB2Ar(def: SynthDef, args?: { inA?: UGenInputLike; inB?: UGenInputLike; azimuth?: UGenInputLike; gain?: UGenInputLike }): UGenInput;
export function biPanB2Kr(def: SynthDef, args?: { inA?: UGenInputLike; inB?: UGenInputLike; azimuth?: UGenInputLike; gain?: UGenInputLike }): UGenInput;
export function blipAr(def: SynthDef, args?: { freq?: UGenInputLike; numharm?: UGenInputLike }): UGenInput;
export function blipKr(def: SynthDef, args?: { freq?: UGenInputLike; numharm?: UGenInputLike }): UGenInput;
export function bLowPassAr(def: SynthDef, args?: { freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
export function bLowShelfAr(def: SynthDef, args?: { freq?: UGenInputLike; rs?: UGenInputLike; db?: UGenInputLike }): UGenInput;
export function bPeakEqAr(def: SynthDef, args?: { freq?: UGenInputLike; rq?: UGenInputLike; db?: UGenInputLike }): UGenInput;
export function bpfAr(def: SynthDef, args?: { freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
export function bpfKr(def: SynthDef, args?: { freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
export function bpz2Ar(def: SynthDef, args?: Record<string, never>): UGenInput;
export function bpz2Kr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function brfAr(def: SynthDef, args?: { freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
export function brfKr(def: SynthDef, args?: { freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
export function brownNoiseAr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function brownNoiseKr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function brz2Ar(def: SynthDef, args?: Record<string, never>): UGenInput;
export function brz2Kr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function bufAllpassCAr(def: SynthDef, args?: { buf?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function bufAllpassLAr(def: SynthDef, args?: { buf?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function bufAllpassNAr(def: SynthDef, args?: { buf?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function bufChannelsKr(def: SynthDef, args?: { buf?: UGenInputLike }): UGenInput;
export function bufChannelsIr(def: SynthDef, args?: { buf?: UGenInputLike }): UGenInput;
export function bufCombCAr(def: SynthDef, args?: { buf?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function bufCombLAr(def: SynthDef, args?: { buf?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function bufCombNAr(def: SynthDef, args?: { buf?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function bufDelayCAr(def: SynthDef, args?: { buf?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
export function bufDelayCKr(def: SynthDef, args?: { buf?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
export function bufDelayLAr(def: SynthDef, args?: { buf?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
export function bufDelayLKr(def: SynthDef, args?: { buf?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
export function bufDelayNAr(def: SynthDef, args?: { buf?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
export function bufDelayNKr(def: SynthDef, args?: { buf?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
export function bufDurKr(def: SynthDef, args?: { buf?: UGenInputLike }): UGenInput;
export function bufDurIr(def: SynthDef, args?: { buf?: UGenInputLike }): UGenInput;
export function bufFramesKr(def: SynthDef, args?: { buf?: UGenInputLike }): UGenInput;
export function bufFramesIr(def: SynthDef, args?: { buf?: UGenInputLike }): UGenInput;
export function bufRateScaleKr(def: SynthDef, args?: { buf?: UGenInputLike }): UGenInput;
export function bufRateScaleIr(def: SynthDef, args?: { buf?: UGenInputLike }): UGenInput;
export function bufRdAr(def: SynthDef, args?: { bufnum?: UGenInputLike; phase?: UGenInputLike; interpolation?: UGenInputLike; numChannels?: number }): UGenInput;
export function bufRdKr(def: SynthDef, args?: { bufnum?: UGenInputLike; phase?: UGenInputLike; interpolation?: UGenInputLike; numChannels?: number }): UGenInput;
export function bufSampleRateKr(def: SynthDef, args?: { buf?: UGenInputLike }): UGenInput;
export function bufSampleRateIr(def: SynthDef, args?: { buf?: UGenInputLike }): UGenInput;
export function bufSamplesKr(def: SynthDef, args?: { buf?: UGenInputLike }): UGenInput;
export function bufSamplesIr(def: SynthDef, args?: { buf?: UGenInputLike }): UGenInput;
export function bufWrAr(def: SynthDef, args?: { bufnum?: UGenInputLike; phase?: UGenInputLike; inputArray?: UGenInputLike[] }): UGenInput;
export function bufWrKr(def: SynthDef, args?: { bufnum?: UGenInputLike; phase?: UGenInputLike; inputArray?: UGenInputLike[] }): UGenInput;
export function checkBadValuesKr(def: SynthDef, args?: { id?: UGenInputLike; post?: UGenInputLike }): UGenInput;
export function checkBadValuesAr(def: SynthDef, args?: { id?: UGenInputLike; post?: UGenInputLike }): UGenInput;
export function clearBufIr(def: SynthDef, args?: { buf?: UGenInputLike }): UGenInput;
export function clipAr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
export function clipKr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
export function clipNoiseAr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function clipNoiseKr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function coinGateKr(def: SynthDef, args?: { prob?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
export function coinGateAr(def: SynthDef, args?: { prob?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
export function combCAr(def: SynthDef, args?: { maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function combCKr(def: SynthDef, args?: { maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function combLAr(def: SynthDef, args?: { maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function combLKr(def: SynthDef, args?: { maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function combNAr(def: SynthDef, args?: { maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function combNKr(def: SynthDef, args?: { maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function companderAr(def: SynthDef, args?: { control?: UGenInputLike; thresh?: UGenInputLike; slopeBelow?: UGenInputLike; slopeAbove?: UGenInputLike; clampTime?: UGenInputLike; relaxTime?: UGenInputLike }): UGenInput;
export function controlDurIr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function controlRateIr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function convolutionAr(def: SynthDef, args?: { kernel?: UGenInputLike; framesize?: UGenInputLike }): UGenInput;
export function convolution2Ar(def: SynthDef, args?: { kernel?: UGenInputLike; trigger?: UGenInputLike; framesize?: UGenInputLike }): UGenInput;
export function convolution2LAr(def: SynthDef, args?: { kernel?: UGenInputLike; trigger?: UGenInputLike; framesize?: UGenInputLike; crossfade?: UGenInputLike }): UGenInput;
export function convolution3Ar(def: SynthDef, args?: { kernel?: UGenInputLike; trigger?: UGenInputLike; framesize?: UGenInputLike }): UGenInput;
export function convolution3Kr(def: SynthDef, args?: { kernel?: UGenInputLike; trigger?: UGenInputLike; framesize?: UGenInputLike }): UGenInput;
export function cOscAr(def: SynthDef, args?: { bufnum?: UGenInputLike; freq?: UGenInputLike; beats?: UGenInputLike }): UGenInput;
export function cOscKr(def: SynthDef, args?: { bufnum?: UGenInputLike; freq?: UGenInputLike; beats?: UGenInputLike }): UGenInput;
export function crackleAr(def: SynthDef, args?: { chaosParam?: UGenInputLike }): UGenInput;
export function crackleKr(def: SynthDef, args?: { chaosParam?: UGenInputLike }): UGenInput;
export function cuspLAr(def: SynthDef, args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; xi?: UGenInputLike }): UGenInput;
export function cuspNAr(def: SynthDef, args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; xi?: UGenInputLike }): UGenInput;
export function dcAr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function dcKr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function decayAr(def: SynthDef, args?: { decayTime?: UGenInputLike }): UGenInput;
export function decayKr(def: SynthDef, args?: { decayTime?: UGenInputLike }): UGenInput;
export function decay2Ar(def: SynthDef, args?: { attackTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function decay2Kr(def: SynthDef, args?: { attackTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function decodeB2Ar(def: SynthDef, args?: { w?: UGenInputLike; x?: UGenInputLike; y?: UGenInputLike; orientation?: UGenInputLike; numChannels?: number }): UGenInput;
export function decodeB2Kr(def: SynthDef, args?: { w?: UGenInputLike; x?: UGenInputLike; y?: UGenInputLike; orientation?: UGenInputLike; numChannels?: number }): UGenInput;
export function degreeToKeyAr(def: SynthDef, args?: { bufnum?: UGenInputLike; octave?: UGenInputLike }): UGenInput;
export function degreeToKeyKr(def: SynthDef, args?: { bufnum?: UGenInputLike; octave?: UGenInputLike }): UGenInput;
export function delay1Ar(def: SynthDef, args?: Record<string, never>): UGenInput;
export function delay1Kr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function delay2Ar(def: SynthDef, args?: Record<string, never>): UGenInput;
export function delay2Kr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function delayCAr(def: SynthDef, args?: { maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
export function delayCKr(def: SynthDef, args?: { maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
export function delayLAr(def: SynthDef, args?: { maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
export function delayLKr(def: SynthDef, args?: { maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
export function delayNAr(def: SynthDef, args?: { maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
export function delayNKr(def: SynthDef, args?: { maxDelayTime?: UGenInputLike; delayTime?: UGenInputLike }): UGenInput;
export function delTapRdAr(def: SynthDef, args?: { buffer?: UGenInputLike; phase?: UGenInputLike; delay?: UGenInputLike; interp?: UGenInputLike }): UGenInput;
export function delTapRdKr(def: SynthDef, args?: { buffer?: UGenInputLike; phase?: UGenInputLike; delay?: UGenInputLike; interp?: UGenInputLike }): UGenInput;
export function delTapWrAr(def: SynthDef, args?: { buffer?: UGenInputLike }): UGenInput;
export function delTapWrKr(def: SynthDef, args?: { buffer?: UGenInputLike }): UGenInput;
export function demandAr(def: SynthDef, args?: { trig?: UGenInputLike; reset?: UGenInputLike; demandUgens?: UGenInputLike }): UGenInput;
export function demandKr(def: SynthDef, args?: { trig?: UGenInputLike; reset?: UGenInputLike; demandUgens?: UGenInputLike }): UGenInput;
export function demandEnvGenAr(def: SynthDef, args?: { level?: UGenInputLike; dur?: UGenInputLike; shape?: UGenInputLike; curve?: UGenInputLike; gate?: UGenInputLike; reset?: UGenInputLike; levelScale?: UGenInputLike; levelBias?: UGenInputLike; timeScale?: UGenInputLike; action?: UGenInputLike }): UGenInput;
export function demandEnvGenKr(def: SynthDef, args?: { level?: UGenInputLike; dur?: UGenInputLike; shape?: UGenInputLike; curve?: UGenInputLike; gate?: UGenInputLike; reset?: UGenInputLike; levelScale?: UGenInputLike; levelBias?: UGenInputLike; timeScale?: UGenInputLike; action?: UGenInputLike }): UGenInput;
export function detectIndexKr(def: SynthDef, args?: { bufnum?: UGenInputLike }): UGenInput;
export function detectIndexAr(def: SynthDef, args?: { bufnum?: UGenInputLike }): UGenInput;
export function detectSilenceAr(def: SynthDef, args?: { amp?: UGenInputLike; time?: UGenInputLike; action?: UGenInputLike }): UGenInput;
export function detectSilenceKr(def: SynthDef, args?: { amp?: UGenInputLike; time?: UGenInputLike; action?: UGenInputLike }): UGenInput;
export function diskInAr(def: SynthDef, args?: { bufnum?: UGenInputLike; numChannels?: number }): UGenInput;
export function diskOutAr(def: SynthDef, args?: { bufnum?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
export function doneKr(def: SynthDef, args?: { src?: UGenInputLike }): UGenInput;
export function dustAr(def: SynthDef, args?: { density?: UGenInputLike }): UGenInput;
export function dustKr(def: SynthDef, args?: { density?: UGenInputLike }): UGenInput;
export function dust2Ar(def: SynthDef, args?: { density?: UGenInputLike }): UGenInput;
export function dust2Kr(def: SynthDef, args?: { density?: UGenInputLike }): UGenInput;
export function dutyAr(def: SynthDef, args?: { dur?: UGenInputLike; reset?: UGenInputLike; action?: UGenInputLike; level?: UGenInputLike }): UGenInput;
export function dutyKr(def: SynthDef, args?: { dur?: UGenInputLike; reset?: UGenInputLike; action?: UGenInputLike; level?: UGenInputLike }): UGenInput;
export function envGenAr(def: SynthDef, args?: { envelope?: UGenInputLike; gate?: UGenInputLike; levelScale?: UGenInputLike; levelBias?: UGenInputLike; timeScale?: UGenInputLike; action?: UGenInputLike }): UGenInput;
export function envGenKr(def: SynthDef, args?: { envelope?: UGenInputLike; gate?: UGenInputLike; levelScale?: UGenInputLike; levelBias?: UGenInputLike; timeScale?: UGenInputLike; action?: UGenInputLike }): UGenInput;
export function expRandIr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
export function fbSineCAr(def: SynthDef, args?: { freq?: UGenInputLike; im?: UGenInputLike; fb?: UGenInputLike; a?: UGenInputLike; c?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike }): UGenInput;
export function fbSineLAr(def: SynthDef, args?: { freq?: UGenInputLike; im?: UGenInputLike; fb?: UGenInputLike; a?: UGenInputLike; c?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike }): UGenInput;
export function fbSineNAr(def: SynthDef, args?: { freq?: UGenInputLike; im?: UGenInputLike; fb?: UGenInputLike; a?: UGenInputLike; c?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike }): UGenInput;
export function fftKr(def: SynthDef, args?: { buffer?: UGenInputLike; hop?: UGenInputLike; wintype?: UGenInputLike; active?: UGenInputLike; winsize?: UGenInputLike }): UGenInput;
export function fftTriggerKr(def: SynthDef, args?: { buffer?: UGenInputLike; hop?: UGenInputLike; polar?: UGenInputLike }): UGenInput;
export function foldAr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
export function foldKr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
export function formantAr(def: SynthDef, args?: { fundfreq?: UGenInputLike; formfreq?: UGenInputLike; bwfreq?: UGenInputLike }): UGenInput;
export function formletAr(def: SynthDef, args?: { freq?: UGenInputLike; attackTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function formletKr(def: SynthDef, args?: { freq?: UGenInputLike; attackTime?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function fosAr(def: SynthDef, args?: { a0?: UGenInputLike; a1?: UGenInputLike; b1?: UGenInputLike }): UGenInput;
export function fosKr(def: SynthDef, args?: { a0?: UGenInputLike; a1?: UGenInputLike; b1?: UGenInputLike }): UGenInput;
export function freeKr(def: SynthDef, args?: { trig?: UGenInputLike; id?: UGenInputLike }): UGenInput;
export function freeSelfKr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function freeSelfWhenDoneKr(def: SynthDef, args?: { src?: UGenInputLike }): UGenInput;
export function freeVerbAr(def: SynthDef, args?: { mix?: UGenInputLike; room?: UGenInputLike; damp?: UGenInputLike }): UGenInput;
export function freeVerb2Ar(def: SynthDef, args?: { in2?: UGenInputLike; mix?: UGenInputLike; room?: UGenInputLike; damp?: UGenInputLike }): UGenInput;
export function freqShiftAr(def: SynthDef, args?: { freq?: UGenInputLike; phase?: UGenInputLike }): UGenInput;
export function fSinOscAr(def: SynthDef, args?: { freq?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
export function fSinOscKr(def: SynthDef, args?: { freq?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
export function gateAr(def: SynthDef, args?: { trig?: UGenInputLike }): UGenInput;
export function gateKr(def: SynthDef, args?: { trig?: UGenInputLike }): UGenInput;
export function gbmanLAr(def: SynthDef, args?: { freq?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike }): UGenInput;
export function gbmanNAr(def: SynthDef, args?: { freq?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike }): UGenInput;
export function gendy1Ar(def: SynthDef, args?: { ampdist?: UGenInputLike; durdist?: UGenInputLike; adparam?: UGenInputLike; ddparam?: UGenInputLike; minfreq?: UGenInputLike; maxfreq?: UGenInputLike; ampscale?: UGenInputLike; durscale?: UGenInputLike; initCps?: UGenInputLike; knum?: UGenInputLike }): UGenInput;
export function gendy1Kr(def: SynthDef, args?: { ampdist?: UGenInputLike; durdist?: UGenInputLike; adparam?: UGenInputLike; ddparam?: UGenInputLike; minfreq?: UGenInputLike; maxfreq?: UGenInputLike; ampscale?: UGenInputLike; durscale?: UGenInputLike; initCps?: UGenInputLike; knum?: UGenInputLike }): UGenInput;
export function gendy2Ar(def: SynthDef, args?: { ampdist?: UGenInputLike; durdist?: UGenInputLike; adparam?: UGenInputLike; ddparam?: UGenInputLike; minfreq?: UGenInputLike; maxfreq?: UGenInputLike; ampscale?: UGenInputLike; durscale?: UGenInputLike; initCps?: UGenInputLike; knum?: UGenInputLike; a?: UGenInputLike; c?: UGenInputLike }): UGenInput;
export function gendy2Kr(def: SynthDef, args?: { ampdist?: UGenInputLike; durdist?: UGenInputLike; adparam?: UGenInputLike; ddparam?: UGenInputLike; minfreq?: UGenInputLike; maxfreq?: UGenInputLike; ampscale?: UGenInputLike; durscale?: UGenInputLike; initCps?: UGenInputLike; knum?: UGenInputLike; a?: UGenInputLike; c?: UGenInputLike }): UGenInput;
export function gendy3Ar(def: SynthDef, args?: { ampdist?: UGenInputLike; durdist?: UGenInputLike; adparam?: UGenInputLike; ddparam?: UGenInputLike; freq?: UGenInputLike; ampscale?: UGenInputLike; durscale?: UGenInputLike; initCps?: UGenInputLike; knum?: UGenInputLike }): UGenInput;
export function gendy3Kr(def: SynthDef, args?: { ampdist?: UGenInputLike; durdist?: UGenInputLike; adparam?: UGenInputLike; ddparam?: UGenInputLike; freq?: UGenInputLike; ampscale?: UGenInputLike; durscale?: UGenInputLike; initCps?: UGenInputLike; knum?: UGenInputLike }): UGenInput;
export function grainBufAr(def: SynthDef, args?: { trigger?: UGenInputLike; dur?: UGenInputLike; sndbuf?: UGenInputLike; rate?: UGenInputLike; pos?: UGenInputLike; interp?: UGenInputLike; pan?: UGenInputLike; envbufnum?: UGenInputLike; maxGrains?: UGenInputLike; numChannels?: number }): UGenInput;
export function grainFmAr(def: SynthDef, args?: { trigger?: UGenInputLike; dur?: UGenInputLike; carFreq?: UGenInputLike; modFreq?: UGenInputLike; index?: UGenInputLike; pan?: UGenInputLike; envbufnum?: UGenInputLike; maxGrains?: UGenInputLike; numChannels?: number }): UGenInput;
export function grainInAr(def: SynthDef, args?: { trigger?: UGenInputLike; dur?: UGenInputLike; pan?: UGenInputLike; envbufnum?: UGenInputLike; maxGrains?: UGenInputLike; numChannels?: number }): UGenInput;
export function grainSinAr(def: SynthDef, args?: { trigger?: UGenInputLike; dur?: UGenInputLike; freq?: UGenInputLike; pan?: UGenInputLike; envbufnum?: UGenInputLike; maxGrains?: UGenInputLike; numChannels?: number }): UGenInput;
export function grayNoiseAr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function grayNoiseKr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function gVerbAr(def: SynthDef, args?: { roomsize?: UGenInputLike; revtime?: UGenInputLike; damping?: UGenInputLike; inputbw?: UGenInputLike; spread?: UGenInputLike; drylevel?: UGenInputLike; earlyreflevel?: UGenInputLike; taillevel?: UGenInputLike; maxroomsize?: UGenInputLike }): UGenInput;
export function hasherAr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function hasherKr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function henonCAr(def: SynthDef, args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; x0?: UGenInputLike; x1?: UGenInputLike }): UGenInput;
export function henonLAr(def: SynthDef, args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; x0?: UGenInputLike; x1?: UGenInputLike }): UGenInput;
export function henonNAr(def: SynthDef, args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; x0?: UGenInputLike; x1?: UGenInputLike }): UGenInput;
export function hilbertAr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function hpfAr(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function hpfKr(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function hpz1Ar(def: SynthDef, args?: Record<string, never>): UGenInput;
export function hpz1Kr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function hpz2Ar(def: SynthDef, args?: Record<string, never>): UGenInput;
export function hpz2Kr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function iEnvGenAr(def: SynthDef, args?: { ienvelope?: UGenInputLike; index?: UGenInputLike }): UGenInput;
export function iEnvGenKr(def: SynthDef, args?: { ienvelope?: UGenInputLike; index?: UGenInputLike }): UGenInput;
export function ifftAr(def: SynthDef, args?: { chain?: UGenInputLike; wintype?: UGenInputLike; winsize?: UGenInputLike }): UGenInput;
export function ifftKr(def: SynthDef, args?: { chain?: UGenInputLike; wintype?: UGenInputLike; winsize?: UGenInputLike }): UGenInput;
export function impulseAr(def: SynthDef, args?: { freq?: UGenInputLike; phase?: UGenInputLike }): UGenInput;
export function impulseKr(def: SynthDef, args?: { freq?: UGenInputLike; phase?: UGenInputLike }): UGenInput;
export function inAr(def: SynthDef, args?: { bus?: UGenInputLike; numChannels?: number }): UGenInput;
export function inKr(def: SynthDef, args?: { bus?: UGenInputLike; numChannels?: number }): UGenInput;
export function indexKr(def: SynthDef, args?: { bufnum?: UGenInputLike }): UGenInput;
export function indexAr(def: SynthDef, args?: { bufnum?: UGenInputLike }): UGenInput;
export function indexInBetweenKr(def: SynthDef, args?: { bufnum?: UGenInputLike }): UGenInput;
export function indexInBetweenAr(def: SynthDef, args?: { bufnum?: UGenInputLike }): UGenInput;
export function inFeedbackAr(def: SynthDef, args?: { bus?: UGenInputLike; numChannels?: number }): UGenInput;
export function inRangeAr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
export function inRangeKr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
export function inRangeIr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
export function inRectAr(def: SynthDef, args?: { x?: UGenInputLike; y?: UGenInputLike; left?: UGenInputLike; top?: UGenInputLike; right?: UGenInputLike; bottom?: UGenInputLike }): UGenInput;
export function inRectKr(def: SynthDef, args?: { x?: UGenInputLike; y?: UGenInputLike; left?: UGenInputLike; top?: UGenInputLike; right?: UGenInputLike; bottom?: UGenInputLike }): UGenInput;
export function integratorAr(def: SynthDef, args?: { coef?: UGenInputLike }): UGenInput;
export function integratorKr(def: SynthDef, args?: { coef?: UGenInputLike }): UGenInput;
export function inTrigKr(def: SynthDef, args?: { bus?: UGenInputLike; numChannels?: number }): UGenInput;
export function iRandIr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
export function k2AAr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function keyStateKr(def: SynthDef, args?: { keycode?: UGenInputLike; minval?: UGenInputLike; maxval?: UGenInputLike; lag?: UGenInputLike }): UGenInput;
export function keyTrackKr(def: SynthDef, args?: { chain?: UGenInputLike; keydecay?: UGenInputLike; chromaleak?: UGenInputLike }): UGenInput;
export function klangAr(def: SynthDef, args?: { specs?: UGenInputLike; freqscale?: UGenInputLike; freqoffset?: UGenInputLike }): UGenInput;
export function klankAr(def: SynthDef, args?: { specs?: UGenInputLike; input?: UGenInputLike; freqscale?: UGenInputLike; freqoffset?: UGenInputLike; decayscale?: UGenInputLike }): UGenInput;
export function lagAr(def: SynthDef, args?: { lagTime?: UGenInputLike }): UGenInput;
export function lagKr(def: SynthDef, args?: { lagTime?: UGenInputLike }): UGenInput;
export function lag2Ar(def: SynthDef, args?: { lagTime?: UGenInputLike }): UGenInput;
export function lag2Kr(def: SynthDef, args?: { lagTime?: UGenInputLike }): UGenInput;
export function lag2UdAr(def: SynthDef, args?: { lagTimeUp?: UGenInputLike; lagTimeDown?: UGenInputLike }): UGenInput;
export function lag2UdKr(def: SynthDef, args?: { lagTimeUp?: UGenInputLike; lagTimeDown?: UGenInputLike }): UGenInput;
export function lag3Ar(def: SynthDef, args?: { lagTime?: UGenInputLike }): UGenInput;
export function lag3Kr(def: SynthDef, args?: { lagTime?: UGenInputLike }): UGenInput;
export function lag3UdAr(def: SynthDef, args?: { lagTimeUp?: UGenInputLike; lagTimeDown?: UGenInputLike }): UGenInput;
export function lag3UdKr(def: SynthDef, args?: { lagTimeUp?: UGenInputLike; lagTimeDown?: UGenInputLike }): UGenInput;
export function lagInKr(def: SynthDef, args?: { bus?: UGenInputLike; lag?: UGenInputLike; numChannels?: number }): UGenInput;
export function lagUdAr(def: SynthDef, args?: { lagTimeUp?: UGenInputLike; lagTimeDown?: UGenInputLike }): UGenInput;
export function lagUdKr(def: SynthDef, args?: { lagTimeUp?: UGenInputLike; lagTimeDown?: UGenInputLike }): UGenInput;
export function lastValueAr(def: SynthDef, args?: { diff?: UGenInputLike }): UGenInput;
export function lastValueKr(def: SynthDef, args?: { diff?: UGenInputLike }): UGenInput;
export function latchAr(def: SynthDef, args?: { trig?: UGenInputLike }): UGenInput;
export function latchKr(def: SynthDef, args?: { trig?: UGenInputLike }): UGenInput;
export function latoocarfianCAr(def: SynthDef, args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; c?: UGenInputLike; d?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike }): UGenInput;
export function latoocarfianLAr(def: SynthDef, args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; c?: UGenInputLike; d?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike }): UGenInput;
export function latoocarfianNAr(def: SynthDef, args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; c?: UGenInputLike; d?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike }): UGenInput;
export function leakDcAr(def: SynthDef, args?: { coef?: UGenInputLike }): UGenInput;
export function leakDcKr(def: SynthDef, args?: { coef?: UGenInputLike }): UGenInput;
export function leastChangeAr(def: SynthDef, args?: { a?: UGenInputLike; b?: UGenInputLike }): UGenInput;
export function leastChangeKr(def: SynthDef, args?: { a?: UGenInputLike; b?: UGenInputLike }): UGenInput;
export function lfClipNoiseAr(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function lfClipNoiseKr(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function lfCubAr(def: SynthDef, args?: { freq?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
export function lfCubKr(def: SynthDef, args?: { freq?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
export function lfdClipNoiseAr(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function lfdClipNoiseKr(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function lfdNoise0Ar(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function lfdNoise0Kr(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function lfdNoise1Ar(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function lfdNoise1Kr(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function lfdNoise3Ar(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function lfdNoise3Kr(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function lfGaussAr(def: SynthDef, args?: { duration?: UGenInputLike; width?: UGenInputLike; iphase?: UGenInputLike; action?: UGenInputLike }): UGenInput;
export function lfGaussKr(def: SynthDef, args?: { duration?: UGenInputLike; width?: UGenInputLike; iphase?: UGenInputLike; action?: UGenInputLike }): UGenInput;
export function lfNoise0Ar(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function lfNoise0Kr(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function lfNoise1Ar(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function lfNoise1Kr(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function lfNoise2Ar(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function lfNoise2Kr(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function lfParAr(def: SynthDef, args?: { freq?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
export function lfParKr(def: SynthDef, args?: { freq?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
export function lfPulseAr(def: SynthDef, args?: { freq?: UGenInputLike; iphase?: UGenInputLike; width?: UGenInputLike }): UGenInput;
export function lfPulseKr(def: SynthDef, args?: { freq?: UGenInputLike; iphase?: UGenInputLike; width?: UGenInputLike }): UGenInput;
export function lfSawAr(def: SynthDef, args?: { freq?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
export function lfSawKr(def: SynthDef, args?: { freq?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
export function lfTriAr(def: SynthDef, args?: { freq?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
export function lfTriKr(def: SynthDef, args?: { freq?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
export function limiterAr(def: SynthDef, args?: { level?: UGenInputLike; dur?: UGenInputLike }): UGenInput;
export function linCongCAr(def: SynthDef, args?: { freq?: UGenInputLike; a?: UGenInputLike; c?: UGenInputLike; m?: UGenInputLike; xi?: UGenInputLike }): UGenInput;
export function linCongLAr(def: SynthDef, args?: { freq?: UGenInputLike; a?: UGenInputLike; c?: UGenInputLike; m?: UGenInputLike; xi?: UGenInputLike }): UGenInput;
export function linCongNAr(def: SynthDef, args?: { freq?: UGenInputLike; a?: UGenInputLike; c?: UGenInputLike; m?: UGenInputLike; xi?: UGenInputLike }): UGenInput;
export function lineAr(def: SynthDef, args?: { start?: UGenInputLike; end?: UGenInputLike; dur?: UGenInputLike; action?: UGenInputLike }): UGenInput;
export function lineKr(def: SynthDef, args?: { start?: UGenInputLike; end?: UGenInputLike; dur?: UGenInputLike; action?: UGenInputLike }): UGenInput;
export function linenKr(def: SynthDef, args?: { gate?: UGenInputLike; attackTime?: UGenInputLike; susLevel?: UGenInputLike; releaseTime?: UGenInputLike; action?: UGenInputLike }): UGenInput;
export function linExpAr(def: SynthDef, args?: { srclo?: UGenInputLike; srchi?: UGenInputLike; dstlo?: UGenInputLike; dsthi?: UGenInputLike }): UGenInput;
export function linExpKr(def: SynthDef, args?: { srclo?: UGenInputLike; srchi?: UGenInputLike; dstlo?: UGenInputLike; dsthi?: UGenInputLike }): UGenInput;
export function linPan2Ar(def: SynthDef, args?: { pos?: UGenInputLike; level?: UGenInputLike }): UGenInput;
export function linPan2Kr(def: SynthDef, args?: { pos?: UGenInputLike; level?: UGenInputLike }): UGenInput;
export function linRandIr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike; minmax?: UGenInputLike }): UGenInput;
export function linXFade2Ar(def: SynthDef, args?: { inA?: UGenInputLike; inB?: UGenInputLike; pan?: UGenInputLike; level?: UGenInputLike }): UGenInput;
export function linXFade2Kr(def: SynthDef, args?: { inA?: UGenInputLike; inB?: UGenInputLike; pan?: UGenInputLike; level?: UGenInputLike }): UGenInput;
export function localBufIr(def: SynthDef, args?: { numFrames?: UGenInputLike; numChannels?: number }): UGenInput;
export function localInAr(def: SynthDef, args?: { numChannels?: number }): UGenInput;
export function localInKr(def: SynthDef, args?: { numChannels?: number }): UGenInput;
export function localOutAr(def: SynthDef, args?: { channelsArray?: UGenInputLike[] }): UGenInput;
export function localOutKr(def: SynthDef, args?: { channelsArray?: UGenInputLike[] }): UGenInput;
export function logisticAr(def: SynthDef, args?: { chaosParam?: UGenInputLike; freq?: UGenInputLike; init?: UGenInputLike }): UGenInput;
export function logisticKr(def: SynthDef, args?: { chaosParam?: UGenInputLike; freq?: UGenInputLike; init?: UGenInputLike }): UGenInput;
export function lorenzLAr(def: SynthDef, args?: { freq?: UGenInputLike; s?: UGenInputLike; r?: UGenInputLike; b?: UGenInputLike; h?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike; zi?: UGenInputLike }): UGenInput;
export function loudnessKr(def: SynthDef, args?: { chain?: UGenInputLike; smask?: UGenInputLike; tmask?: UGenInputLike }): UGenInput;
export function lpfAr(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function lpfKr(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function lpz1Ar(def: SynthDef, args?: Record<string, never>): UGenInput;
export function lpz1Kr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function lpz2Ar(def: SynthDef, args?: Record<string, never>): UGenInput;
export function lpz2Kr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function mantissaMaskAr(def: SynthDef, args?: { bits?: UGenInputLike }): UGenInput;
export function mantissaMaskKr(def: SynthDef, args?: { bits?: UGenInputLike }): UGenInput;
export function maxLocalBufsIr(def: SynthDef, args?: { numLocalBufs?: UGenInputLike }): UGenInput;
export function medianAr(def: SynthDef, args?: { length?: UGenInputLike }): UGenInput;
export function medianKr(def: SynthDef, args?: { length?: UGenInputLike }): UGenInput;
export function mfccKr(def: SynthDef, args?: { chain?: UGenInputLike; numcoeff?: UGenInputLike }): UGenInput;
export function midEqAr(def: SynthDef, args?: { freq?: UGenInputLike; rq?: UGenInputLike; db?: UGenInputLike }): UGenInput;
export function midEqKr(def: SynthDef, args?: { freq?: UGenInputLike; rq?: UGenInputLike; db?: UGenInputLike }): UGenInput;
export function moogFfAr(def: SynthDef, args?: { freq?: UGenInputLike; gain?: UGenInputLike; reset?: UGenInputLike }): UGenInput;
export function moogFfKr(def: SynthDef, args?: { freq?: UGenInputLike; gain?: UGenInputLike; reset?: UGenInputLike }): UGenInput;
export function mostChangeAr(def: SynthDef, args?: { a?: UGenInputLike; b?: UGenInputLike }): UGenInput;
export function mostChangeKr(def: SynthDef, args?: { a?: UGenInputLike; b?: UGenInputLike }): UGenInput;
export function mouseButtonKr(def: SynthDef, args?: { up?: UGenInputLike; down?: UGenInputLike; lag?: UGenInputLike }): UGenInput;
export function mouseXKr(def: SynthDef, args?: { min?: UGenInputLike; max?: UGenInputLike; warp?: UGenInputLike; lag?: UGenInputLike }): UGenInput;
export function mouseYKr(def: SynthDef, args?: { min?: UGenInputLike; max?: UGenInputLike; warp?: UGenInputLike; lag?: UGenInputLike }): UGenInput;
export function mulAddIr(def: SynthDef, args?: { mul?: UGenInputLike; add?: UGenInputLike }): UGenInput;
export function mulAddAr(def: SynthDef, args?: { mul?: UGenInputLike; add?: UGenInputLike }): UGenInput;
export function mulAddKr(def: SynthDef, args?: { mul?: UGenInputLike; add?: UGenInputLike }): UGenInput;
export function normalizerAr(def: SynthDef, args?: { level?: UGenInputLike; dur?: UGenInputLike }): UGenInput;
export function nRandIr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike; n?: UGenInputLike }): UGenInput;
export function numAudioBusesIr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function numBuffersIr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function numControlBusesIr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function numInputBusesIr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function numOutputBusesIr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function numRunningSynthsIr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function numRunningSynthsKr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function offsetOutAr(def: SynthDef, args?: { bus?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
export function offsetOutKr(def: SynthDef, args?: { bus?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
export function onePoleAr(def: SynthDef, args?: { coef?: UGenInputLike }): UGenInput;
export function onePoleKr(def: SynthDef, args?: { coef?: UGenInputLike }): UGenInput;
export function oneZeroAr(def: SynthDef, args?: { coef?: UGenInputLike }): UGenInput;
export function oneZeroKr(def: SynthDef, args?: { coef?: UGenInputLike }): UGenInput;
export function onsetsKr(def: SynthDef, args?: { chain?: UGenInputLike; threshold?: UGenInputLike; odftype?: UGenInputLike; relaxtime?: UGenInputLike; floor?: UGenInputLike; mingap?: UGenInputLike; medianspan?: UGenInputLike; whtype?: UGenInputLike; rawodf?: UGenInputLike }): UGenInput;
export function oscAr(def: SynthDef, args?: { buffer?: UGenInputLike; freq?: UGenInputLike; phase?: UGenInputLike }): UGenInput;
export function oscKr(def: SynthDef, args?: { buffer?: UGenInputLike; freq?: UGenInputLike; phase?: UGenInputLike }): UGenInput;
export function outAr(def: SynthDef, args?: { bus?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
export function outKr(def: SynthDef, args?: { bus?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
export function pan2Ar(def: SynthDef, args?: { pos?: UGenInputLike; level?: UGenInputLike }): UGenInput;
export function pan2Kr(def: SynthDef, args?: { pos?: UGenInputLike; level?: UGenInputLike }): UGenInput;
export function pan4Ar(def: SynthDef, args?: { xpos?: UGenInputLike; ypos?: UGenInputLike; level?: UGenInputLike }): UGenInput;
export function pan4Kr(def: SynthDef, args?: { xpos?: UGenInputLike; ypos?: UGenInputLike; level?: UGenInputLike }): UGenInput;
export function panAzAr(def: SynthDef, args?: { pos?: UGenInputLike; level?: UGenInputLike; width?: UGenInputLike; orientation?: UGenInputLike; numChannels?: number }): UGenInput;
export function panAzKr(def: SynthDef, args?: { pos?: UGenInputLike; level?: UGenInputLike; width?: UGenInputLike; orientation?: UGenInputLike; numChannels?: number }): UGenInput;
export function panBAr(def: SynthDef, args?: { azimuth?: UGenInputLike; elevation?: UGenInputLike; gain?: UGenInputLike }): UGenInput;
export function panBKr(def: SynthDef, args?: { azimuth?: UGenInputLike; elevation?: UGenInputLike; gain?: UGenInputLike }): UGenInput;
export function panB2Ar(def: SynthDef, args?: { azimuth?: UGenInputLike; gain?: UGenInputLike }): UGenInput;
export function panB2Kr(def: SynthDef, args?: { azimuth?: UGenInputLike; gain?: UGenInputLike }): UGenInput;
export function partConvAr(def: SynthDef, args?: { fftsize?: UGenInputLike; irbufnum?: UGenInputLike }): UGenInput;
export function pauseKr(def: SynthDef, args?: { gate?: UGenInputLike; id?: UGenInputLike }): UGenInput;
export function pauseSelfKr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function pauseSelfWhenDoneKr(def: SynthDef, args?: { src?: UGenInputLike }): UGenInput;
export function peakAr(def: SynthDef, args?: { trig?: UGenInputLike; reset?: UGenInputLike }): UGenInput;
export function peakKr(def: SynthDef, args?: { trig?: UGenInputLike; reset?: UGenInputLike }): UGenInput;
export function peakFollowerAr(def: SynthDef, args?: { decay?: UGenInputLike }): UGenInput;
export function peakFollowerKr(def: SynthDef, args?: { decay?: UGenInputLike }): UGenInput;
export function phasorAr(def: SynthDef, args?: { trig?: UGenInputLike; rate?: UGenInputLike; start?: UGenInputLike; end?: UGenInputLike; resetPos?: UGenInputLike }): UGenInput;
export function phasorKr(def: SynthDef, args?: { trig?: UGenInputLike; rate?: UGenInputLike; start?: UGenInputLike; end?: UGenInputLike; resetPos?: UGenInputLike }): UGenInput;
export function pinkNoiseAr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function pinkNoiseKr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function pitchKr(def: SynthDef, args?: { initFreq?: UGenInputLike; minFreq?: UGenInputLike; maxFreq?: UGenInputLike; execFreq?: UGenInputLike; maxBinsPerOctave?: UGenInputLike; median?: UGenInputLike; ampThreshold?: UGenInputLike; peakThreshold?: UGenInputLike; downSample?: UGenInputLike; clar?: UGenInputLike }): UGenInput;
export function pitchShiftAr(def: SynthDef, args?: { windowSize?: UGenInputLike; pitchRatio?: UGenInputLike; pitchDispersion?: UGenInputLike; timeDispersion?: UGenInputLike }): UGenInput;
export function playBufAr(def: SynthDef, args?: { bufnum?: UGenInputLike; rate?: UGenInputLike; trigger?: UGenInputLike; startPos?: UGenInputLike; action?: UGenInputLike; numChannels?: number }): UGenInput;
export function playBufKr(def: SynthDef, args?: { bufnum?: UGenInputLike; rate?: UGenInputLike; trigger?: UGenInputLike; startPos?: UGenInputLike; action?: UGenInputLike; numChannels?: number }): UGenInput;
export function pluckAr(def: SynthDef, args?: { trig?: UGenInputLike; maxdelaytime?: UGenInputLike; delaytime?: UGenInputLike; decaytime?: UGenInputLike; coef?: UGenInputLike }): UGenInput;
export function pollAr(def: SynthDef, args?: { trig?: UGenInputLike; label?: UGenInputLike; trigId?: UGenInputLike }): UGenInput;
export function pollKr(def: SynthDef, args?: { trig?: UGenInputLike; label?: UGenInputLike; trigId?: UGenInputLike }): UGenInput;
export function pSinGrainAr(def: SynthDef, args?: { freq?: UGenInputLike; dur?: UGenInputLike; amp?: UGenInputLike }): UGenInput;
export function pulseAr(def: SynthDef, args?: { freq?: UGenInputLike; width?: UGenInputLike }): UGenInput;
export function pulseKr(def: SynthDef, args?: { freq?: UGenInputLike; width?: UGenInputLike }): UGenInput;
export function pulseCountAr(def: SynthDef, args?: { trig?: UGenInputLike; reset?: UGenInputLike }): UGenInput;
export function pulseCountKr(def: SynthDef, args?: { trig?: UGenInputLike; reset?: UGenInputLike }): UGenInput;
export function pulseDividerAr(def: SynthDef, args?: { trig?: UGenInputLike; div?: UGenInputLike; startVal?: UGenInputLike }): UGenInput;
export function pulseDividerKr(def: SynthDef, args?: { trig?: UGenInputLike; div?: UGenInputLike; startVal?: UGenInputLike }): UGenInput;
export function pvAddKr(def: SynthDef, args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike }): UGenInput;
export function pvBinScrambleKr(def: SynthDef, args?: { buffer?: UGenInputLike; wipe?: UGenInputLike; width?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
export function pvBinShiftKr(def: SynthDef, args?: { buffer?: UGenInputLike; stretch?: UGenInputLike; shift?: UGenInputLike }): UGenInput;
export function pvBinWipeKr(def: SynthDef, args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike; wipe?: UGenInputLike }): UGenInput;
export function pvBrickWallKr(def: SynthDef, args?: { buffer?: UGenInputLike; wipe?: UGenInputLike }): UGenInput;
export function pvConformalMapKr(def: SynthDef, args?: { buffer?: UGenInputLike; areal?: UGenInputLike; aimag?: UGenInputLike }): UGenInput;
export function pvConjKr(def: SynthDef, args?: { buffer?: UGenInputLike }): UGenInput;
export function pvCopyKr(def: SynthDef, args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike }): UGenInput;
export function pvCopyPhaseKr(def: SynthDef, args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike }): UGenInput;
export function pvDiffuserKr(def: SynthDef, args?: { buffer?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
export function pvDivKr(def: SynthDef, args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike }): UGenInput;
export function pvHainsworthFooteAr(def: SynthDef, args?: { buffer?: UGenInputLike; proph?: UGenInputLike; propf?: UGenInputLike; threshold?: UGenInputLike; waitTime?: UGenInputLike }): UGenInput;
export function pvJensenAndersenAr(def: SynthDef, args?: { buffer?: UGenInputLike; propsc?: UGenInputLike; prophfe?: UGenInputLike; prophfc?: UGenInputLike; propsf?: UGenInputLike; threshold?: UGenInputLike; waitTime?: UGenInputLike }): UGenInput;
export function pvLocalMaxKr(def: SynthDef, args?: { buffer?: UGenInputLike; threshold?: UGenInputLike }): UGenInput;
export function pvMagAboveKr(def: SynthDef, args?: { buffer?: UGenInputLike; threshold?: UGenInputLike }): UGenInput;
export function pvMagBelowKr(def: SynthDef, args?: { buffer?: UGenInputLike; threshold?: UGenInputLike }): UGenInput;
export function pvMagClipKr(def: SynthDef, args?: { buffer?: UGenInputLike; threshold?: UGenInputLike }): UGenInput;
export function pvMagDivKr(def: SynthDef, args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike; zeroed?: UGenInputLike }): UGenInput;
export function pvMagFreezeKr(def: SynthDef, args?: { buffer?: UGenInputLike; freeze?: UGenInputLike }): UGenInput;
export function pvMagMulKr(def: SynthDef, args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike }): UGenInput;
export function pvMagNoiseKr(def: SynthDef, args?: { buffer?: UGenInputLike }): UGenInput;
export function pvMagShiftKr(def: SynthDef, args?: { buffer?: UGenInputLike; stretch?: UGenInputLike; shift?: UGenInputLike }): UGenInput;
export function pvMagSmearKr(def: SynthDef, args?: { buffer?: UGenInputLike; bins?: UGenInputLike }): UGenInput;
export function pvMagSquaredKr(def: SynthDef, args?: { buffer?: UGenInputLike }): UGenInput;
export function pvMaxKr(def: SynthDef, args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike }): UGenInput;
export function pvMinKr(def: SynthDef, args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike }): UGenInput;
export function pvMulKr(def: SynthDef, args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike }): UGenInput;
export function pvPhaseShiftKr(def: SynthDef, args?: { buffer?: UGenInputLike; shift?: UGenInputLike }): UGenInput;
export function pvPhaseShift270Kr(def: SynthDef, args?: { buffer?: UGenInputLike }): UGenInput;
export function pvPhaseShift90Kr(def: SynthDef, args?: { buffer?: UGenInputLike }): UGenInput;
export function pvRandCombKr(def: SynthDef, args?: { buffer?: UGenInputLike; wipe?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
export function pvRandWipeKr(def: SynthDef, args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike; wipe?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
export function pvRectCombKr(def: SynthDef, args?: { buffer?: UGenInputLike; numTeeth?: UGenInputLike; phase?: UGenInputLike; width?: UGenInputLike }): UGenInput;
export function pvRectComb2Kr(def: SynthDef, args?: { bufferA?: UGenInputLike; bufferB?: UGenInputLike; numTeeth?: UGenInputLike; phase?: UGenInputLike; width?: UGenInputLike }): UGenInput;
export function quadCAr(def: SynthDef, args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; c?: UGenInputLike; xi?: UGenInputLike }): UGenInput;
export function quadLAr(def: SynthDef, args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; c?: UGenInputLike; xi?: UGenInputLike }): UGenInput;
export function quadNAr(def: SynthDef, args?: { freq?: UGenInputLike; a?: UGenInputLike; b?: UGenInputLike; c?: UGenInputLike; xi?: UGenInputLike }): UGenInput;
export function radiansPerSampleIr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function rampAr(def: SynthDef, args?: { lagTime?: UGenInputLike }): UGenInput;
export function rampKr(def: SynthDef, args?: { lagTime?: UGenInputLike }): UGenInput;
export function randIr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
export function randIdIr(def: SynthDef, args?: { seed?: UGenInputLike }): UGenInput;
export function randIdKr(def: SynthDef, args?: { seed?: UGenInputLike }): UGenInput;
export function randSeedIr(def: SynthDef, args?: { trig?: UGenInputLike; seed?: UGenInputLike }): UGenInput;
export function randSeedKr(def: SynthDef, args?: { trig?: UGenInputLike; seed?: UGenInputLike }): UGenInput;
export function randSeedAr(def: SynthDef, args?: { trig?: UGenInputLike; seed?: UGenInputLike }): UGenInput;
export function recordBufAr(def: SynthDef, args?: { bufnum?: UGenInputLike; offset?: UGenInputLike; recLevel?: UGenInputLike; preLevel?: UGenInputLike; run?: UGenInputLike; trigger?: UGenInputLike; action?: UGenInputLike; inputArray?: UGenInputLike[] }): UGenInput;
export function recordBufKr(def: SynthDef, args?: { bufnum?: UGenInputLike; offset?: UGenInputLike; recLevel?: UGenInputLike; preLevel?: UGenInputLike; run?: UGenInputLike; trigger?: UGenInputLike; action?: UGenInputLike; inputArray?: UGenInputLike[] }): UGenInput;
export function replaceOutAr(def: SynthDef, args?: { bus?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
export function replaceOutKr(def: SynthDef, args?: { bus?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
export function resonzAr(def: SynthDef, args?: { freq?: UGenInputLike; bwr?: UGenInputLike }): UGenInput;
export function resonzKr(def: SynthDef, args?: { freq?: UGenInputLike; bwr?: UGenInputLike }): UGenInput;
export function rhpfAr(def: SynthDef, args?: { freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
export function rhpfKr(def: SynthDef, args?: { freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
export function ringzAr(def: SynthDef, args?: { freq?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function ringzKr(def: SynthDef, args?: { freq?: UGenInputLike; decayTime?: UGenInputLike }): UGenInput;
export function rlpfAr(def: SynthDef, args?: { freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
export function rlpfKr(def: SynthDef, args?: { freq?: UGenInputLike; rq?: UGenInputLike }): UGenInput;
export function rotate2Ar(def: SynthDef, args?: { x?: UGenInputLike; y?: UGenInputLike; pos?: UGenInputLike }): UGenInput;
export function rotate2Kr(def: SynthDef, args?: { x?: UGenInputLike; y?: UGenInputLike; pos?: UGenInputLike }): UGenInput;
export function runningMaxAr(def: SynthDef, args?: { trig?: UGenInputLike }): UGenInput;
export function runningMaxKr(def: SynthDef, args?: { trig?: UGenInputLike }): UGenInput;
export function runningMinAr(def: SynthDef, args?: { trig?: UGenInputLike }): UGenInput;
export function runningMinKr(def: SynthDef, args?: { trig?: UGenInputLike }): UGenInput;
export function runningSumAr(def: SynthDef, args?: { numsamp?: UGenInputLike }): UGenInput;
export function runningSumKr(def: SynthDef, args?: { numsamp?: UGenInputLike }): UGenInput;
export function sampleDurIr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function sampleRateIr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function sawAr(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function sawKr(def: SynthDef, args?: { freq?: UGenInputLike }): UGenInput;
export function schmidtAr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
export function schmidtKr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
export function scopeOutAr(def: SynthDef, args?: { bufnum?: UGenInputLike; inputArray?: UGenInputLike[] }): UGenInput;
export function scopeOutKr(def: SynthDef, args?: { bufnum?: UGenInputLike; inputArray?: UGenInputLike[] }): UGenInput;
export function scopeOut2Ar(def: SynthDef, args?: { scopeNum?: UGenInputLike; maxFrames?: UGenInputLike; scopeFrames?: UGenInputLike; inputArray?: UGenInputLike[] }): UGenInput;
export function scopeOut2Kr(def: SynthDef, args?: { scopeNum?: UGenInputLike; maxFrames?: UGenInputLike; scopeFrames?: UGenInputLike; inputArray?: UGenInputLike[] }): UGenInput;
export function selectAr(def: SynthDef, args?: { which?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
export function selectKr(def: SynthDef, args?: { which?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
export function sendReplyAr(def: SynthDef, args?: { trig?: UGenInputLike; cmdName?: UGenInputLike; values?: UGenInputLike; replyId?: UGenInputLike }): UGenInput;
export function sendReplyKr(def: SynthDef, args?: { trig?: UGenInputLike; cmdName?: UGenInputLike; values?: UGenInputLike; replyId?: UGenInputLike }): UGenInput;
export function sendTrigAr(def: SynthDef, args?: { id?: UGenInputLike; value?: UGenInputLike }): UGenInput;
export function sendTrigKr(def: SynthDef, args?: { id?: UGenInputLike; value?: UGenInputLike }): UGenInput;
export function setBufAr(def: SynthDef, args?: { buf?: UGenInputLike; values?: UGenInputLike; offset?: UGenInputLike }): UGenInput;
export function setBufKr(def: SynthDef, args?: { buf?: UGenInputLike; values?: UGenInputLike; offset?: UGenInputLike }): UGenInput;
export function setResetFfAr(def: SynthDef, args?: { trig?: UGenInputLike; reset?: UGenInputLike }): UGenInput;
export function setResetFfKr(def: SynthDef, args?: { trig?: UGenInputLike; reset?: UGenInputLike }): UGenInput;
export function shaperKr(def: SynthDef, args?: { bufnum?: UGenInputLike }): UGenInput;
export function shaperAr(def: SynthDef, args?: { bufnum?: UGenInputLike }): UGenInput;
export function sharedInKr(def: SynthDef, args?: { bus?: UGenInputLike; numChannels?: number }): UGenInput;
export function sharedOutKr(def: SynthDef, args?: { bus?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
export function silentAr(def: SynthDef, args?: { numChannels?: number }): UGenInput;
export function sinOscAr(def: SynthDef, args?: { freq?: UGenInputLike; phase?: UGenInputLike }): UGenInput;
export function sinOscKr(def: SynthDef, args?: { freq?: UGenInputLike; phase?: UGenInputLike }): UGenInput;
export function sinOscFbAr(def: SynthDef, args?: { freq?: UGenInputLike; feedback?: UGenInputLike }): UGenInput;
export function sinOscFbKr(def: SynthDef, args?: { freq?: UGenInputLike; feedback?: UGenInputLike }): UGenInput;
export function slewAr(def: SynthDef, args?: { up?: UGenInputLike; dn?: UGenInputLike }): UGenInput;
export function slewKr(def: SynthDef, args?: { up?: UGenInputLike; dn?: UGenInputLike }): UGenInput;
export function slopeAr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function slopeKr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function sosAr(def: SynthDef, args?: { a0?: UGenInputLike; a1?: UGenInputLike; a2?: UGenInputLike; b1?: UGenInputLike; b2?: UGenInputLike }): UGenInput;
export function sosKr(def: SynthDef, args?: { a0?: UGenInputLike; a1?: UGenInputLike; a2?: UGenInputLike; b1?: UGenInputLike; b2?: UGenInputLike }): UGenInput;
export function specCentroidKr(def: SynthDef, args?: { chain?: UGenInputLike }): UGenInput;
export function specFlatnessKr(def: SynthDef, args?: { chain?: UGenInputLike }): UGenInput;
export function specPcileKr(def: SynthDef, args?: { chain?: UGenInputLike; fraction?: UGenInputLike; interpolate?: UGenInputLike }): UGenInput;
export function springAr(def: SynthDef, args?: { spring?: UGenInputLike; damp?: UGenInputLike }): UGenInput;
export function springKr(def: SynthDef, args?: { spring?: UGenInputLike; damp?: UGenInputLike }): UGenInput;
export function standardLAr(def: SynthDef, args?: { freq?: UGenInputLike; k?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike }): UGenInput;
export function standardNAr(def: SynthDef, args?: { freq?: UGenInputLike; k?: UGenInputLike; xi?: UGenInputLike; yi?: UGenInputLike }): UGenInput;
export function stepperAr(def: SynthDef, args?: { trig?: UGenInputLike; reset?: UGenInputLike; min?: UGenInputLike; max?: UGenInputLike; step?: UGenInputLike; resetval?: UGenInputLike }): UGenInput;
export function stepperKr(def: SynthDef, args?: { trig?: UGenInputLike; reset?: UGenInputLike; min?: UGenInputLike; max?: UGenInputLike; step?: UGenInputLike; resetval?: UGenInputLike }): UGenInput;
export function stereoConvolution2LAr(def: SynthDef, args?: { kernelL?: UGenInputLike; kernelR?: UGenInputLike; trigger?: UGenInputLike; framesize?: UGenInputLike; crossfade?: UGenInputLike }): UGenInput;
export function subsampleOffsetIr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function sweepAr(def: SynthDef, args?: { trig?: UGenInputLike; rate?: UGenInputLike }): UGenInput;
export function sweepKr(def: SynthDef, args?: { trig?: UGenInputLike; rate?: UGenInputLike }): UGenInput;
export function syncSawAr(def: SynthDef, args?: { syncFreq?: UGenInputLike; sawFreq?: UGenInputLike }): UGenInput;
export function syncSawKr(def: SynthDef, args?: { syncFreq?: UGenInputLike; sawFreq?: UGenInputLike }): UGenInput;
export function t2AAr(def: SynthDef, args?: { offset?: UGenInputLike }): UGenInput;
export function t2KKr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function tBallAr(def: SynthDef, args?: { g?: UGenInputLike; damp?: UGenInputLike; friction?: UGenInputLike }): UGenInput;
export function tBallKr(def: SynthDef, args?: { g?: UGenInputLike; damp?: UGenInputLike; friction?: UGenInputLike }): UGenInput;
export function tDelayAr(def: SynthDef, args?: { trig?: UGenInputLike; dur?: UGenInputLike }): UGenInput;
export function tDelayKr(def: SynthDef, args?: { trig?: UGenInputLike; dur?: UGenInputLike }): UGenInput;
export function tDutyAr(def: SynthDef, args?: { dur?: UGenInputLike; reset?: UGenInputLike; action?: UGenInputLike; level?: UGenInputLike; gapFirst?: UGenInputLike }): UGenInput;
export function tDutyKr(def: SynthDef, args?: { dur?: UGenInputLike; reset?: UGenInputLike; action?: UGenInputLike; level?: UGenInputLike; gapFirst?: UGenInputLike }): UGenInput;
export function tExpRandAr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
export function tExpRandKr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
export function tGrainsAr(def: SynthDef, args?: { trigger?: UGenInputLike; bufnum?: UGenInputLike; rate?: UGenInputLike; centerPos?: UGenInputLike; dur?: UGenInputLike; pan?: UGenInputLike; amp?: UGenInputLike; interp?: UGenInputLike; numChannels?: number }): UGenInput;
export function timerAr(def: SynthDef, args?: { trig?: UGenInputLike }): UGenInput;
export function timerKr(def: SynthDef, args?: { trig?: UGenInputLike }): UGenInput;
export function tiRandKr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
export function tiRandAr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
export function toggleFfAr(def: SynthDef, args?: { trig?: UGenInputLike }): UGenInput;
export function toggleFfKr(def: SynthDef, args?: { trig?: UGenInputLike }): UGenInput;
export function tRandKr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
export function tRandAr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike; trig?: UGenInputLike }): UGenInput;
export function trapezoidAr(def: SynthDef, args?: { a?: UGenInputLike; b?: UGenInputLike; c?: UGenInputLike; d?: UGenInputLike }): UGenInput;
export function trapezoidKr(def: SynthDef, args?: { a?: UGenInputLike; b?: UGenInputLike; c?: UGenInputLike; d?: UGenInputLike }): UGenInput;
export function trigAr(def: SynthDef, args?: { trig?: UGenInputLike; dur?: UGenInputLike }): UGenInput;
export function trigKr(def: SynthDef, args?: { trig?: UGenInputLike; dur?: UGenInputLike }): UGenInput;
export function trig1Ar(def: SynthDef, args?: { trig?: UGenInputLike; dur?: UGenInputLike }): UGenInput;
export function trig1Kr(def: SynthDef, args?: { trig?: UGenInputLike; dur?: UGenInputLike }): UGenInput;
export function tWindexAr(def: SynthDef, args?: { trig?: UGenInputLike; normalize?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
export function tWindexKr(def: SynthDef, args?: { trig?: UGenInputLike; normalize?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
export function twoPoleAr(def: SynthDef, args?: { freq?: UGenInputLike; radius?: UGenInputLike }): UGenInput;
export function twoPoleKr(def: SynthDef, args?: { freq?: UGenInputLike; radius?: UGenInputLike }): UGenInput;
export function twoZeroAr(def: SynthDef, args?: { freq?: UGenInputLike; radius?: UGenInputLike }): UGenInput;
export function twoZeroKr(def: SynthDef, args?: { freq?: UGenInputLike; radius?: UGenInputLike }): UGenInput;
export function varSawAr(def: SynthDef, args?: { freq?: UGenInputLike; iphase?: UGenInputLike; width?: UGenInputLike }): UGenInput;
export function varSawKr(def: SynthDef, args?: { freq?: UGenInputLike; iphase?: UGenInputLike; width?: UGenInputLike }): UGenInput;
export function vDiskInAr(def: SynthDef, args?: { bufnum?: UGenInputLike; rate?: UGenInputLike; sendId?: UGenInputLike; numChannels?: number }): UGenInput;
export function vibratoAr(def: SynthDef, args?: { freq?: UGenInputLike; rate?: UGenInputLike; depth?: UGenInputLike; delay?: UGenInputLike; onset?: UGenInputLike; rateVariation?: UGenInputLike; depthVariation?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
export function vibratoKr(def: SynthDef, args?: { freq?: UGenInputLike; rate?: UGenInputLike; depth?: UGenInputLike; delay?: UGenInputLike; onset?: UGenInputLike; rateVariation?: UGenInputLike; depthVariation?: UGenInputLike; iphase?: UGenInputLike }): UGenInput;
export function vOscAr(def: SynthDef, args?: { bufpos?: UGenInputLike; freq?: UGenInputLike; phase?: UGenInputLike }): UGenInput;
export function vOscKr(def: SynthDef, args?: { bufpos?: UGenInputLike; freq?: UGenInputLike; phase?: UGenInputLike }): UGenInput;
export function vOsc3Ar(def: SynthDef, args?: { bufpos?: UGenInputLike; freq1?: UGenInputLike; freq2?: UGenInputLike; freq3?: UGenInputLike }): UGenInput;
export function vOsc3Kr(def: SynthDef, args?: { bufpos?: UGenInputLike; freq1?: UGenInputLike; freq2?: UGenInputLike; freq3?: UGenInputLike }): UGenInput;
export function warp1Ar(def: SynthDef, args?: { bufnum?: UGenInputLike; pointer?: UGenInputLike; freqScale?: UGenInputLike; windowSize?: UGenInputLike; envbufnum?: UGenInputLike; overlaps?: UGenInputLike; windowRandRatio?: UGenInputLike; interp?: UGenInputLike; numChannels?: number }): UGenInput;
export function whiteNoiseAr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function whiteNoiseKr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function wrapAr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
export function wrapKr(def: SynthDef, args?: { lo?: UGenInputLike; hi?: UGenInputLike }): UGenInput;
export function wrapIndexKr(def: SynthDef, args?: { bufnum?: UGenInputLike }): UGenInput;
export function wrapIndexAr(def: SynthDef, args?: { bufnum?: UGenInputLike }): UGenInput;
export function xFade2Ar(def: SynthDef, args?: { inA?: UGenInputLike; inB?: UGenInputLike; pan?: UGenInputLike; level?: UGenInputLike }): UGenInput;
export function xFade2Kr(def: SynthDef, args?: { inA?: UGenInputLike; inB?: UGenInputLike; pan?: UGenInputLike; level?: UGenInputLike }): UGenInput;
export function xLineAr(def: SynthDef, args?: { start?: UGenInputLike; end?: UGenInputLike; dur?: UGenInputLike; action?: UGenInputLike }): UGenInput;
export function xLineKr(def: SynthDef, args?: { start?: UGenInputLike; end?: UGenInputLike; dur?: UGenInputLike; action?: UGenInputLike }): UGenInput;
export function xOutAr(def: SynthDef, args?: { bus?: UGenInputLike; xfade?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
export function xOutKr(def: SynthDef, args?: { bus?: UGenInputLike; xfade?: UGenInputLike; channelsArray?: UGenInputLike[] }): UGenInput;
export function zeroCrossingAr(def: SynthDef, args?: Record<string, never>): UGenInput;
export function zeroCrossingKr(def: SynthDef, args?: Record<string, never>): UGenInput;
"#;
