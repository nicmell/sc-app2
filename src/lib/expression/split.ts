// Depth-aware top-level comma split — the comma is BOTH the multichannel
// separator ("a, b" makes an array signal) and the call-argument separator
// ("adsr(0.01, 0.1)"). Everything that used to `value.split(",")` a bind
// string must split at paren depth 0 only.

/** Split `value` on commas OUTSIDE parentheses; tokens trimmed, empties
 *  dropped. */
export function splitTopLevel(value: string): string[] {
  const tokens: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === "(") depth++;
    else if (c === ")") depth = Math.max(0, depth - 1);
    else if (c === "," && depth === 0) {
      tokens.push(value.slice(start, i));
      start = i + 1;
    }
  }
  tokens.push(value.slice(start));
  return tokens.map((s) => s.trim()).filter((s) => s !== "");
}
