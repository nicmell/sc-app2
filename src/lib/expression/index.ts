// The bind-expression language: grammar (parser), runtime evaluation with
// multichannel expansion (evaluate), the function registry bridging the
// synthdef-compiler's envelope shapes (functions), the strict static-value
// evaluator (literal), and the paren-aware comma splitter every consumer of
// comma-separated bind strings must use (split).

export type { BinaryOp, Expr } from "./ast";
export { evalExpr } from "./evaluate";
export { lookupFunction, type LoweredArg } from "./functions";
export { tryEvalCallLiteral } from "./literal";
export { parseBind } from "./parser";
export { splitTopLevel } from "./split";
