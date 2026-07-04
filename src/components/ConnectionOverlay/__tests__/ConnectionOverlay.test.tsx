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
import connStyles from "../ConnectionOverlay.module.scss";
import { modalStyles } from "@/components/ui/Modal";
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
  // The error modal is now <sc-base-modal> (its <dialog class="sc-modal"> lives in
  // the shadow root, so .modal isn't queryable from the document — the host
  // tag is). The notice/actions are slotted light-DOM children of the host.
  it("connecting: backdrop with the indeterminate loader, no modal", () => {
    expect(container.querySelector(`.${connStyles.backdrop}`)).not.toBeNull();
    expect(container.querySelector("sc-base-progress")).not.toBeNull();
    expect(container.querySelector("sc-base-modal")).toBeNull();
  });

  it("connected: renders nothing", () => {
    setStatus("connected");
    expect(container.querySelector(`.${connStyles.backdrop}`)).toBeNull();
  });

  it("error: modal with a notice and a Retry button, no loader", () => {
    setStatus("error");
    expect(container.querySelector("sc-base-progress")).toBeNull();
    const modal = container.querySelector("sc-base-modal");
    expect(modal).not.toBeNull();
    expect(modal!.querySelector(`.${modalStyles.title}`)?.textContent).toMatch(/connection failed/i);
    expect(modal!.querySelector(`.${modalStyles.body}`)?.textContent).toBeTruthy();
    // Retry is now an <sc-base-button> in the actions cluster (its label is a prop; the
    // text lives in the shadow). Presence is the robust check here; the click wiring is
    // covered by the next test.
    expect(modal!.querySelector(`.${modalStyles.actions} sc-base-button`)).not.toBeNull();
  });

  it("Retry click calls session.retry(); the loader returns when status flips", () => {
    const retry = vi.spyOn(session, "retry").mockImplementation(() => {
      // What the real retry does first: flip back to "connecting".
      sessionSlice.update((s) => ({ ...s, status: "connecting" }));
      return Promise.resolve();
    });
    setStatus("error");
    // <sc-base-button> relays the inner button's composed click; React's onClick catches it
    // as it bubbles to the host, so dispatching on the host drives the retry.
    const button = container.querySelector(`.${modalStyles.actions} sc-base-button`);
    expect(button).not.toBeNull();
    act(() => {
      button!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(retry).toHaveBeenCalledTimes(1);
    expect(container.querySelector("sc-base-modal")).toBeNull();
    expect(container.querySelector("sc-base-progress")).not.toBeNull();
  });
});
