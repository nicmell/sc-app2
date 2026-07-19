//! The macro layer behind the typed UGen builders.
//!
//! `packages/synthdef-compiler/scripts/generate-rust.ts` deserializes the
//! package specs and emits the committed registries: `src/ugens/<category>.rs`
//! (one `sc_ugens!` invocation each), `src/ugens/wasm_gen.rs` (one
//! `sc_ugens_wasm!` invocation + the generated TypeScript custom section)
//! and `src/envs/shapes.rs`. Edit the SPEC, never the expansion.
//!
//! Per-UGen grammar (every identifier and literal is precomputed by the
//! generator; macros only assemble, they never convert names):
//!
//! ```text
//! #[doc = "..."]
//! SinOsc class r"SinOsc" {
//!     rates [ (ar, Audio), (kr, Control), ]
//!     fields [
//!         #[doc = "..."] input freq: UGenInput = UGenInput::Constant(440.0),
//!         #[doc = "..."] array channels_array: Vec<UGenInput> = Vec::new(),
//!         #[doc = "..."] u32 num_channels: u32 = 1u32,
//!     ]
//!     outputs ( fixed 1 )          // or ( from num_channels )
//!     push [ (input freq), (array channels_array), ]
//! }
//! ```
//!
//! The `fields [...]` group travels as ONE token tree so the factory and
//! setter helpers can re-parse it inside the rates repetition (macro_rules
//! forbids nesting one captured repetition inside another).

/// The struct definition for one builder.
macro_rules! sc_ugen_struct {
    (
        [$(#[$m:meta])*] $name:ident
        [ $( $(#[$fm:meta])* $kind:ident $f:ident: $ft:ty = $init:expr ),* $(,)? ]
    ) => {
        $(#[$m])*
        pub struct $name {
            _rate: Rate,
            $( $f: $ft, )*
        }
    };
}

/// One rate factory, seeding every field's default.
macro_rules! sc_ugen_factory {
    (
        $rf:ident $rv:ident
        [ $( $(#[$fm:meta])* $kind:ident $f:ident: $ft:ty = $init:expr ),* $(,)? ]
    ) => {
        #[doc = concat!("Build at ", stringify!($rf), " rate (Rate::", stringify!($rv), ").")]
        pub fn $rf() -> Self {
            Self {
                _rate: Rate::$rv,
                $( $f: $init, )*
            }
        }
    };
}

/// Every setter for one builder, dispatched on each field's kind.
macro_rules! sc_ugen_setters {
    ( [ $( $(#[$fm:meta])* $kind:ident $f:ident: $ft:ty = $init:expr ),* $(,)? ] ) => {
        $( sc_ugen_setter! { $(#[$fm])* $kind $f } )*
    };
}

/// One builder setter, dispatched on the field kind.
macro_rules! sc_ugen_setter {
    ($(#[$m:meta])* input $f:ident) => {
        $(#[$m])*
        pub fn $f(mut self, v: impl Into<UGenInput>) -> Self {
            self.$f = v.into();
            self
        }
    };
    ($(#[$m:meta])* array $f:ident) => {
        $(#[$m])*
        pub fn $f<I, T>(mut self, iter: I) -> Self
        where
            I: IntoIterator<Item = T>,
            T: Into<UGenInput>,
        {
            self.$f = iter.into_iter().map(Into::into).collect();
            self
        }
    };
    ($(#[$m:meta])* u32 $f:ident) => {
        $(#[$m])*
        pub fn $f(mut self, n: u32) -> Self {
            self.$f = n;
            self
        }
    };
}

/// One `build()` input push. The vec/value idents are threaded in so the
/// expansion shares the caller arm's hygiene context.
macro_rules! sc_ugen_push {
    ($v:ident, $s:ident, input $f:ident) => {
        $v.push($s.$f);
    };
    ($v:ident, $s:ident, array $f:ident) => {
        $v.extend($s.$f);
    };
}

/// The `num_outputs` expression: a fixed count, or a `u32` field's value.
macro_rules! sc_ugen_outputs {
    ($s:ident, fixed $n:literal) => {
        $n
    };
    ($s:ident, from $f:ident) => {
        $s.$f
    };
}

/// One typed builder: struct + rate factories + setters + `build`.
macro_rules! sc_ugen_one {
    (
        @meta $meta:tt
        $name:ident class $cls:literal {
            rates [ $( ($rf:ident, $rv:ident) ),* $(,)? ]
            fields $fields:tt
            outputs ( $($out:tt)+ )
            push [ $( ($pk:ident $pf:ident) ),* $(,)? ]
        }
    ) => {
        sc_ugen_struct! { $meta $name $fields }

        impl $name {
            $( sc_ugen_factory! { $rf $rv $fields } )*

            sc_ugen_setters! { $fields }

            /// Materialise this UGen into `def`'s node list.
            /// Returns a handle usable as input to other UGens.
            pub fn build(self, def: &mut SynthDef) -> UGenInput {
                let this = self;
                let mut inputs: Vec<UGenInput> = Vec::new();
                $( sc_ugen_push!(inputs, this, $pk $pf); )*
                let num_outputs: u32 = sc_ugen_outputs!(this, $($out)+);
                let idx = def.add_ugen($cls, this._rate, inputs, num_outputs, 0);
                UGenInput::UGen(idx)
            }
        }
    };
}

/// The typed-builder catalog.
macro_rules! sc_ugens {
    (
        $(
            $(#[$m:meta])*
            $name:ident class $cls:literal { $($body:tt)* }
        )*
    ) => {
        $(
            sc_ugen_one! {
                @meta [$(#[$m])*]
                $name class $cls { $($body)* }
            }
        )*
    };
}

/// One wasm-bindgen arg setter, dispatched on the field kind. The builder
/// and args idents are threaded in for hygiene; the JS key is the
/// precomputed camelCase literal.
#[cfg(feature = "wasm")]
macro_rules! sc_wasm_set {
    ($b:ident, $args:ident, input $f:ident $fjs:literal) => {
        if let Some(v) = opt(&$args, $fjs) {
            $b = $b.$f(input_from_js(&v)?);
        }
    };
    ($b:ident, $args:ident, array $f:ident $fjs:literal) => {
        if let Some(v) = opt(&$args, $fjs) {
            $b = $b.$f(inputs_from_js(&v)?);
        }
    };
    ($b:ident, $args:ident, u32 $f:ident $fjs:literal) => {
        if let Some(v) = opt(&$args, $fjs) {
            $b = $b.$f(v
                .as_f64()
                .ok_or_else(|| JsError::new(concat!($fjs, ": expected a number")))?
                as u32);
        }
    };
}

/// The wasm builder surface: one exported class per UGen, with a static
/// method per supported rate — `SinOsc.ar({ freq: 440 })`, mirroring
/// SuperCollider's `SinOsc.ar(...)`. The methods attach to the SynthDef
/// currently under construction (the ambient build stack a
/// `new SynthDef(name, () => …)` callback runs inside — see
/// `wasm::with_current_def`), so no def crosses the call. TS types come
/// from the generator-emitted custom section (the marker struct is
/// `skip_typescript`).
#[cfg(feature = "wasm")]
macro_rules! sc_ugens_wasm {
    (
        $(
            class $name:ident $js:literal :: $builder:ident {
                $(
                    $rf:ident {
                        $( $kind:ident $f:ident $fjs:literal ),* $(,)?
                    }
                )*
            }
        )*
    ) => {
        $(
            #[wasm_bindgen(js_name = $js, skip_typescript)]
            pub struct $name;

            #[wasm_bindgen(js_class = $js)]
            impl $name {
                $(
                    #[wasm_bindgen(js_name = $rf)]
                    pub fn $rf(args: JsValue) -> Result<JsValue, JsError> {
                        crate::wasm::with_current_def(
                            concat!($js, ".", stringify!($rf)),
                            |def| {
                                let mut b = super::$builder::$rf();
                                let _ = &args;
                                $( sc_wasm_set!(b, args, $kind $f $fjs); )*
                                input_to_js(&b.build(def))
                            },
                        )
                    }
                )*
            }
        )*
    };
}
