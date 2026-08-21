// The generic toast stack: coalescing on `key`, keyless entries always
// stacking, dismissal, the bounded length, and the predicate clear.

import { beforeEach, describe, expect, it } from "vitest";
import { MAX_TOASTS } from "@/constants/toasts";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import { clearToasts, dismissToast, pushToast, toasts } from "@/stores/toasts";

beforeEach(() => {
  appStore.slice(SliceName.TOASTS).set([]);
});

describe("toasts store", () => {
  it("coalesces repeats with the same key into one entry", () => {
    pushToast({ message: "boom", variant: "error", key: "a" });
    pushToast({ message: "boom", variant: "error", key: "a" });
    expect(toasts.get()).toHaveLength(1);
    expect(toasts.get()[0]).toMatchObject({ message: "boom", count: 2 });
  });

  it("stacks keyless entries even when the message repeats", () => {
    pushToast({ message: "saved", variant: "info" });
    pushToast({ message: "saved", variant: "info" });
    expect(toasts.get()).toHaveLength(2);
  });

  it("mints a fresh entry after a dismissal", () => {
    pushToast({ message: "boom", variant: "error", key: "a" });
    dismissToast(toasts.get()[0].id);
    pushToast({ message: "boom", variant: "error", key: "a" });
    expect(toasts.get()).toHaveLength(1);
    expect(toasts.get()[0].count).toBe(1);
  });

  it("drops the oldest entries past the cap", () => {
    for (let i = 0; i < MAX_TOASTS + 5; i++) {
      pushToast({ message: `m${i}`, variant: "warn" });
    }
    expect(toasts.get()).toHaveLength(MAX_TOASTS);
    expect(toasts.get()[0].message).toBe("m5");
  });

  it("clears by predicate, or everything without one", () => {
    pushToast({ message: "osc", variant: "error", key: "osc:x" });
    pushToast({ message: "other", variant: "info" });
    clearToasts((toast) => toast.key?.startsWith("osc:") ?? false);
    expect(toasts.get()).toHaveLength(1);
    expect(toasts.get()[0].message).toBe("other");
    clearToasts();
    expect(toasts.get()).toEqual([]);
  });
});
