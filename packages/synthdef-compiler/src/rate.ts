/** Calculation rate of a UGen — the string union the compiler API speaks
 *  (the crate accepts these long forms and the SC short forms alike). */
export type Rate = "scalar" | "control" | "audio";

/** Parse SC short forms `ar` / `kr` / `ir` (case-insensitive). */
export function parseRate(s: string): Rate | null {
  switch (s.toLowerCase()) {
    case "ar":
      return "audio";
    case "kr":
      return "control";
    case "ir":
      return "scalar";
    default:
      return null;
  }
}
