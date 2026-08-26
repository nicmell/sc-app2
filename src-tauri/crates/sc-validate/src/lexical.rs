//! Hand-rolled lexical gates for the static validator: the XSD lexical
//! spaces the spec attribute types promise (decimal/integer/boolean) plus
//! the one-bind-path-segment `name` syntax. Hand-rolled rather than regex
//! so the wasm build stays dependency-light and the native and wasm gates
//! share byte-identical acceptance.

/// Match the XSD decimal lexical space the spec attribute types declare.
pub fn xsd_decimal(input: &str) -> bool {
    let bytes = input.as_bytes();
    let mut index = 0;

    if matches!(bytes.first(), Some(b'+' | b'-')) {
        index += 1;
    }

    let before = consume_digits(bytes, &mut index);
    let after = if bytes.get(index) == Some(&b'.') {
        index += 1;
        consume_digits(bytes, &mut index)
    } else {
        0
    };

    index == bytes.len() && (before > 0 || after > 0)
}

/// Match the XSD integer lexical space the spec attribute types declare.
pub fn xsd_integer(input: &str) -> bool {
    let bytes = input.as_bytes();
    let mut index = 0;

    if matches!(bytes.first(), Some(b'+' | b'-')) {
        index += 1;
    }

    consume_digits(bytes, &mut index) > 0 && index == bytes.len()
}

/// Match the four lexical spellings accepted for boolean attributes.
pub fn xsd_boolean(input: &str) -> bool {
    matches!(input, "true" | "false" | "1" | "0")
}

/// Match one bind-path name segment, without dots or other separators.
pub fn name_segment(input: &str) -> bool {
    let bytes = input.as_bytes();
    let Some(&first) = bytes.first() else {
        return false;
    };
    if !is_name_start(first) {
        return false;
    }

    let mut index = 1;
    while index < bytes.len() && is_word(bytes[index]) {
        index += 1;
    }

    while index < bytes.len() {
        if bytes[index] != b'-' {
            return false;
        }
        index += 1;
        if index >= bytes.len() || !is_name_start(bytes[index]) {
            return false;
        }
        index += 1;
        while index < bytes.len() && is_word(bytes[index]) {
            index += 1;
        }
    }

    true
}

/// Approximate JavaScript `Number()` for the static numeric vector gate.
///
/// This intentionally uses Rust's floating-point parser for ordinary values,
/// so accepted spellings can diverge slightly from JavaScript at obscure
/// numeric edges. Call-shaped values are handled separately by [`call_shaped`]
/// because Rust deliberately does not evaluate frontend expression literals.
pub fn js_number(input: &str) -> Option<f64> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return None;
    }

    match trimmed {
        "Infinity" | "+Infinity" => return Some(f64::INFINITY),
        "-Infinity" => return Some(f64::NEG_INFINITY),
        _ => {}
    }

    let unsigned = trimmed
        .strip_prefix('+')
        .or_else(|| trimmed.strip_prefix('-'))
        .unwrap_or(trimmed);
    if unsigned.eq_ignore_ascii_case("inf")
        || unsigned.eq_ignore_ascii_case("infinity")
        || unsigned.eq_ignore_ascii_case("nan")
    {
        return None;
    }

    for (prefix, radix) in [
        ("0x", 16_u32),
        ("0X", 16),
        ("0o", 8),
        ("0O", 8),
        ("0b", 2),
        ("0B", 2),
    ] {
        if let Some(digits) = trimmed.strip_prefix(prefix) {
            // JavaScript does not accept a sign before a prefixed integer.
            return parse_unsigned_radix(digits, radix);
        }
    }

    trimmed
        .parse::<f64>()
        .ok()
        .filter(|number| !number.is_nan())
}

/// Match the relaxed shape of a call-valued vector expression.
///
/// The frontend evaluates known call heads and validates their arguments;
/// Rust only recognizes the shape and leaves the expression unevaluated. A
/// malformed call can therefore fail later during synthdef compilation or
/// store seeding, which is an accepted porting divergence.
pub fn call_shaped(input: &str) -> bool {
    let trimmed = input.trim();
    let bytes = trimmed.as_bytes();
    let Some(&first) = bytes.first() else {
        return false;
    };
    if !is_name_start(first) {
        return false;
    }

    let mut index = 1;
    while index < bytes.len() && is_word(bytes[index]) {
        index += 1;
    }

    index < bytes.len() && bytes[index] == b'(' && trimmed.ends_with(')')
}

fn consume_digits(bytes: &[u8], index: &mut usize) -> usize {
    let start = *index;
    while *index < bytes.len() && bytes[*index].is_ascii_digit() {
        *index += 1;
    }
    *index - start
}

fn is_name_start(byte: u8) -> bool {
    byte.is_ascii_alphabetic() || byte == b'_'
}

fn is_word(byte: u8) -> bool {
    byte.is_ascii_alphanumeric() || byte == b'_'
}

fn parse_unsigned_radix(digits: &str, radix: u32) -> Option<f64> {
    if digits.is_empty() {
        return None;
    }

    let radix_as_float = f64::from(radix);
    let mut value = 0.0;
    for byte in digits.bytes() {
        let digit = match byte {
            b'0'..=b'9' => u32::from(byte - b'0'),
            b'a'..=b'f' => u32::from(byte - b'a') + 10,
            b'A'..=b'F' => u32::from(byte - b'A') + 10,
            _ => return None,
        };
        if digit >= radix {
            return None;
        }
        value = value * radix_as_float + f64::from(digit);
    }
    Some(value)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decimal_lexical_edges() {
        for input in ["0", "+1", "-1.", ".5", "+.5", "12.30"] {
            assert!(xsd_decimal(input), "{input}");
        }
        for input in ["", ".", "+.", "1e2", "1.2.3", " 1"] {
            assert!(!xsd_decimal(input), "{input}");
        }
    }

    #[test]
    fn integer_boolean_and_name_edges() {
        for input in ["0", "+12", "-12"] {
            assert!(xsd_integer(input), "{input}");
        }
        for input in ["", "1.0", "+", " 1"] {
            assert!(!xsd_integer(input), "{input}");
        }

        for input in ["true", "false", "1", "0"] {
            assert!(xsd_boolean(input), "{input}");
        }
        assert!(!xsd_boolean("TRUE"));

        for input in ["a", "_x", "a1_b", "a-b", "a-b2_c"] {
            assert!(name_segment(input), "{input}");
        }
        for input in ["", "1a", "a.", "a--b", "a-1", "a-"] {
            assert!(!name_segment(input), "{input}");
        }
    }

    #[test]
    fn js_number_covers_prefixed_and_special_values() {
        assert_eq!(js_number("0x10"), Some(16.0));
        assert_eq!(js_number("0o10"), Some(8.0));
        assert_eq!(js_number("0b10"), Some(2.0));
        assert_eq!(js_number("\u{2003}42\u{00a0}"), Some(42.0));
        assert!(js_number("Infinity").is_some_and(|number| number.is_infinite()));
        assert!(js_number("+Infinity").is_some_and(|number| number.is_infinite()));
        assert!(js_number("-Infinity").is_some_and(|number| number.is_infinite()));
        for input in ["", "0x", "0o8", "inf", "infinity", "nan", "NaN"] {
            assert!(js_number(input).is_none(), "{input}");
        }
    }

    #[test]
    fn call_shape_is_relaxed_but_not_arbitrary_text() {
        assert!(call_shaped("adsr(0.01)"));
        assert!(call_shaped(" foo() "));
        assert!(!call_shaped("foo bar"));
        assert!(!call_shaped("1foo()"));
    }
}
