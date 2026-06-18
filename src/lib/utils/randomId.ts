/**
 * A random UUID. Prefers `crypto.randomUUID()`, but that API is only defined in
 * a **secure context** (https, or http on localhost). When the app is served
 * over plain http to a LAN IP (e.g. the Raspberry Pi at http://192.168.x.y),
 * the page is not a secure context and `crypto.randomUUID` is undefined — which
 * would throw during the element parse pass. Fall back to a v4 UUID built from
 * `crypto.getRandomValues()`, which IS available outside secure contexts.
 */
export function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10x
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0"));
  return `${h.slice(0, 4).join("")}-${h.slice(4, 6).join("")}-${h.slice(6, 8).join("")}-${h.slice(8, 10).join("")}-${h.slice(10, 16).join("")}`;
}
