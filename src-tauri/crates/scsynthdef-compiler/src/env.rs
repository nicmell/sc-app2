//! Envelope encoding for EnvGen. `Env.adsr(...)` in sclang is not a UGen — it
//! flattens to a run of inputs spliced into EnvGen's input list (at the tail,
//! after the scalar gate/levelScale/levelBias/timeScale/doneAction args). This
//! module produces that flat run; the shape matches sclang's `Env.asArray`:
//!
//!   [ startLevel, numSegments, releaseNode, loopNode,
//!     level₁, dur₁, curveType₁, curveVal₁,     // one 4-tuple per segment
//!     … ]
//!
//! `release_node`/`loop_node` are the 0-based segment indices SC uses for the
//! gate hold-point and loop-back; a nil node encodes as -99. A segment's curve
//! is either a symbolic shape (mapped through `curve_shape`, curveVal 0) or a
//! number (curveType 5 = "custom", the number as curveVal).
//!
//! Level and duration slots are [`UGenInput`] — a constant OR a UGen/param
//! reference — so envelope times/levels can be MODULATED by other signals
//! (the structural slots and curve encodings stay constants). The per-shape
//! constructors live in [`crate::env_registry`].

use crate::{CompileError, UGenInput};

pub(crate) const NO_NODE: f32 = -99.0;

/// A segment curve: a symbolic shape name or a numeric curvature.
#[derive(Debug, Clone, PartialEq)]
pub enum Curve {
    Num(f64),
    Name(String),
}

impl From<f64> for Curve {
    fn from(n: f64) -> Self {
        Curve::Num(n)
    }
}
impl From<&str> for Curve {
    fn from(s: &str) -> Self {
        Curve::Name(s.to_string())
    }
}

/// The curves of an envelope: the default (lin), one shared curve, or one per
/// segment (short lists pad with lin).
#[derive(Debug, Clone, Default, PartialEq)]
pub enum Curves {
    #[default]
    DefaultLin,
    Single(Curve),
    PerSegment(Vec<Curve>),
}

/// Env curve shape name → the scsynth curve-type integer.
fn curve_shape(name: &str) -> Option<i32> {
    Some(match name {
        "step" => 0,
        "linear" | "lin" => 1,
        "exponential" | "exp" => 2,
        "sine" | "sin" => 3,
        "welch" | "wel" => 4,
        "squared" | "sqr" => 6,
        "cubed" | "cub" => 7,
        "hold" => 8,
        _ => return None,
    })
}

pub fn curve_type(curve: &Curve) -> Result<i32, CompileError> {
    match curve {
        Curve::Num(_) => Ok(5), // "custom"
        Curve::Name(name) => curve_shape(name)
            .ok_or_else(|| CompileError::Env(format!("Unknown envelope curve: \"{name}\""))),
    }
}

pub fn curve_value(curve: &Curve) -> f32 {
    match curve {
        Curve::Num(n) => *n as f32,
        Curve::Name(_) => 0.0,
    }
}

/// A generic envelope: breakpoint levels, per-segment durations, and curves.
/// `levels.len() == times.len() + 1`. Levels/times may be constants or refs
/// (modulation).
#[derive(Debug, Clone)]
pub struct EnvSpec {
    pub levels: Vec<UGenInput>,
    pub times: Vec<UGenInput>,
    pub curves: Curves,
    /// 0-based segment index the gate sustains at (None → no sustain).
    pub release_node: Option<i32>,
    /// 0-based segment index to loop back to (None → no loop).
    pub loop_node: Option<i32>,
}

/// Flatten an [`EnvSpec`] into the EnvGen envelope input run (sclang
/// `Env.asArray`), as UGenInputs: structural slots + curve encodings are
/// constants; level and duration slots pass their (possibly-ref) input
/// through.
pub fn encode_env(env: &EnvSpec) -> Result<Vec<UGenInput>, CompileError> {
    let segments = env.times.len();
    if env.levels.len() != segments + 1 {
        return Err(CompileError::Env(format!(
            "Envelope levels ({}) must be times ({segments}) + 1",
            env.levels.len()
        )));
    }
    let node = |n: Option<i32>| UGenInput::Constant(n.map_or(NO_NODE, |v| v as f32));
    let mut out = vec![
        env.levels[0].clone(),
        UGenInput::Constant(segments as f32),
        node(env.release_node),
        node(env.loop_node),
    ];
    let lin = Curve::Name("lin".into());
    for i in 0..segments {
        let curve = match &env.curves {
            Curves::DefaultLin => &lin,
            Curves::Single(c) => c,
            Curves::PerSegment(cs) => cs.get(i).unwrap_or(&lin),
        };
        out.push(env.levels[i + 1].clone());
        out.push(env.times[i].clone());
        out.push(UGenInput::Constant(curve_type(curve)? as f32));
        out.push(UGenInput::Constant(curve_value(curve)));
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn consts(inputs: &[UGenInput]) -> Vec<f32> {
        inputs
            .iter()
            .map(|i| match i {
                UGenInput::Constant(f) => *f,
                other => panic!("expected constant, got {other:?}"),
            })
            .collect()
    }

    #[test]
    fn encodes_the_as_array_run() {
        let env = EnvSpec {
            levels: vec![0.0.into(), 1.0.into(), 0.0.into()],
            times: vec![0.01.into(), 0.3.into()],
            curves: Curves::Single(Curve::Num(-4.0)),
            release_node: Some(1),
            loop_node: None,
        };
        assert_eq!(
            consts(&encode_env(&env).unwrap()),
            vec![0.0, 2.0, 1.0, -99.0, 1.0, 0.01, 5.0, -4.0, 0.0, 0.3, 5.0, -4.0]
        );
    }

    #[test]
    fn per_segment_curves_pad_with_lin() {
        let env = EnvSpec {
            levels: vec![0.0.into(), 1.0.into(), 0.0.into()],
            times: vec![1.0.into(), 1.0.into()],
            curves: Curves::PerSegment(vec![Curve::Name("sin".into())]),
            release_node: None,
            loop_node: None,
        };
        let run = consts(&encode_env(&env).unwrap());
        assert_eq!(&run[6..8], &[3.0, 0.0]); // sin
        assert_eq!(&run[10..12], &[1.0, 0.0]); // padded lin
    }

    #[test]
    fn modulated_slots_pass_refs_through() {
        let env = EnvSpec {
            levels: vec![0.0.into(), UGenInput::UGenOutput(0, 1), 0.0.into()],
            times: vec![UGenInput::UGen(3), 1.0.into()],
            curves: Curves::DefaultLin,
            release_node: None,
            loop_node: None,
        };
        let run = encode_env(&env).unwrap();
        assert_eq!(run[4], UGenInput::UGenOutput(0, 1)); // level₁
        assert_eq!(run[5], UGenInput::UGen(3)); // dur₁
    }

    #[test]
    fn errors_are_exact() {
        let env = EnvSpec {
            levels: vec![0.0.into()],
            times: vec![1.0.into()],
            curves: Curves::DefaultLin,
            release_node: None,
            loop_node: None,
        };
        assert_eq!(
            encode_env(&env).unwrap_err().to_string(),
            "Envelope levels (1) must be times (1) + 1"
        );
        assert_eq!(
            curve_type(&Curve::Name("bogus".into()))
                .unwrap_err()
                .to_string(),
            "Unknown envelope curve: \"bogus\""
        );
    }
}
