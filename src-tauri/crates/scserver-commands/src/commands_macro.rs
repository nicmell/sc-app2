//! The macro layer behind the command catalog.
//!
//! `packages/server-commands/scripts/generate-rust.ts` emits one committed
//! `sc_commands!` module per spec category and a direct
//! [`define_known_message!`] invocation in `commands/mod.rs`.
//!
//! Field grammar (one line per field, doc attributes allowed above each):
//!
//! ```text
//! scalar name: i32|f32|String     required scalar, pushed unconditionally
//! opt name: i32|f32               trailing optional scalar
//! completion name                 Option<Vec<u8>> completion message (last)
//! blob name                       required Vec<u8> blob
//! list name: i32|String|ControlId one OSC arg per element
//! variadic name                   Vec<OscArg> free-form tail
//! tail name: (A, B, ...)          repeated fixed-shape tuple groups (1-3)
//! setn name: (H, V)               Vec<(H, Vec<V>)> with a len() prefix
//! ```
//!
//! Optional fields (`opt`, `completion`) are excluded from `new()` and
//! default to `None` — override via struct update syntax.

/// Push one typed value onto the OSC arg vector.
macro_rules! sc_osc_push {
    ($args:ident, i32, $e:expr) => {
        $args.push(OscType::Int($e));
    };
    ($args:ident, f32, $e:expr) => {
        $args.push(OscType::Float($e));
    };
    ($args:ident, String, $e:expr) => {
        $args.push(OscType::String($e));
    };
    ($args:ident, ControlId, $e:expr) => {
        $args.push($e.into());
    };
    ($args:ident, NumericValue, $e:expr) => {
        $args.push($e.into());
    };
    ($args:ident, ControlValue, $e:expr) => {
        $args.push($e.into());
    };
    ($args:ident, OscArg, $e:expr) => {
        $args.push(OscType::from($e));
    };
}

/// One command struct + its inherent impl. Internal — invoked by
/// [`sc_commands!`]; the tt-muncher threads four accumulators
/// (struct fields / `new()` params / `new()` inits / `to_message` pushes).
macro_rules! sc_command_one {
    // ── field munchers ──────────────────────────────────────────────
    (
        @meta $meta:tt @addr $addr:literal @name $name:ident @a $a:ident @s $s:ident
        @fields [ $(#[$fm:meta])* scalar $f:ident: $ty:tt $(, $($rest:tt)*)? ]
        @sf [$($sf:tt)*] @np [$($np:tt)*] @ni [$($ni:tt)*] @push [$($push:tt)*]
    ) => {
        sc_command_one! {
            @meta $meta @addr $addr @name $name @a $a @s $s
            @fields [ $($($rest)*)? ]
            @sf [$($sf)* $(#[$fm])* pub $f: $ty,]
            @np [$($np)* $f: $ty,]
            @ni [$($ni)* $f,]
            @push [$($push)* sc_osc_push!($a, $ty, $s.$f);]
        }
    };
    (
        @meta $meta:tt @addr $addr:literal @name $name:ident @a $a:ident @s $s:ident
        @fields [ $(#[$fm:meta])* opt $f:ident: $ty:tt $(, $($rest:tt)*)? ]
        @sf [$($sf:tt)*] @np [$($np:tt)*] @ni [$($ni:tt)*] @push [$($push:tt)*]
    ) => {
        sc_command_one! {
            @meta $meta @addr $addr @name $name @a $a @s $s
            @fields [ $($($rest)*)? ]
            @sf [$($sf)* $(#[$fm])* pub $f: Option<$ty>,]
            @np [$($np)*]
            @ni [$($ni)* $f: None,]
            @push [$($push)* if let Some(v) = $s.$f { sc_osc_push!($a, $ty, v); }]
        }
    };
    (
        @meta $meta:tt @addr $addr:literal @name $name:ident @a $a:ident @s $s:ident
        @fields [ $(#[$fm:meta])* completion $f:ident $(, $($rest:tt)*)? ]
        @sf [$($sf:tt)*] @np [$($np:tt)*] @ni [$($ni:tt)*] @push [$($push:tt)*]
    ) => {
        sc_command_one! {
            @meta $meta @addr $addr @name $name @a $a @s $s
            @fields [ $($($rest)*)? ]
            @sf [$($sf)*
                $(#[$fm])*
                #[serde(with = "serde_bytes", default, skip_serializing_if = "Option::is_none")]
                #[cfg_attr(feature = "wasm", tsify(type = "Uint8Array", optional))]
                pub $f: Option<Vec<u8>>,]
            @np [$($np)*]
            @ni [$($ni)* $f: None,]
            @push [$($push)* if let Some(v) = $s.$f { $a.push(OscType::Blob(v)); }]
        }
    };
    (
        @meta $meta:tt @addr $addr:literal @name $name:ident @a $a:ident @s $s:ident
        @fields [ $(#[$fm:meta])* blob $f:ident $(, $($rest:tt)*)? ]
        @sf [$($sf:tt)*] @np [$($np:tt)*] @ni [$($ni:tt)*] @push [$($push:tt)*]
    ) => {
        sc_command_one! {
            @meta $meta @addr $addr @name $name @a $a @s $s
            @fields [ $($($rest)*)? ]
            @sf [$($sf)*
                $(#[$fm])*
                #[serde(with = "serde_bytes")]
                #[cfg_attr(feature = "wasm", tsify(type = "Uint8Array"))]
                pub $f: Vec<u8>,]
            @np [$($np)* $f: Vec<u8>,]
            @ni [$($ni)* $f,]
            @push [$($push)* $a.push(OscType::Blob($s.$f));]
        }
    };
    (
        @meta $meta:tt @addr $addr:literal @name $name:ident @a $a:ident @s $s:ident
        @fields [ $(#[$fm:meta])* list $f:ident: $ty:tt $(, $($rest:tt)*)? ]
        @sf [$($sf:tt)*] @np [$($np:tt)*] @ni [$($ni:tt)*] @push [$($push:tt)*]
    ) => {
        sc_command_one! {
            @meta $meta @addr $addr @name $name @a $a @s $s
            @fields [ $($($rest)*)? ]
            @sf [$($sf)* $(#[$fm])* pub $f: Vec<$ty>,]
            @np [$($np)* $f: Vec<$ty>,]
            @ni [$($ni)* $f,]
            @push [$($push)* for v in $s.$f { sc_osc_push!($a, $ty, v); }]
        }
    };
    (
        @meta $meta:tt @addr $addr:literal @name $name:ident @a $a:ident @s $s:ident
        @fields [ $(#[$fm:meta])* variadic $f:ident $(, $($rest:tt)*)? ]
        @sf [$($sf:tt)*] @np [$($np:tt)*] @ni [$($ni:tt)*] @push [$($push:tt)*]
    ) => {
        sc_command_one! {
            @meta $meta @addr $addr @name $name @a $a @s $s
            @fields [ $($($rest)*)? ]
            @sf [$($sf)* $(#[$fm])* pub $f: Vec<OscArg>,]
            @np [$($np)* $f: Vec<OscArg>,]
            @ni [$($ni)* $f,]
            @push [$($push)* $a.extend($s.$f.into_iter().map(OscType::from));]
        }
    };
    (
        @meta $meta:tt @addr $addr:literal @name $name:ident @a $a:ident @s $s:ident
        @fields [ $(#[$fm:meta])* tail $f:ident: ($t0:tt) $(, $($rest:tt)*)? ]
        @sf [$($sf:tt)*] @np [$($np:tt)*] @ni [$($ni:tt)*] @push [$($push:tt)*]
    ) => {
        sc_command_one! {
            @meta $meta @addr $addr @name $name @a $a @s $s
            @fields [ $($($rest)*)? ]
            @sf [$($sf)* $(#[$fm])* pub $f: Vec<$t0>,]
            @np [$($np)* $f: Vec<$t0>,]
            @ni [$($ni)* $f,]
            @push [$($push)* for e0 in $s.$f { sc_osc_push!($a, $t0, e0); }]
        }
    };
    (
        @meta $meta:tt @addr $addr:literal @name $name:ident @a $a:ident @s $s:ident
        @fields [ $(#[$fm:meta])* tail $f:ident: ($t0:tt, $t1:tt) $(, $($rest:tt)*)? ]
        @sf [$($sf:tt)*] @np [$($np:tt)*] @ni [$($ni:tt)*] @push [$($push:tt)*]
    ) => {
        sc_command_one! {
            @meta $meta @addr $addr @name $name @a $a @s $s
            @fields [ $($($rest)*)? ]
            @sf [$($sf)* $(#[$fm])* pub $f: Vec<($t0, $t1)>,]
            @np [$($np)* $f: Vec<($t0, $t1)>,]
            @ni [$($ni)* $f,]
            @push [$($push)* for (e0, e1) in $s.$f {
                sc_osc_push!($a, $t0, e0);
                sc_osc_push!($a, $t1, e1);
            }]
        }
    };
    (
        @meta $meta:tt @addr $addr:literal @name $name:ident @a $a:ident @s $s:ident
        @fields [ $(#[$fm:meta])* tail $f:ident: ($t0:tt, $t1:tt, $t2:tt) $(, $($rest:tt)*)? ]
        @sf [$($sf:tt)*] @np [$($np:tt)*] @ni [$($ni:tt)*] @push [$($push:tt)*]
    ) => {
        sc_command_one! {
            @meta $meta @addr $addr @name $name @a $a @s $s
            @fields [ $($($rest)*)? ]
            @sf [$($sf)* $(#[$fm])* pub $f: Vec<($t0, $t1, $t2)>,]
            @np [$($np)* $f: Vec<($t0, $t1, $t2)>,]
            @ni [$($ni)* $f,]
            @push [$($push)* for (e0, e1, e2) in $s.$f {
                sc_osc_push!($a, $t0, e0);
                sc_osc_push!($a, $t1, e1);
                sc_osc_push!($a, $t2, e2);
            }]
        }
    };
    (
        @meta $meta:tt @addr $addr:literal @name $name:ident @a $a:ident @s $s:ident
        @fields [ $(#[$fm:meta])* setn $f:ident: ($h:tt, $v:tt) $(, $($rest:tt)*)? ]
        @sf [$($sf:tt)*] @np [$($np:tt)*] @ni [$($ni:tt)*] @push [$($push:tt)*]
    ) => {
        sc_command_one! {
            @meta $meta @addr $addr @name $name @a $a @s $s
            @fields [ $($($rest)*)? ]
            @sf [$($sf)* $(#[$fm])* pub $f: Vec<($h, Vec<$v>)>,]
            @np [$($np)* $f: Vec<($h, Vec<$v>)>,]
            @ni [$($ni)* $f,]
            @push [$($push)* for (head, values) in $s.$f {
                sc_osc_push!($a, $h, head);
                $a.push(OscType::Int(values.len() as i32));
                for v in values {
                    sc_osc_push!($a, $v, v);
                }
            }]
        }
    };
    // ── terminal: emit the struct + impl ────────────────────────────
    (
        @meta [$(#[$smeta:meta])*] @addr $addr:literal @name $name:ident @a $a:ident @s $s:ident
        @fields [ ]
        @sf [$($sf:tt)*] @np [$($np:tt)*] @ni [$($ni:tt)*] @push [$($push:tt)*]
    ) => {
        $(#[$smeta])*
        #[doc = ""]
        #[doc = concat!("OSC address: `", $addr, "`")]
        #[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
        #[cfg_attr(feature = "wasm", derive(Tsify))]
        #[serde(rename_all = "camelCase")]
        pub struct $name {
            $($sf)*
        }

        impl $name {
            #[doc = concat!("Construct `", $addr, "` with all required args. Optional")]
            #[doc = "fields default to `None` — override via struct update syntax:"]
            #[doc = concat!("`", stringify!($name), " { .. ", stringify!($name), "::new(...) }`.")]
            #[allow(clippy::new_without_default)]
            pub fn new($($np)*) -> Self {
                Self { $($ni)* }
            }

            /// Encode the typed fields into an OSC `OscMessage`.
            #[allow(unused_variables)]
            pub fn to_message(self) -> OscMessage {
                let $s = self;
                let mut $a: Vec<OscType> = Vec::new();
                $($push)*
                OscMessage::with_args($addr, $a)
            }

            /// Encode straight to wire bytes.
            pub fn encode(self) -> Result<Vec<u8>, crate::CommandError> {
                self.to_message().encode()
            }
        }
    };
}

/// The command-catalog macro: each block is one command struct. A
/// `decode` marker after the struct name (spec `"decode": true` — the
/// bridge CONSUMES the command) additionally emits `from_message`/`decode`
/// parsers; it only matches all-`scalar i32` field lists.
macro_rules! sc_commands {
    () => {};
    (
        $(#[$smeta:meta])*
        $addr:literal $name:ident decode { $($fields:tt)* }
        $($rest:tt)*
    ) => {
        sc_command_one! {
            @meta [$(#[$smeta])*] @addr $addr @name $name @a args @s cmd
            @fields [ $($fields)* ]
            @sf [] @np [] @ni [] @push []
        }
        sc_command_decode! { $addr $name [ $($fields)* ] }
        sc_commands! { $($rest)* }
    };
    (
        $(#[$smeta:meta])*
        $addr:literal $name:ident { $($fields:tt)* }
        $($rest:tt)*
    ) => {
        sc_command_one! {
            @meta [$(#[$smeta])*] @addr $addr @name $name @a args @s cmd
            @fields [ $($fields)* ]
            @sf [] @np [] @ni [] @push []
        }
        sc_commands! { $($rest)* }
    };
}

/// The `decode` half of a bridge-consumed command: positional Int32
/// parsing via the replies module's typed accessor.
macro_rules! sc_command_decode {
    ( $addr:literal $name:ident [ $( $(#[$fm:meta])* scalar $f:ident: i32 ),* $(,)? ] ) => {
        impl $name {
            #[doc = concat!("Parse a decoded `", $addr, "` message (Int32 args only) —")]
            /// the bridge is the CONSUMER of this command.
            pub fn from_message(msg: &OscMessage) -> Result<Self, crate::CommandError> {
                let mut i = 0usize;
                $(
                    let $f = {
                        let j = i;
                        i += 1;
                        crate::replies::take_int(msg, j, $addr)?
                    };
                )*
                let _ = i;
                Ok(Self { $( $f, )* })
            }

            /// Decode raw OSC bytes into the typed command.
            pub fn decode(bytes: &[u8]) -> Result<Self, crate::CommandError> {
                Self::from_message(&OscMessage::decode(bytes)?)
            }
        }
    };
}

/// The `KnownMessage` enum + conversions. The generated `commands/mod.rs`
/// invokes this directly with every command from the spec:
///
/// ```ignore
/// define_known_message! {
///     payload { DirtPlay "/dirt/play", }
///     unit { ClearSched "/clearSched", }
/// }
/// ```
macro_rules! define_known_message {
    (
        payload { $($pn:ident $pa:literal,)* }
        unit { $($un:ident $ua:literal,)* }
    ) => {
        /// Every typed command, tagged by its OSC address — the serde tag IS
        /// the address, so a serialized command is a flat
        /// `{ "address": "/s_new", ... }` object.
        #[derive(Debug, Clone, Serialize, Deserialize)]
        #[cfg_attr(feature = "wasm", derive(Tsify))]
        #[serde(tag = "address")]
        pub enum KnownMessage {
            $( #[serde(rename = $pa)] $pn($pn), )*
            $( #[serde(rename = $ua)] $un, )*
        }

        impl KnownMessage {
            /// Lower to the raw OSC message.
            pub fn to_osc_message(self) -> OscMessage {
                match self {
                    $( Self::$pn(c) => c.to_message(), )*
                    $( Self::$un => $un::new().to_message(), )*
                }
            }

            /// Encode straight to wire bytes.
            pub fn encode(self) -> Result<Vec<u8>, crate::CommandError> {
                self.to_osc_message().encode()
            }
        }

        $(
            impl From<$pn> for KnownMessage {
                fn from(c: $pn) -> Self {
                    KnownMessage::$pn(c)
                }
            }
            impl From<$pn> for ServerMessage {
                fn from(c: $pn) -> Self {
                    ServerMessage::Known(KnownMessage::$pn(c))
                }
            }
        )*
    };
}
