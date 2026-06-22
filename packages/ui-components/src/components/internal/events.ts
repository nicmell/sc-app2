// Re-emit a DOM event from a shadow-DOM host. Native form events don't all
// cross the shadow boundary the way consumers expect — `change` isn't composed
// at all, and a composed `input` retargets to the host — so widgets catch the
// inner input's event, stop it, and dispatch a fresh composed one from the host.
// Consumers then read `e.target.value` / `.checked` on the host uniformly.

export function relay(host: HTMLElement, source: Event, type: "input" | "change"): void {
  source.stopPropagation();
  host.dispatchEvent(new Event(type, { bubbles: true, composed: true }));
}
