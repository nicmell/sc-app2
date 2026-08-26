// The bind-expression AST. One union, shared by the three consumers of the
// language: the runtime state binds (evaluate.ts over live values), the
// synthdef graph compiler (lib/synthdef lowers nodes to UGens), and the
// static `value` coercion (functions.ts evaluates constant literals).

type BinaryOp = "+" | "-" | "*" | "/" | ">" | "<" | ">=" | "<=" | "==" | "!=";

export type Expr =
  | { type: "number"; value: number }
  | { type: "string"; value: string }
  | { type: "var"; name: string }
  /** A function call — `adsr(0.01, 0.1, 0.7, 0.3)`, `pad(expr, 36)`. The
   *  name set is static (functions.ts registry); unknown names are a parse
   *  error, so evaluators may assume the entry exists. */
  | { type: "call"; name: string; args: Expr[] }
  | { type: "unary"; op: "-"; expr: Expr }
  | { type: "binary"; op: BinaryOp; left: Expr; right: Expr }
  | { type: "ternary"; cond: Expr; then: Expr; else: Expr };
