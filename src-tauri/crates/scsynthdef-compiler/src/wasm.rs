//! The wasm binding layer (feature `wasm`): wasm-bindgen exports over the
//! compiler, built by `yarn generate:synthdef-compiler` (wasm-pack) into
//! `packages/synthdef-compiler/pkg`. The typed per-UGen builder surface
//! lives in `ugens/wasm.rs` (hand helpers + the generated `wasm_gen.rs`
//! invocation); this file owns the hand-written core: the `SynthDef`
//! class (with the ambient graph-callback constructor), the operator
//! lookups, and the envelope build/encode functions.
//!
//! `UGenInput` crosses the boundary as its serde value
//! (`{ constant: n } | { ugen: i } | { ugenOutput: [i, o] }`); plain JS
//! numbers coerce to constants everywhere one is accepted.

use std::cell::RefCell;
use std::rc::Rc;

use wasm_bindgen::prelude::*;

use crate::envs::spec::{Curve, Curves, EnvSpec};
use crate::envs::{build_env, BuildOpts, EnvArgValue};
use crate::{encode_env, Rate, SynthDef, UGenInput};

thread_local! {
    /// The SynthDefs currently under construction — a stack, so nested
    /// `new SynthDef(...)` builds are legal. The typed builder statics
    /// (`SinOsc.ar({ freq })`) attach to the top; wasm is single-threaded
    /// per JS realm, so `thread_local` + `RefCell` is the whole story
    /// (and `Rc` is `!Send`, so cross-thread sharing wouldn't compile).
    static BUILD_STACK: RefCell<Vec<Rc<RefCell<SynthDef>>>> = RefCell::new(Vec::new());
}

/// Run `f` against the SynthDef currently under construction; pointed
/// error when no build is active. Used by the generated builder statics.
pub(crate) fn with_current_def<T>(
    call: &str,
    f: impl FnOnce(&mut SynthDef) -> Result<T, JsError>,
) -> Result<T, JsError> {
    let top = BUILD_STACK.with(|s| s.borrow().last().cloned());
    match top {
        Some(def) => f(&mut def.borrow_mut()),
        None => Err(JsError::new(&format!(
            "{call}: no SynthDef under construction — call it inside new SynthDef(name, () => ...)"
        ))),
    }
}

pub(crate) fn err(e: impl std::fmt::Display) -> JsError {
    JsError::new(&e.to_string())
}

/// Parse one boundary input: a plain number (→ constant) or the tagged
/// serde value.
pub(crate) fn input_from_js(v: &JsValue) -> Result<UGenInput, JsError> {
    if let Some(n) = v.as_f64() {
        return Ok(UGenInput::Constant(n as f32));
    }
    serde_wasm_bindgen::from_value(v.clone())
        .map_err(|e| JsError::new(&format!("not a UGen input: {e}")))
}

pub(crate) fn input_to_js(i: &UGenInput) -> Result<JsValue, JsError> {
    serde_wasm_bindgen::to_value(i).map_err(err)
}

fn parse_rate(rate: &str) -> Result<Rate, JsError> {
    // Accept both the SC short forms (ar/kr/ir) and the long forms the
    // registry + TS compiler speak (audio/control/scalar).
    match rate {
        "audio" => return Ok(Rate::Audio),
        "control" => return Ok(Rate::Control),
        "scalar" => return Ok(Rate::Scalar),
        _ => {}
    }
    Rate::parse(rate).ok_or_else(|| JsError::new(&format!("Unknown rate: \"{rate}\"")))
}

/// The SynthDef graph builder — mirrors the native [`SynthDef`] one-to-one.
/// The inner graph is shared (`Rc<RefCell<…>>`) so the graph callback's
/// def handle and the constructed object alias the same build safely.
///
/// `skip_typescript`: wasm-bindgen drops the optionality marker on an
/// `Option<Function>` param when its type is overridden, so the class is
/// declared by hand in the custom section below.
#[wasm_bindgen(js_name = SynthDef, skip_typescript)]
pub struct WasmSynthDef {
    pub(crate) inner: Rc<RefCell<SynthDef>>,
}

#[wasm_bindgen(typescript_custom_section)]
const TS_SYNTHDEF: &'static str = r#"
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
"#;

#[wasm_bindgen(js_class = SynthDef)]
impl WasmSynthDef {
    /// Construct a def, optionally building its graph SC-style: the
    /// callback runs synchronously with this def as the ambient build
    /// target, so the typed builders need no def argument —
    /// `new SynthDef("sine", (def) => { Out.ar({ bus: 0, channelsArray:
    /// [SinOsc.ar({ freq: def.addControl("freq", 440, "control") })] }) })`.
    /// The callback also receives the def handle (for `addControl` /
    /// `addUgen`). An async callback is rejected — the ambient scope ends
    /// when the constructor returns.
    #[wasm_bindgen(constructor)]
    pub fn new(
        name: String,
        #[wasm_bindgen(unchecked_param_type = "(def: SynthDef) => void")] graph: Option<
            js_sys::Function,
        >,
    ) -> Result<WasmSynthDef, JsValue> {
        let inner = Rc::new(RefCell::new(SynthDef::new(name)));
        if let Some(f) = graph {
            BUILD_STACK.with(|s| s.borrow_mut().push(inner.clone()));
            let handle = JsValue::from(WasmSynthDef {
                inner: inner.clone(),
            });
            let result = f.call1(&JsValue::NULL, &handle);
            BUILD_STACK.with(|s| {
                s.borrow_mut().pop();
            });
            // Propagate the callback's own exception untouched.
            let returned = result?;
            if returned.is_instance_of::<js_sys::Promise>() {
                return Err(JsError::new(
                    "SynthDef graph callback must be synchronous — it returned a \
                     Promise (drop async/await from the body)",
                )
                .into());
            }
        }
        Ok(WasmSynthDef { inner })
    }

    /// Add a named scalar control; returns its `UGenInput` handle.
    #[wasm_bindgen(js_name = addControl, unchecked_return_type = "UGenInput")]
    pub fn add_control(
        &mut self,
        name: String,
        default_value: f32,
        rate: String,
    ) -> Result<JsValue, JsError> {
        let input = self
            .inner
            .borrow_mut()
            .add_control(name, default_value, parse_rate(&rate)?)
            .map_err(err)?;
        input_to_js(&input)
    }

    /// Add a named ARRAY control (consecutive slots, one name at the base
    /// index); returns the per-slot `UGenInput` handles.
    #[wasm_bindgen(js_name = addControlArray, unchecked_return_type = "UGenInput[]")]
    pub fn add_control_array(
        &mut self,
        name: String,
        defaults: Vec<f32>,
        rate: String,
    ) -> Result<JsValue, JsError> {
        let inputs = self
            .inner
            .borrow_mut()
            .add_control_array(name, &defaults, parse_rate(&rate)?)
            .map_err(err)?;
        serde_wasm_bindgen::to_value(&inputs).map_err(err)
    }

    /// Append a UGen node (registry-driven — what the app's markup compiler
    /// uses); returns the node index.
    #[wasm_bindgen(js_name = addUgen)]
    pub fn add_ugen(
        &mut self,
        class_name: String,
        rate: String,
        #[wasm_bindgen(unchecked_param_type = "(UGenInput | number)[]")] inputs: Vec<JsValue>,
        num_outputs: u32,
        special_index: i16,
    ) -> Result<u32, JsError> {
        let inputs = inputs
            .iter()
            .map(input_from_js)
            .collect::<Result<Vec<_>, _>>()?;
        Ok(self.inner.borrow_mut().add_ugen(
            class_name,
            parse_rate(&rate)?,
            inputs,
            num_outputs,
            special_index,
        ))
    }

    /// The calculation rate of an already-added node ("scalar" | "control"
    /// | "audio"), or undefined for an out-of-range index.
    #[wasm_bindgen(js_name = nodeRate)]
    pub fn node_rate(&self, index: u32) -> Option<String> {
        self.inner.borrow().node_rate(index).map(|r| {
            match r {
                Rate::Scalar => "scalar",
                Rate::Control => "control",
                Rate::Audio => "audio",
            }
            .to_string()
        })
    }

    /// Encode to SCgf v2 bytes.
    #[wasm_bindgen(js_name = toBytes)]
    pub fn to_bytes(&self) -> Result<Vec<u8>, JsError> {
        self.inner.borrow().to_bytes().map_err(err)
    }

    /// The structured JSON form (what `parseScgf` also returns).
    #[wasm_bindgen(js_name = toJson)]
    pub fn to_json(&self) -> Result<JsValue, JsError> {
        serde_wasm_bindgen::to_value(&self.inner.borrow().to_json().map_err(err)?).map_err(err)
    }
}

/// Parse SCgf v2 bytes into the structured JSON form.
#[wasm_bindgen(js_name = parseScgf)]
pub fn parse_scgf(bytes: &[u8]) -> Result<JsValue, JsError> {
    serde_wasm_bindgen::to_value(&crate::parse_scgf(bytes).map_err(err)?).map_err(err)
}

// ── one-shot metadata (the TS package caches these at init) ─────────────
//
// NOTE: the UGen registry is no longer served from the wasm — the TS
// package imports `assets/specs/ugens.json` (the same file this crate's
// build.rs compiles the Rust registry from) directly.

/// `specialIndex` for a binary operator name (`+`, `min`, …); undefined
/// for unknown operators.
#[wasm_bindgen(js_name = binaryOpIndex)]
pub fn binary_op_index(op: &str) -> Option<i16> {
    crate::binary_op_index(op)
}

/// `specialIndex` for a unary operator name (`neg`, `abs`, …).
#[wasm_bindgen(js_name = unaryOpIndex)]
pub fn unary_op_index(op: &str) -> Option<i16> {
    crate::unary_op_index(op)
}

// ── envelopes ────────────────────────────────────────────────────────────
//
// NOTE: the envelope-shape metadata is no longer served from the wasm —
// the TS package imports `assets/specs/envs.json` (the same file this
// crate's build.rs compiles ENV_SHAPES from) directly.

fn env_arg_from_js(v: &JsValue) -> Result<EnvArgValue, JsError> {
    if js_sys::Array::is_array(v) {
        let arr = js_sys::Array::from(v);
        let items = arr
            .iter()
            .map(|x| input_from_js(&x))
            .collect::<Result<Vec<_>, _>>()?;
        return Ok(EnvArgValue::Array(items));
    }
    Ok(EnvArgValue::Scalar(input_from_js(v)?))
}

fn curve_from_js(v: &JsValue) -> Result<Option<Curve>, JsError> {
    if v.is_undefined() || v.is_null() {
        return Ok(None);
    }
    if let Some(n) = v.as_f64() {
        return Ok(Some(Curve::Num(n)));
    }
    v.as_string()
        .map(|s| Some(Curve::Name(s)))
        .ok_or_else(|| JsError::new("curve must be a number or a shape name"))
}

/// Build one envelope shape and flatten it to the EnvGen `Env.asArray` run.
/// `args` is a `{ name: number | UGenInput | (number | UGenInput)[] }`
/// object; `curve`/`releaseNode`/`loopNode` are the sclang keyword args.
/// Error messages match the TS package verbatim (the app pins them).
#[wasm_bindgen(js_name = buildEnvRun, unchecked_return_type = "UGenInput[]")]
pub fn build_env_run(
    shape: String,
    args: JsValue,
    curve: JsValue,
    release_node: Option<i32>,
    loop_node: Option<i32>,
) -> Result<JsValue, JsError> {
    let mut pairs: Vec<(String, EnvArgValue)> = Vec::new();
    if !args.is_undefined() && !args.is_null() {
        let obj = js_sys::Object::from(args);
        for entry in js_sys::Object::entries(&obj).iter() {
            let entry = js_sys::Array::from(&entry);
            let key = entry.get(0).as_string().unwrap_or_default();
            pairs.push((key, env_arg_from_js(&entry.get(1))?));
        }
    }
    let opts = BuildOpts {
        curve: curve_from_js(&curve)?,
        release_node,
        loop_node,
    };
    let borrowed: Vec<(&str, EnvArgValue)> =
        pairs.iter().map(|(k, v)| (k.as_str(), v.clone())).collect();
    let spec = build_env(&shape, &borrowed, &opts).map_err(err)?;
    let run = encode_env(&spec).map_err(err)?;
    serde_wasm_bindgen::to_value(&run).map_err(err)
}

/// Flatten a raw envelope spec (levels/times/curves/releaseNode/loopNode)
/// to the EnvGen run — the generic path `Env.new`-style callers use.
#[wasm_bindgen(js_name = encodeEnvRun, unchecked_return_type = "UGenInput[]")]
pub fn encode_env_run(
    #[wasm_bindgen(unchecked_param_type = "(UGenInput | number)[]")] levels: Vec<JsValue>,
    #[wasm_bindgen(unchecked_param_type = "(UGenInput | number)[]")] times: Vec<JsValue>,
    curves: JsValue,
    release_node: Option<i32>,
    loop_node: Option<i32>,
) -> Result<JsValue, JsError> {
    let levels = levels
        .iter()
        .map(input_from_js)
        .collect::<Result<Vec<_>, _>>()?;
    let times = times
        .iter()
        .map(input_from_js)
        .collect::<Result<Vec<_>, _>>()?;
    let curves = if curves.is_undefined() || curves.is_null() {
        Curves::DefaultLin
    } else if js_sys::Array::is_array(&curves) {
        let items = js_sys::Array::from(&curves)
            .iter()
            .map(|c| curve_from_js(&c).map(|o| o.expect("array items are curves")))
            .collect::<Result<Vec<_>, _>>()?;
        Curves::PerSegment(items)
    } else {
        Curves::Single(curve_from_js(&curves)?.ok_or_else(|| JsError::new("invalid curve"))?)
    };
    let spec = EnvSpec {
        levels,
        times,
        curves,
        release_node,
        loop_node,
    };
    serde_wasm_bindgen::to_value(&encode_env(&spec).map_err(err)?).map_err(err)
}

// The types the generated builder surface + package reference.
#[wasm_bindgen(typescript_custom_section)]
const TS_APPEND: &'static str = r#"
export type UGenInputLike = UGenInput | number;
"#;
