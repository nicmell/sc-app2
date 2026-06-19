// ConnectionOverlay unit test: drives the real session slice of the app store
// (the component subscribes via useStatus) and asserts the three connection
// states plus the Retry wiring. No testing-library — raw createRoot into
// happy-dom plus React's act.
//
// Importing SessionManager/OscClient here is side-effect-free: the WS worker
// only spawns inside oscClient.connect(), which only session.start() triggers
// — and start() is never called in this file.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ConnectionOverlay } from "@/components/ConnectionOverlay";
import { session } from "@/stores/session";
import { appStore } from "@/stores/store";
import { SliceName } from "@/constants/store";
import type { ConnStatus } from "@/types/stores";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const sessionSlice = appStore.slice(SliceName.SESSION);

function setStatus(status: ConnStatus): void {
  act(() => {
    sessionSlice.update((s) => ({ ...s, status }));
  });
}

let container: HTMLElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  // The store boots in "connecting"; reset explicitly so tests are independent.
  setStatus("connecting");
  act(() => {
    root.render(<ConnectionOverlay />);
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("ConnectionOverlay", () => {
  // The error modal is now <sc-modal-base> (its <dialog class="modal"> lives in
  // the shadow root, so .modal isn't queryable from the document — the host
  // tag is). The notice/actions are slotted light-DOM children of the host.
  it("connecting: backdrop with the indeterminate loader, no modal", () => {
    expect(container.querySelector(".modal-backdrop")).not.toBeNull();
    expect(container.querySelector("sc-progress-base")).not.toBeNull();
    expect(container.querySelector("sc-modal-base")).toBeNull();
  });

  it("connected: renders nothing", () => {
    setStatus("connected");
    expect(container.querySelector(".modal-backdrop")).toBeNull();
  });

  it("error: modal with a notice and a Retry button, no loader", () => {
    setStatus("error");
    expect(container.querySelector("sc-progress-base")).toBeNull();
    const modal = container.querySelector("sc-modal-base");
    expect(modal).not.toBeNull();
    expect(modal!.querySelector(".modal-title")?.textContent).toMatch(/connection failed/i);
    expect(modal!.querySelector(".modal-body")?.textContent).toBeTruthy();
    expect(modal!.querySelector(".modal-actions button")?.textContent).toMatch(/retry/i);
  });

  it("Retry click calls session.retry(); the loader returns when status flips", () => {
    const retry = vi.spyOn(session, "retry").mockImplementation(() => {
      // What the real retry does first: flip back to "connecting".
      sessionSlice.update((s) => ({ ...s, status: "connecting" }));
      return Promise.resolve();
    });
    setStatus("error");
    const button = container.querySelector(".modal-actions button");
    expect(button).not.toBeNull();
    act(() => {
      button!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(retry).toHaveBeenCalledTimes(1);
    expect(container.querySelector("sc-modal-base")).toBeNull();
    expect(container.querySelector("sc-progress-base")).not.toBeNull();
  });
});
