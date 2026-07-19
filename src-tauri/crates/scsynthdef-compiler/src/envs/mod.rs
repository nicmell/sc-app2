//! Envelope-shape table — one entry per SuperCollider `Env` class-method
//! constructor (https://doc.sccode.org/Classes/Env.html). Each entry declares
//! its parameter names/defaults/
//! arity; [`build_env`] assembles the [`EnvSpec`] (levels/times +
//! releaseNode/loopNode) that [`spec::encode_env`] flattens into
//! EnvGen's `envelope` input run.
//!
//! Modulation: params that map DIRECTLY to an envelope slot (all `times`, and
//! levels that are a single param) may be a UGen/param ref. Params that feed
//! ARITHMETIC (adsr/dadsr `peak`·`sustain`, `+bias`; triangle/sine `dur/2`)
//! must be constants — [`build_env`] errors `<shape>: "<name>" is not
//! modulatable` (exact string pinned by the app's tests). The coordinate
//! shapes (pairs/xyc) sort by time / difference times, so they are
//! constant-only too. Arithmetic runs in f64 and casts to f32 only at
//! [`UGenInput`] construction — TS byte parity depends on it.

pub(crate) mod spec;

use crate::{CompileError, UGenInput};
use spec::{Curve, Curves, EnvSpec};

/// A resolved env argument: a scalar (const or ref) or an array of them.
#[derive(Debug, Clone)]
pub enum EnvArgValue {
    Scalar(UGenInput),
    Array(Vec<UGenInput>),
}

impl From<f64> for EnvArgValue {
    fn from(n: f64) -> Self {
        EnvArgValue::Scalar(UGenInput::Constant(n as f32))
    }
}
impl From<UGenInput> for EnvArgValue {
    fn from(i: UGenInput) -> Self {
        EnvArgValue::Scalar(i)
    }
}

#[derive(Debug, Clone, Copy)]
pub struct EnvArg {
    pub name: &'static str,
    pub default: f64,
    /// Comma-list value (levels/times/pairs/xyc), not a single scalar.
    pub array: bool,
    /// Whether a ref (bind:value) is accepted; false → constant only.
    pub modulatable: bool,
}

const fn arg(name: &'static str, default: f64) -> EnvArg {
    EnvArg {
        name,
        default,
        array: false,
        modulatable: false,
    }
}
const fn marg(name: &'static str, default: f64) -> EnvArg {
    EnvArg {
        modulatable: true,
        ..arg(name, default)
    }
}
const fn aarg(name: &'static str, modulatable: bool) -> EnvArg {
    EnvArg {
        array: true,
        modulatable,
        ..arg(name, 0.0)
    }
}

#[derive(Debug)]
pub struct EnvShapeEntry {
    pub name: &'static str,
    pub args: &'static [EnvArg],
    pub release_node: Option<i32>,
    pub loop_node: Option<i32>,
}

// The shape table is generated from specs/envs.json and committed. The
// `build_env` match below stays hand-written: each arm carries the sclang
// constructor semantics the spec cannot express.
include!("shapes.rs");

/// Look up an envelope shape by its `type` name.
pub fn lookup_env(name: &str) -> Option<&'static EnvShapeEntry> {
    ENV_SHAPES.iter().find(|e| e.name == name)
}

/// Optional build-time overrides (the `curve:`/`releaseNode:`/`loopNode:`
/// keyword args of the sclang constructors).
#[derive(Debug, Clone, Default)]
pub struct BuildOpts {
    pub curve: Option<Curve>,
    pub release_node: Option<i32>,
    pub loop_node: Option<i32>,
}

type Args<'a> = &'a [(&'a str, EnvArgValue)];

fn get<'a>(args: Args<'a>, name: &str) -> Option<&'a EnvArgValue> {
    args.iter().find(|(n, _)| *n == name).map(|(_, v)| v)
}

/// A directly-modulatable scalar (constant or ref), with a default.
fn scalar(args: Args, name: &str, def: f64) -> UGenInput {
    match get(args, name) {
        None => UGenInput::Constant(def as f32),
        Some(EnvArgValue::Scalar(i)) => i.clone(),
        Some(EnvArgValue::Array(a)) => a
            .first()
            .cloned()
            .unwrap_or(UGenInput::Constant(def as f32)),
    }
}

/// A constant-only scalar (feeds arithmetic) — errors on a ref.
fn constant(shape: &str, args: Args, name: &str, def: f64) -> Result<f64, CompileError> {
    match get(args, name) {
        None => Ok(def),
        Some(EnvArgValue::Scalar(UGenInput::Constant(f))) => Ok(*f as f64),
        Some(_) => Err(CompileError::Env(format!(
            "{shape}: \"{name}\" is not modulatable"
        ))),
    }
}

/// A modulatable array (levels/times of new/step) — refs pass through.
fn like_array(args: Args, name: &str, def: &[f64]) -> Vec<UGenInput> {
    match get(args, name) {
        None => def.iter().map(|d| UGenInput::Constant(*d as f32)).collect(),
        Some(EnvArgValue::Array(a)) => a.clone(),
        Some(EnvArgValue::Scalar(i)) => vec![i.clone()],
    }
}

/// A constant-only numeric array (pairs/xyc — sorted/differenced).
fn number_array(shape: &str, args: Args, name: &str) -> Result<Vec<f64>, CompileError> {
    let v = get(args, name)
        .ok_or_else(|| CompileError::Env(format!("{shape}: \"{name}\" is required")))?;
    let items: Vec<&UGenInput> = match v {
        EnvArgValue::Array(a) => a.iter().collect(),
        EnvArgValue::Scalar(i) => vec![i],
    };
    items
        .into_iter()
        .map(|i| match i {
            UGenInput::Constant(f) => Ok(*f as f64),
            _ => Err(CompileError::Env(format!(
                "{shape}: \"{name}\" must be constant numbers"
            ))),
        })
        .collect()
}

/// Cumulative time coords → per-segment durations (f64 — cast at the slot).
fn diffs(times: &[f64]) -> Vec<UGenInput> {
    times
        .windows(2)
        .map(|w| UGenInput::Constant((w[1] - w[0]) as f32))
        .collect()
}

fn kf(n: f64) -> UGenInput {
    UGenInput::Constant(n as f32)
}

/// Assemble a shape's [`EnvSpec`] from resolved args (the constructor-call
/// semantics of the sclang `Env` class methods, ported from the TS
/// env-registry — error strings preserved verbatim).
pub fn build_env(shape: &str, args: Args, o: &BuildOpts) -> Result<EnvSpec, CompileError> {
    let curve_or = |def: Curve| Curves::Single(o.curve.clone().unwrap_or(def));
    match shape {
        "adsr" => {
            let peak = constant("adsr", args, "peak", 1.0)?;
            let sustain = constant("adsr", args, "sustain", 0.5)?;
            let bias = constant("adsr", args, "bias", 0.0)?;
            Ok(EnvSpec {
                levels: vec![
                    kf(bias),
                    kf(peak + bias),
                    kf(peak * sustain + bias),
                    kf(bias),
                ],
                times: vec![
                    scalar(args, "attack", 0.01),
                    scalar(args, "decay", 0.3),
                    scalar(args, "release", 1.0),
                ],
                curves: curve_or(Curve::Num(-4.0)),
                release_node: Some(2),
                loop_node: None,
            })
        }
        "dadsr" => {
            let peak = constant("dadsr", args, "peak", 1.0)?;
            let sustain = constant("dadsr", args, "sustain", 0.5)?;
            let bias = constant("dadsr", args, "bias", 0.0)?;
            Ok(EnvSpec {
                levels: vec![
                    kf(bias),
                    kf(bias),
                    kf(peak + bias),
                    kf(peak * sustain + bias),
                    kf(bias),
                ],
                times: vec![
                    scalar(args, "delay", 0.1),
                    scalar(args, "attack", 0.01),
                    scalar(args, "decay", 0.3),
                    scalar(args, "release", 1.0),
                ],
                curves: curve_or(Curve::Num(-4.0)),
                release_node: Some(3),
                loop_node: None,
            })
        }
        "asr" => Ok(EnvSpec {
            levels: vec![kf(0.0), scalar(args, "sustain", 1.0), kf(0.0)],
            times: vec![scalar(args, "attack", 0.01), scalar(args, "release", 1.0)],
            curves: curve_or(Curve::Num(-4.0)),
            release_node: Some(1),
            loop_node: None,
        }),
        "cutoff" => Ok(EnvSpec {
            levels: vec![scalar(args, "level", 1.0), kf(0.0)],
            times: vec![scalar(args, "release", 0.1)],
            curves: curve_or(Curve::Name("lin".into())),
            release_node: Some(0),
            loop_node: None,
        }),
        "perc" => Ok(EnvSpec {
            levels: vec![kf(0.0), scalar(args, "level", 1.0), kf(0.0)],
            times: vec![scalar(args, "attack", 0.01), scalar(args, "release", 1.0)],
            curves: curve_or(Curve::Num(-4.0)),
            release_node: None,
            loop_node: None,
        }),
        "linen" => {
            let level = scalar(args, "level", 1.0);
            Ok(EnvSpec {
                levels: vec![kf(0.0), level.clone(), level, kf(0.0)],
                times: vec![
                    scalar(args, "attack", 0.01),
                    scalar(args, "sustainTime", 1.0),
                    scalar(args, "release", 1.0),
                ],
                curves: curve_or(Curve::Name("lin".into())),
                release_node: None,
                loop_node: None,
            })
        }
        "triangle" | "sine" => {
            let half = constant(shape, args, "dur", 1.0)? / 2.0;
            Ok(EnvSpec {
                levels: vec![kf(0.0), scalar(args, "level", 1.0), kf(0.0)],
                times: vec![kf(half), kf(half)],
                curves: curve_or(Curve::Name(
                    if shape == "sine" { "sin" } else { "lin" }.into(),
                )),
                release_node: None,
                loop_node: None,
            })
        }
        "new" => Ok(EnvSpec {
            levels: like_array(args, "levels", &[0.0, 1.0, 0.0]),
            times: like_array(args, "times", &[1.0, 1.0]),
            curves: curve_or(Curve::Name("lin".into())),
            release_node: o.release_node,
            loop_node: o.loop_node,
        }),
        "step" => {
            // Env.step: the first level is held from t0 — levels = [l0, ...l].
            let levels = like_array(args, "levels", &[0.0, 1.0]);
            let times = like_array(args, "times", &[1.0, 1.0]);
            if levels.len() != times.len() {
                return Err(CompileError::Env(
                    "step: \"levels\" and \"times\" must be equal length".into(),
                ));
            }
            let mut held = Vec::with_capacity(levels.len() + 1);
            held.push(levels[0].clone());
            held.extend(levels);
            Ok(EnvSpec {
                levels: held,
                times,
                curves: curve_or(Curve::Name("step".into())),
                release_node: o.release_node,
                loop_node: o.loop_node,
            })
        }
        "pairs" => {
            // Flat [t0,l0, t1,l1, …] → sorted by time → levels + diff-times.
            let flat = number_array("pairs", args, "pairs")?;
            if flat.len() % 2 != 0 {
                return Err(CompileError::Env(
                    "pairs: expects [time, level] pairs".into(),
                ));
            }
            let mut pts: Vec<(f64, f64)> = flat.chunks(2).map(|c| (c[0], c[1])).collect();
            pts.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap_or(std::cmp::Ordering::Equal));
            let times: Vec<f64> = pts.iter().map(|p| p.0).collect();
            Ok(EnvSpec {
                levels: pts.iter().map(|p| kf(p.1)).collect(),
                times: diffs(&times),
                curves: curve_or(Curve::Name("lin".into())),
                release_node: None,
                loop_node: None,
            })
        }
        "xyc" => {
            // Flat [t0,l0,c0, …] → sorted by time → levels + diff-times +
            // per-segment (numeric) curves.
            let flat = number_array("xyc", args, "xyc")?;
            if flat.len() % 3 != 0 {
                return Err(CompileError::Env(
                    "xyc: expects [time, level, curve] triplets".into(),
                ));
            }
            let mut pts: Vec<(f64, f64, f64)> =
                flat.chunks(3).map(|c| (c[0], c[1], c[2])).collect();
            pts.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap_or(std::cmp::Ordering::Equal));
            let times: Vec<f64> = pts.iter().map(|p| p.0).collect();
            Ok(EnvSpec {
                levels: pts.iter().map(|p| kf(p.1)).collect(),
                times: diffs(&times),
                curves: Curves::PerSegment(pts[1..].iter().map(|p| Curve::Num(p.2)).collect()),
                release_node: None,
                loop_node: None,
            })
        }
        _ => Err(CompileError::Env(format!(
            "Unknown envelope shape: \"{shape}\""
        ))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::encode_env;

    fn run(shape: &str, args: Args, o: &BuildOpts) -> Vec<f32> {
        encode_env(&build_env(shape, args, o).unwrap())
            .unwrap()
            .iter()
            .map(|i| match i {
                UGenInput::Constant(f) => *f,
                other => panic!("expected constant, got {other:?}"),
            })
            .collect()
    }
    fn n(v: f64) -> EnvArgValue {
        v.into()
    }

    /// Mirrors packages/synthdef-compiler/tests/env.test.ts — the runs are
    /// the cross-language contract.
    #[test]
    fn shape_runs_match_the_ts_pins() {
        let o = BuildOpts::default();
        // adsr defaults: [0,3,2,-99, 1,.01,5,-4, .5,.3,5,-4, 0,1,5,-4]
        assert_eq!(
            run("adsr", &[], &o),
            [
                0.0, 3.0, 2.0, -99.0, 1.0, 0.01, 5.0, -4.0, 0.5, 0.3, 5.0, -4.0, 0.0, 1.0, 5.0,
                -4.0
            ]
        );
        // dadsr: releaseNode 3, 4 segments
        let d = run("dadsr", &[], &o);
        assert_eq!(&d[..4], &[0.0, 4.0, 3.0, -99.0]);
        // asr / cutoff / perc structure
        assert_eq!(run("asr", &[], &o)[2], 1.0); // releaseNode
        assert_eq!(
            run("cutoff", &[], &o),
            [1.0, 1.0, 0.0, -99.0, 0.0, 0.1, 1.0, 0.0]
        );
        assert_eq!(run("perc", &[], &o)[2], -99.0); // no releaseNode
                                                    // linen trapezoid: 3 segments, level plateau
        let l = run("linen", &[("level", n(0.8))], &o);
        assert_eq!(l[1], 3.0);
        assert_eq!((l[4], l[8]), (0.8, 0.8));
        // triangle halves the dur; sine curves sin(3)
        let t = run("triangle", &[("dur", n(2.0))], &o);
        assert_eq!((t[5], t[9]), (1.0, 1.0));
        assert_eq!(run("sine", &[], &o)[6], 3.0);
        // new honors opts.releaseNode; step holds the first level
        let opts = BuildOpts {
            release_node: Some(1),
            ..Default::default()
        };
        assert_eq!(run("new", &[], &opts)[2], 1.0);
        let s = run(
            "step",
            &[
                ("levels", EnvArgValue::Array(vec![0.0.into(), 1.0.into()])),
                ("times", EnvArgValue::Array(vec![1.0.into(), 0.5.into()])),
            ],
            &o,
        );
        assert_eq!(&s[..4], &[0.0, 2.0, -99.0, -99.0]);
        assert_eq!(&s[4..8], &[0.0, 1.0, 0.0, 0.0]); // held first level, step curve
                                                     // pairs sorts by time and diffs
        let p = run(
            "pairs",
            &[(
                "pairs",
                EnvArgValue::Array(vec![2.0.into(), 0.5.into(), 0.0.into(), 1.0.into()]),
            )],
            &o,
        );
        assert_eq!((p[0], p[1], p[4], p[5]), (1.0, 1.0, 0.5, 2.0));
        // xyc: per-segment numeric curves (type 5)
        let x = run(
            "xyc",
            &[(
                "xyc",
                // segment curves come from each ENDpoint: pts[1..]
                EnvArgValue::Array(vec![
                    0.0.into(),
                    0.0.into(),
                    0.0.into(),
                    1.0.into(),
                    1.0.into(),
                    (-2.0).into(),
                ]),
            )],
            &o,
        );
        assert_eq!(&x[6..8], &[5.0, -2.0]);
    }

    #[test]
    fn modulatable_slots_take_refs_and_arithmetic_slots_reject_them() {
        let o = BuildOpts::default();
        let spec = build_env("adsr", &[("attack", UGenInput::UGen(3).into())], &o).unwrap();
        let flat = encode_env(&spec).unwrap();
        assert_eq!(flat[5], UGenInput::UGen(3)); // dur₁ = the ref
        assert_eq!(flat[4], UGenInput::Constant(1.0)); // level₁ untouched

        let err = build_env("adsr", &[("sustain", UGenInput::UGen(3).into())], &o).unwrap_err();
        assert_eq!(err.to_string(), "adsr: \"sustain\" is not modulatable");
    }

    #[test]
    fn lookup_and_error_paths() {
        assert!(lookup_env("adsr").is_some());
        assert!(lookup_env("nope").is_none());
        assert_eq!(
            build_env("nope", &[], &BuildOpts::default())
                .unwrap_err()
                .to_string(),
            "Unknown envelope shape: \"nope\""
        );
        assert_eq!(
            build_env(
                "step",
                &[
                    ("levels", EnvArgValue::Array(vec![0.0.into()])),
                    ("times", EnvArgValue::Array(vec![1.0.into(), 1.0.into()]))
                ],
                &BuildOpts::default()
            )
            .unwrap_err()
            .to_string(),
            "step: \"levels\" and \"times\" must be equal length"
        );
        assert_eq!(
            build_env("pairs", &[], &BuildOpts::default())
                .unwrap_err()
                .to_string(),
            "pairs: \"pairs\" is required"
        );
    }
}
