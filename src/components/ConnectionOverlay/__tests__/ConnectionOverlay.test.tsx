// ConnectionOverlay unit test: drives the real session slice of the app store
// (the component subscribes via useStatus) and asserts the three connection
// states plus the Retry wiring — the component now lives under the data
// router (useRevalidator), so it renders through a createMemoryRouter with a
// loader spy standing in for the session loader. No testing-library — raw
// createRoot into happy-dom plus React's act.

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConnectionOverlay } from "@/components/ConnectionOverlay";
import { modalStyles } from "@/components/ui/Modal";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import type { ConnStatus } from "@/types/stores";
import connStyles from "../ConnectionOverlay.module.scss";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const sessionSlice = appStore.slice(SliceName.SESSION);

function setStatus(status: ConnStatus): void {
  act(() => sessionSlice.update((state) => ({ ...state, status })));
}

let container: HTMLElement;
let root: Root;
let router: ReturnType<typeof createMemoryRouter>;
const loader = vi.fn(() => null);

beforeEach(async () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  loader.mockClear();
  router = createMemoryRouter([{ path: "/:sessionId", loader, element: <ConnectionOverlay /> }], {
    initialEntries: ["/session-1"],
  });
  setStatus("connecting");
  await act(async () => {
    root.render(<RouterProvider router={router} />);
    await Promise.resolve(); // let the initial loader run settle
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("ConnectionOverlay", () => {
  it("shows the connecting loader", () => {
    expect(container.querySelector(`.${connStyles.backdrop}`)).not.toBeNull();
    expect(container.querySelector("sc-base-progress")).not.toBeNull();
    expect(container.querySelector("sc-base-modal")).toBeNull();
  });

  it("renders nothing once connected", () => {
    setStatus("connected");
    expect(container.querySelector(`.${connStyles.backdrop}`)).toBeNull();
  });

  it("shows the connection error modal", () => {
    setStatus("error");
    const modal = container.querySelector("sc-base-modal");
    expect(modal).not.toBeNull();
    expect(modal!.querySelector(`.${modalStyles.title}`)?.textContent).toMatch(
      /connection failed/i,
    );
    expect(modal!.querySelector(`.${modalStyles.actions} sc-base-button`)).not.toBeNull();
  });

  it("revalidates the route loaders in place when Retry is clicked", async () => {
    setStatus("error");
    expect(loader).toHaveBeenCalledTimes(1); // the initial navigation
    const button = container.querySelector(`.${modalStyles.actions} sc-base-button`);
    await act(async () => {
      button!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(loader).toHaveBeenCalledTimes(2); // re-run without navigating away
    expect(router.state.location.pathname).toBe("/session-1");
  });
});
