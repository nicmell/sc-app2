// Behaviour gate for the graphical `-base` widgets: render output + variant
// classes, the `change` event contract, and the parent-driven composition
// (radio-group child sync, select dropdown). Mounts the real custom elements
// into happy-dom; no styling is asserted (that lives in the foundation CSS).

import { beforeAll, describe, expect, it } from "vitest";
import { registerUiComponents } from "../index";

beforeAll(() => {
  registerUiComponents();
});

/** The widget tags — all map to ScWidgetBase subclasses (so `updateComplete`
 *  and the widget props are visible), unlike the full element map. */
type WidgetTag =
  | "sc-checkbox-base"
  | "sc-switch-base"
  | "sc-knob-base"
  | "sc-slider-base"
  | "sc-option-base"
  | "sc-radio-base"
  | "sc-radio-group-base"
  | "sc-select-base"
  | "sc-icon-base"
  | "sc-button-base"
  | "sc-badge-base"
  | "sc-toast-base"
  | "sc-chip-base"
  | "sc-input-base"
  | "sc-inputnumber-base"
  | "sc-textarea-base"
  | "sc-text-base";

/** Mount a widget, assign props, and wait for its first render. The tag map
 *  (declared in ../index) types both the element and its props. */
async function mount<K extends WidgetTag>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
): Promise<HTMLElementTagNameMap[K]> {
  const el = document.createElement(tag);
  Object.assign(el, props);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

/** Collect `change` detail values dispatched by an element. */
function recordChanges(el: EventTarget): number[] {
  const values: number[] = [];
  el.addEventListener("change", (e) =>
    values.push((e as CustomEvent<{ value: number }>).detail.value),
  );
  return values;
}

describe("sc-checkbox-base", () => {
  it("renders a hidden native checkbox with the variant/size classes on the label", async () => {
    const el = await mount("sc-checkbox-base", { size: "lg", variant: "ok" });
    const label = el.querySelector("label")!;
    const input = el.querySelector("input")!;
    expect(input.type).toBe("checkbox");
    expect(input.classList.contains("sr-only")).toBe(true);
    expect(label.classList.contains("sc-checkbox")).toBe(true);
    expect(label.classList.contains("sc-checkbox--lg")).toBe(true);
    expect(label.classList.contains("sc-checkbox--ok")).toBe(true);
  });

  it("toggles and fires the native change carrying checked", async () => {
    const el = await mount("sc-checkbox-base");
    const checks: boolean[] = [];
    el.addEventListener("change", (e) => checks.push((e.target as HTMLInputElement).checked));
    const input = el.querySelector("input")!;
    input.click();
    expect(el.checked).toBe(true);
    input.click();
    expect(el.checked).toBe(false);
    expect(checks).toEqual([true, false]);
  });

  it("disables the native input", async () => {
    const el = await mount("sc-checkbox-base", { disabled: true });
    expect(el.querySelector("input")!.disabled).toBe(true);
  });
});

describe("sc-switch-base", () => {
  it("uses a role=switch native input and fires native change", async () => {
    const el = await mount("sc-switch-base");
    const checks: boolean[] = [];
    el.addEventListener("change", (e) => checks.push((e.target as HTMLInputElement).checked));
    const input = el.querySelector("input")!;
    expect(input.getAttribute("role")).toBe("switch");
    input.click();
    expect(el.checked).toBe(true);
    input.click();
    expect(checks).toEqual([true, false]);
  });
});

/** Native change values from a range-backed widget (read e.target.value). */
function nativeChanges(el: EventTarget): number[] {
  const values: number[] = [];
  el.addEventListener("change", (e) => values.push(Number((e.target as HTMLInputElement).value)));
  return values;
}

describe("sc-knob-base", () => {
  it("renders a hidden range and steps it on wheel, firing native change", async () => {
    const el = await mount("sc-knob-base", { min: 0, max: 1, step: 0.01, value: 0 });
    expect(el.querySelector("input")!.type).toBe("range");
    const changes = nativeChanges(el);
    el.dispatchEvent(new WheelEvent("wheel", { deltaY: -1, cancelable: true }));
    expect(el.value).toBeCloseTo(0.05);
    expect(changes).toEqual([0.05]);
  });

  it("clamps to max", async () => {
    const el = await mount("sc-knob-base", { min: 0, max: 1, step: 0.1, value: 0.95 });
    el.dispatchEvent(new WheelEvent("wheel", { deltaY: -1, cancelable: true }));
    expect(el.value).toBe(1);
  });
});

describe("sc-slider-base", () => {
  it("carries the orientation modifier and steps the hidden range on wheel", async () => {
    const el = await mount("sc-slider-base", {
      orientation: "vertical",
      min: 0,
      max: 1,
      step: 0.1,
      value: 0.5,
    });
    expect(el.querySelector(".sc-slider--vertical")).not.toBeNull();
    expect(el.querySelector("input")!.type).toBe("range");
    const changes = nativeChanges(el);
    el.dispatchEvent(new WheelEvent("wheel", { deltaY: -1, cancelable: true }));
    expect(el.value).toBeCloseTo(1);
    expect(changes).toEqual([1]);
  });
});

describe("sc-option-base", () => {
  it("emits its value on click and marks selection", async () => {
    const el = await mount("sc-option-base", { value: 7, label: "Saw", selected: true });
    const row = el.querySelector(".sc-option")!;
    expect(row.classList.contains("sc-option--selected")).toBe(true);
    expect(row.getAttribute("aria-selected")).toBe("true");
    const changes = recordChanges(el);
    (row as HTMLElement).click();
    expect(changes).toEqual([7]);
  });
});

describe("sc-radio-base", () => {
  it("renders a hidden native radio and checks itself on click (standalone)", async () => {
    const el = await mount("sc-radio-base", { value: 2, label: "Square" });
    const input = el.querySelector("input")!;
    expect(input.type).toBe("radio");
    input.click();
    expect(el.checked).toBe(true);
  });
});

describe("sc-radio-group-base", () => {
  async function mountGroup(value: number) {
    const group = document.createElement("sc-radio-group-base");
    group.innerHTML =
      '<sc-radio-base value="0" label="a"></sc-radio-base>' +
      '<sc-radio-base value="1" label="b"></sc-radio-base>' +
      '<sc-radio-base value="2" label="c"></sc-radio-base>';
    group.value = value;
    document.body.appendChild(group);
    await group.updateComplete;
    const radios = Array.from(group.querySelectorAll("sc-radio-base"));
    await Promise.all(radios.map((r) => r.updateComplete));
    await group.updateComplete; // let context propagate + children re-render
    await Promise.all(radios.map((r) => r.updateComplete));
    return { group, radios };
  }

  it("reflects orientation to an attribute for styling", async () => {
    const { group } = await mountGroup(0);
    group.orientation = "vertical";
    await group.updateComplete;
    expect(group.getAttribute("orientation")).toBe("vertical");
  });

  it("shares one name and checks the selected child's input", async () => {
    const { radios } = await mountGroup(1);
    const inputs = radios.map((r) => r.querySelector("input")!);
    expect(inputs.map((i) => i.checked)).toEqual([false, true, false]);
    expect(new Set(inputs.map((i) => i.name)).size).toBe(1); // one shared name
  });

  it("updates value and emits a single group change on child click", async () => {
    const { group, radios } = await mountGroup(1);
    let changes = 0;
    let lastTarget: EventTarget | null = null;
    group.addEventListener("change", (e) => {
      changes += 1;
      lastTarget = e.target;
    });
    radios[2].querySelector("input")!.click();
    expect(group.value).toBe(2);
    expect(changes).toBe(1);
    expect(lastTarget).toBe(group);
  });

  it("propagates size/variant to children via context", async () => {
    const { group, radios } = await mountGroup(0);
    group.size = "lg";
    group.variant = "warn";
    await group.updateComplete;
    await Promise.all(radios.map((r) => r.updateComplete));
    const label = radios[0].querySelector(".sc-radio")!;
    expect(label.classList.contains("sc-radio--lg")).toBe(true);
    expect(label.classList.contains("sc-radio--warn")).toBe(true);
  });
});

describe("sc-select-base", () => {
  const OPTIONS = [
    { value: 0, label: "Sine" },
    { value: 1, label: "Saw" },
  ];

  it("opens on combobox click and renders one row per option", async () => {
    const el = await mount("sc-select-base", { options: OPTIONS });
    expect(el.querySelector(".sc-select__dropdown")).toBeNull();
    el.querySelector("button")!.click();
    await el.updateComplete;
    expect(el.querySelectorAll(".sc-select__option").length).toBe(2);
  });

  it("picks an option: emits the value and closes", async () => {
    const el = await mount("sc-select-base", { options: OPTIONS });
    el.querySelector("button")!.click();
    await el.updateComplete;
    const changes = recordChanges(el);
    el.querySelectorAll<HTMLElement>(".sc-select__option")[1].click();
    await el.updateComplete;
    expect(el.value).toBe(1);
    expect(changes).toEqual([1]);
    expect(el.querySelector(".sc-select__dropdown")).toBeNull();
  });

  it("shows the selected option's label in the combobox", async () => {
    const el = await mount("sc-select-base", { options: OPTIONS, value: 1 });
    expect(el.querySelector(".sc-select__label")!.textContent!.trim()).toBe("Saw");
  });
});

describe("sc-icon-base", () => {
  it("renders the fill icon classes, decorative by default", async () => {
    const el = await mount("sc-icon-base", { name: "play" });
    const i = el.querySelector("i")!;
    expect(i.classList.contains("sc-icon")).toBe(true);
    expect(i.classList.contains("ph-fill")).toBe(true);
    expect(i.classList.contains("ph-play")).toBe(true);
    expect(i.getAttribute("aria-hidden")).toBe("true");
  });

  it("applies the size modifier when given", async () => {
    const el = await mount("sc-icon-base", { name: "play", size: "lg" });
    expect(el.querySelector("i")!.classList.contains("sc-icon--lg")).toBe(true);
  });

  it("becomes labelled (role=img) when given a label", async () => {
    const el = await mount("sc-icon-base", { name: "play", label: "Play" });
    const i = el.querySelector("i")!;
    expect(i.getAttribute("role")).toBe("img");
    expect(i.getAttribute("aria-label")).toBe("Play");
    expect(i.hasAttribute("aria-hidden")).toBe(false);
  });
});

describe("sc-button-base", () => {
  it("renders a typed button with variant/size classes and label text", async () => {
    const el = await mount("sc-button-base", { label: "Run", variant: "danger", size: "lg" });
    const btn = el.querySelector("button")!;
    expect(btn.getAttribute("type")).toBe("button");
    expect(btn.classList.contains("sc-button")).toBe(true);
    expect(btn.classList.contains("sc-button--danger")).toBe(true);
    expect(btn.classList.contains("sc-button--lg")).toBe(true);
    expect(el.querySelector(".sc-button__label")!.textContent).toBe("Run");
  });

  it("renders leading and trailing icons", async () => {
    const el = await mount("sc-button-base", {
      label: "Open",
      icon: "folder",
      trailingIcon: "caret-down",
    });
    const names = Array.from(el.querySelectorAll("sc-icon-base")).map((i) => i.getAttribute("name"));
    expect(names).toEqual(["folder", "caret-down"]);
  });

  it("icon-only: square modifier, no label text, label used as aria-label", async () => {
    const el = await mount("sc-button-base", { icon: "play", iconOnly: true, label: "Play" });
    const btn = el.querySelector("button")!;
    expect(btn.classList.contains("sc-button--icon")).toBe(true);
    expect(el.querySelector(".sc-button__label")).toBeNull();
    expect(el.querySelector("sc-icon-base")!.getAttribute("name")).toBe("play");
    expect(btn.getAttribute("aria-label")).toBe("Play");
  });

  it("fires a bubbling click from the inner button", async () => {
    const el = await mount("sc-button-base", { label: "Go" });
    let clicks = 0;
    el.addEventListener("click", () => (clicks += 1));
    el.querySelector("button")!.click();
    expect(clicks).toBe(1);
  });

  it("does not click when disabled", async () => {
    const el = await mount("sc-button-base", { label: "Go", disabled: true });
    let clicks = 0;
    el.addEventListener("click", () => (clicks += 1));
    el.querySelector("button")!.click();
    expect(clicks).toBe(0);
  });
});

describe("sc-badge-base", () => {
  it("renders the label; ok is the base class with no modifier", async () => {
    const el = await mount("sc-badge-base", { label: "connected" });
    const span = el.querySelector(".badge")!;
    expect(span.textContent!.trim()).toBe("connected");
    expect(span.classList.contains("badge--ok")).toBe(false);
  });

  it("applies the variant modifier class", async () => {
    const el = await mount("sc-badge-base", { label: "offline", variant: "error" });
    expect(el.querySelector(".badge")!.classList.contains("badge--error")).toBe(true);
  });
});

describe("sc-toast-base", () => {
  it("renders the message; default has no variant modifier", async () => {
    const el = await mount("sc-toast-base", { message: "Saved." });
    const toast = el.querySelector(".toast")!;
    expect(el.querySelector(".toast-message")!.textContent!.trim()).toBe("Saved.");
    expect(toast.className).toBe("toast");
  });

  it("applies the variant modifier class", async () => {
    const el = await mount("sc-toast-base", { message: "Late", variant: "warn" });
    expect(el.querySelector(".toast")!.classList.contains("toast--warn")).toBe(true);
  });

  it("dispatches a bubbling dismiss event on close", async () => {
    const el = await mount("sc-toast-base", { message: "x" });
    let dismissed = 0;
    el.addEventListener("dismiss", () => (dismissed += 1));
    el.querySelector<HTMLButtonElement>(".toast-close")!.click();
    expect(dismissed).toBe(1);
  });
});

describe("sc-chip-base", () => {
  it("renders the label; neutral is the base class with no modifier or dot", async () => {
    const el = await mount("sc-chip-base", { label: "idle" });
    const chip = el.querySelector(".chip")!;
    expect(chip.textContent!.trim()).toBe("idle");
    expect(chip.className).toBe("chip");
    expect(el.querySelector(".chip__dot")).toBeNull();
  });

  it("applies the variant modifier and shows the dot when enabled", async () => {
    const el = await mount("sc-chip-base", { label: "alive", variant: "ok", dot: true });
    const chip = el.querySelector(".chip")!;
    expect(chip.classList.contains("chip--ok")).toBe(true);
    expect(el.querySelector(".chip__dot")).not.toBeNull();
  });
});

describe("sc-input-base", () => {
  it("renders a text input with the size class", async () => {
    const el = await mount("sc-input-base", { size: "lg", placeholder: "name" });
    const input = el.querySelector("input")!;
    expect(input.type).toBe("text");
    expect(input.classList.contains("sc-input")).toBe(true);
    expect(input.classList.contains("sc-input--lg")).toBe(true);
    expect(input.placeholder).toBe("name");
  });

  it("emits a string value on input and updates `value`", async () => {
    const el = await mount("sc-input-base");
    const values: string[] = [];
    el.addEventListener("change", (e) =>
      values.push((e as CustomEvent<{ value: string }>).detail.value),
    );
    const input = el.querySelector("input")!;
    input.value = "hello";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(el.value).toBe("hello");
    expect(values).toEqual(["hello"]);
  });
});

describe("sc-inputnumber-base", () => {
  function changeValues(el: EventTarget): number[] {
    const values: number[] = [];
    el.addEventListener("change", (e) =>
      values.push((e as CustomEvent<{ value: number }>).detail.value),
    );
    return values;
  }

  it("renders a number input plus two stepper buttons", async () => {
    const el = await mount("sc-inputnumber-base", { value: 2 });
    expect(el.querySelector("input")!.type).toBe("number");
    expect(el.querySelectorAll(".sc-inputnumber__step").length).toBe(2);
  });

  it("steps up by `step`, emitting the new number", async () => {
    const el = await mount("sc-inputnumber-base", { value: 0, step: 1, max: 5 });
    const values = changeValues(el);
    el.querySelectorAll<HTMLButtonElement>(".sc-inputnumber__step")[0].click();
    expect(el.value).toBe(1);
    expect(values).toEqual([1]);
  });

  it("clamps to max and stops emitting at the bound", async () => {
    const el = await mount("sc-inputnumber-base", { value: 4.5, step: 1, max: 5 });
    const values = changeValues(el);
    const up = el.querySelectorAll<HTMLButtonElement>(".sc-inputnumber__step")[0];
    up.click(); // 4.5 → clamp(5.5) = 5
    up.click(); // already 5 → no change
    expect(el.value).toBe(5);
    expect(values).toEqual([5]);
  });

  it("emits a parsed number on typing", async () => {
    const el = await mount("sc-inputnumber-base", { value: 0 });
    const values = changeValues(el);
    const input = el.querySelector("input")!;
    input.value = "42";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(el.value).toBe(42);
    expect(values).toEqual([42]);
  });

  it("rounds the outer corners only (top-right up, bottom-right down)", async () => {
    const el = await mount("sc-inputnumber-base", { value: 1 });
    expect(el.querySelector(".sc-inputnumber__step--up")).not.toBeNull();
    expect(el.querySelector(".sc-inputnumber__step--down")).not.toBeNull();
  });
});

describe("sc-textarea-base", () => {
  it("renders a textarea with rows + size class", async () => {
    const el = await mount("sc-textarea-base", { rows: 5, size: "lg", placeholder: "notes" });
    const ta = el.querySelector("textarea")!;
    expect(ta.getAttribute("rows")).toBe("5");
    expect(ta.classList.contains("sc-textarea")).toBe(true);
    expect(ta.classList.contains("sc-textarea--lg")).toBe(true);
    expect(ta.placeholder).toBe("notes");
  });

  it("emits a string value on input and updates `value`", async () => {
    const el = await mount("sc-textarea-base");
    const values: string[] = [];
    el.addEventListener("change", (e) =>
      values.push((e as CustomEvent<{ value: string }>).detail.value),
    );
    const ta = el.querySelector("textarea")!;
    ta.value = "multi\nline";
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    expect(el.value).toBe("multi\nline");
    expect(values).toEqual(["multi\nline"]);
  });
});

describe("sc-text-base", () => {
  it("preserves child content and reflects typography props to attributes", async () => {
    const el = document.createElement("sc-text-base");
    el.textContent = "Heading";
    el.size = "xl";
    el.weight = "bold";
    el.tone = "dim";
    el.font = "mono";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.textContent).toBe("Heading");
    expect(el.getAttribute("size")).toBe("xl");
    expect(el.getAttribute("weight")).toBe("bold");
    expect(el.getAttribute("tone")).toBe("dim");
    expect(el.getAttribute("font")).toBe("mono");
  });

  it("reflects the boolean truncate/inline flags", async () => {
    const el = document.createElement("sc-text-base");
    el.truncate = true;
    el.inline = true;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.hasAttribute("truncate")).toBe(true);
    expect(el.hasAttribute("inline")).toBe(true);
  });
});
