// The bind-expression parser (moved from lib/utils/expression.ts).
// Supports: the right-associative ternary conditional (`a ? b : c`, over the
// cond's truthiness), comparisons (>, <, >=, <=, == , != — evaluating to 1/0),
// +, -, *, /, unary -, parentheses, numbers, single-quoted string literals
// ('play' — no escapes), variable references, and FUNCTION CALLS
// (`adsr(0.01, 0.1, 0.7, 0.3)`, `pad(expr, 36)` — functions.ts registry;
// unknown names fail at parse). The comparison layer sits above additive and
// is NON-associative — `a > b > c` is a parse error (the trailing-input
// check); parenthesized comparisons compose as operands (`(vars.a > 0) * 10`).
// Variables are dot-separated paths (e.g., "vars.freq") extracted during
// parsing — a call's NAME is never a path, its arguments' references are.

import type { Expr } from "./ast";
import { lookupFunction, UNSUPPORTED_FUNCTIONS } from "./functions";

export interface ParsedBind {
  paths: string[];
  expression?: Expr;
}

export function parseBind(input: string): ParsedBind {
  const trimmed = input.trim();

  // Fast path: a plain reference (no expression). Segments may be hyphenated
  // (`fm.mod-freq` — legal state names in the plugin format), so a bare
  // name-shaped bind is ALWAYS a path, never a subtraction: `a-b` reads as
  // the name "a-b". Inside real expressions the tokenizer owns `-`
  // (subtraction/negation) — hyphenated names are not addressable there.
  // A bare `adsr` (no parens) is therefore a PATH too: only the CALL form
  // consults the function registry.
  const segment = String.raw`[a-zA-Z_]\w*(?:-[a-zA-Z_]\w*)*`;
  if (new RegExp(`^${segment}(?:\\.${segment})*$`).test(trimmed)) {
    return { paths: [trimmed] };
  }

  let pos = 0;
  const varPaths = new Set<string>();
  let sawCall = false;

  function peek(): string {
    return trimmed[pos] ?? "";
  }
  function advance(): string {
    return trimmed[pos++];
  }
  function skipWhitespace() {
    while (pos < trimmed.length && trimmed[pos] === " ") pos++;
  }

  /** The loosest layer: an optional ternary over a comparison-level cond.
   *  Right-associative — the branches recurse into the full expression, so
   *  `a ? b : c ? d : e` nests into the else (and a ternary in the then
   *  branch consumes its own `:` first, JS-style). */
  function parseExpr(): Expr {
    const cond = parseComparison();
    skipWhitespace();
    if (peek() !== "?") return cond;
    advance();
    skipWhitespace();
    const then = parseExpr();
    skipWhitespace();
    if (advance() !== ":") throw new Error(`Expected ':' in bind expression: "${input}"`);
    skipWhitespace();
    return { type: "ternary", cond, then, else: parseExpr() };
  }

  /** One optional comparison over additive operands (non-associative: a
   *  second comparison operator is left as trailing input → parse error). */
  function parseComparison(): Expr {
    const left = parseAdditive();
    skipWhitespace();
    const op = peekComparisonOp();
    if (!op) return left;
    pos += op.length;
    skipWhitespace();
    return { type: "binary", op, left, right: parseAdditive() };
  }

  function peekComparisonOp(): ">" | "<" | ">=" | "<=" | "==" | "!=" | undefined {
    const two = trimmed.slice(pos, pos + 2);
    if (two === ">=" || two === "<=" || two === "==" || two === "!=") return two;
    const one = peek();
    if (one === ">" || one === "<") return one;
    return undefined;
  }

  function parseAdditive(): Expr {
    let left = parseTerm();
    skipWhitespace();
    while (peek() === "+" || peek() === "-") {
      const op = advance() as "+" | "-";
      skipWhitespace();
      left = { type: "binary", op, left, right: parseTerm() };
      skipWhitespace();
    }
    return left;
  }

  function parseTerm(): Expr {
    let left = parseFactor();
    skipWhitespace();
    while (peek() === "*" || peek() === "/") {
      const op = advance() as "*" | "/";
      skipWhitespace();
      left = { type: "binary", op, left, right: parseFactor() };
      skipWhitespace();
    }
    return left;
  }

  /** `name(args…)` — the name was already lexed, the '(' is current. The
   *  name is NOT a var path; the args' references are (collected by the
   *  recursive parseExpr). Arity and known-name checks happen HERE: the
   *  registry is static, so a bad call must never survive the parse. */
  function parseCall(name: string): Expr {
    if (name in UNSUPPORTED_FUNCTIONS) {
      throw new Error(`${UNSUPPORTED_FUNCTIONS[name]}: "${input}"`);
    }
    const fn = lookupFunction(name);
    if (!fn) throw new Error(`Unknown function "${name}" in bind expression: "${input}"`);
    advance(); // consume '('
    const args: Expr[] = [];
    skipWhitespace();
    if (peek() === ")") {
      advance();
    } else {
      for (;;) {
        args.push(parseExpr());
        skipWhitespace();
        const c = advance();
        if (c === ")") break;
        if (c !== ",") {
          throw new Error(`Expected ',' or ')' in call to "${name}": "${input}"`);
        }
        skipWhitespace();
        if (peek() === ")") throw new Error(`Trailing comma in call to "${name}": "${input}"`);
      }
    }
    if (args.length < fn.minArgs || args.length > fn.maxArgs) {
      const range =
        fn.maxArgs === Infinity
          ? `at least ${fn.minArgs}`
          : fn.minArgs === fn.maxArgs
            ? `${fn.minArgs}`
            : `${fn.minArgs}–${fn.maxArgs}`;
      throw new Error(`"${name}" expects ${range} arguments (got ${args.length}): "${input}"`);
    }
    fn.validateStatic?.(args);
    sawCall = true;
    return { type: "call", name, args };
  }

  function parseFactor(): Expr {
    skipWhitespace();
    const c = peek();

    if (c === "-") {
      advance();
      skipWhitespace();
      const operand = parseFactor();
      // Fold a negated number literal — env constructors' constant-only
      // slots (bias, dur) need raw numbers, and there is no negative-number
      // token otherwise.
      if (operand.type === "number") return { type: "number", value: -operand.value };
      return { type: "unary", op: "-", expr: operand };
    }

    if (c === "(") {
      advance();
      const expr = parseExpr();
      skipWhitespace();
      if (advance() !== ")") throw new Error(`Expected ')' in bind expression: "${input}"`);
      return expr;
    }

    if (c === "'") {
      advance();
      const start = pos;
      while (pos < trimmed.length && trimmed[pos] !== "'") pos++;
      if (pos >= trimmed.length) {
        throw new Error(`Unterminated string in bind expression: "${input}"`);
      }
      const value = trimmed.slice(start, pos);
      advance();
      return { type: "string", value };
    }

    if ((c >= "0" && c <= "9") || c === ".") {
      const start = pos;
      while (
        pos < trimmed.length &&
        ((trimmed[pos] >= "0" && trimmed[pos] <= "9") || trimmed[pos] === ".")
      )
        pos++;
      return { type: "number", value: parseFloat(trimmed.slice(start, pos)) };
    }

    if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_") {
      const start = pos;
      while (pos < trimmed.length && /[\w.]/.test(trimmed[pos])) pos++;
      const name = trimmed.slice(start, pos);
      // IMMEDIATELY-following '(' (no whitespace, matching the static-value
      // detection) makes this a call.
      if (peek() === "(") return parseCall(name);
      varPaths.add(name);
      return { type: "var", name };
    }

    throw new Error(`Unexpected character '${c}' in bind expression: "${input}"`);
  }

  const expr = parseExpr();
  skipWhitespace();
  if (pos < trimmed.length) {
    throw new Error(
      `Unexpected character '${peek()}' at position ${pos} in bind expression: "${input}"`,
    );
  }
  if (varPaths.size === 0 && !sawCall) {
    throw new Error(`Bind expression must reference at least one variable: "${input}"`);
  }

  return { paths: [...varPaths], expression: expr };
}
