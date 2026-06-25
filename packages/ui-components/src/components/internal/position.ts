// Minimal anchored-overlay positioning — the slice of floating-ui that sc-popover
// used (computePosition + offset + flip + shift + autoUpdate), in vanilla DOM.
//
// Scoped to a TOP-LAYER (`position: fixed`) panel anchored to an element in the same
// viewport, so getBoundingClientRect() coordinates map straight to the panel's
// left/top. This is deliberately NOT a general floating-ui replacement: a single-step
// flip (one opposite side, no fallback list), a cross-axis shift clamp, and
// scroll/resize/size tracking — enough for a button-anchored dropdown/menu in modern
// browsers. Out of scope: RTL, nested transformed scroll containers, anchors that
// move without scroll/resize (CSS animation), arrows, virtual elements.

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "end";
export type PopoverPlacement = Side | `${Side}-${Align}`;

const OPPOSITE: Record<Side, Side> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

export interface PositionOptions {
  /** Gap between the anchor and the panel, in px. */
  gap?: number;
  /** Minimum distance kept from the viewport edge when shifting, in px. */
  padding?: number;
}

/** One positioning pass: writes fixed left/top onto `panel`, relative to `anchor`. */
export function positionPanel(
  anchor: HTMLElement,
  panel: HTMLElement,
  placement: PopoverPlacement,
  { gap = 4, padding = 8 }: PositionOptions = {},
): void {
  const a = anchor.getBoundingClientRect();
  const { width: pw, height: ph } = panel.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const [preferred, align] = placement.split("-") as [Side, Align?];
  const vertical = preferred === "top" || preferred === "bottom";

  // flip: take the opposite side when the preferred one lacks room and the opposite
  // has more (a single step — no fallback-placement list like floating-ui's).
  const room: Record<Side, number> = {
    top: a.top,
    bottom: vh - a.bottom,
    left: a.left,
    right: vw - a.right,
  };
  const need = (vertical ? ph : pw) + gap;
  let side = preferred;
  if (room[preferred] < need && room[OPPOSITE[preferred]] > room[preferred]) {
    side = OPPOSITE[preferred];
  }

  // shift: clamp the cross-axis coordinate to keep the panel within the viewport.
  const clamp = (v: number, max: number): number => Math.max(padding, Math.min(v, max - padding));

  let x: number;
  let y: number;
  if (vertical) {
    y = side === "bottom" ? a.bottom + gap : a.top - ph - gap;
    x = align === "end" ? a.right - pw : align === "start" ? a.left : a.left + (a.width - pw) / 2;
    x = clamp(x, vw - pw);
  } else {
    x = side === "right" ? a.right + gap : a.left - pw - gap;
    y = align === "end" ? a.bottom - ph : align === "start" ? a.top : a.top + (a.height - ph) / 2;
    y = clamp(y, vh - ph);
  }

  panel.style.position = "fixed";
  panel.style.margin = "0";
  panel.style.left = `${Math.round(x)}px`;
  panel.style.top = `${Math.round(y)}px`;
}

/**
 * Position `panel` against `anchor` now, then keep it positioned across scroll, resize,
 * and size changes. Returns a cleanup that detaches every listener. `scroll` is
 * captured (scroll events don't bubble) so any scrollable ancestor triggers a reposition.
 */
export function autoPosition(
  anchor: HTMLElement,
  panel: HTMLElement,
  placement: PopoverPlacement,
  options?: PositionOptions,
): () => void {
  const update = (): void => positionPanel(anchor, panel, placement, options);
  update();
  window.addEventListener("scroll", update, { capture: true, passive: true });
  window.addEventListener("resize", update, { passive: true });
  const ro = new ResizeObserver(update);
  ro.observe(anchor);
  ro.observe(panel);
  return () => {
    window.removeEventListener("scroll", update, { capture: true });
    window.removeEventListener("resize", update);
    ro.disconnect();
  };
}
