// Behaviour gate for the graphical `-base` widgets: render output + variant
// classes, the `change` event contract, and the parent-driven composition
// (radio-group child sync, select dropdown). Mounts the real custom elements
// into happy-dom; no styling is asserted (that lives in the foundation CSS).

import { beforeAll, describe, expect, it } from "vitest";
import { registerUiComponents } from "../index";

beforeAll(() => {
  registerUiComponents();
});

/** The widget tags — all map to ScInputBase subclasses (so `updateComplete`
 *  and the widget props are visible), unlike the full element map. */
type WidgetTag =
  | "sc-checkbox-base"
  | "sc-switch-base"
  | "sc-knob-base"
  | "sc-slider-base"
  | "sc-option-base"
  | "sc-radio-base"
  | "sc-radio-group-base"
  | "sc-select-base";

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
  it("renders a checkbox button with the variant/size classes", async () => {
    const el = await mount("sc-checkbox-base", { size: "lg", variant: "ok" });
    const btn = el.querySelector("button")!;
    expect(btn.getAttribute("role")).toBe("checkbox");
    expect(btn.classList.contains("sc-checkbox")).toBe(true);
    expect(btn.classList.contains("sc-checkbox--lg")).toBe(true);
    expect(btn.classList.contains("sc-checkbox--ok")).toBe(true);
  });

  it("toggles and emits 1 then 0 on click", async () => {
    const el = await mount("sc-checkbox-base");
    const changes = recordChanges(el);
    el.querySelector("button")!.click();
    expect(el.checked).toBe(true);
    el.querySelector("button")!.click();
    expect(el.checked).toBe(false);
    expect(changes).toEqual([1, 0]);
  });

  it("does not emit when disabled", async () => {
    const el = await mount("sc-checkbox-base", { disabled: true });
    const changes = recordChanges(el);
    el.querySelector("button")!.click();
    expect(changes).toEqual([]);
    expect(el.checked).toBe(false);
  });
});

describe("sc-switch-base", () => {
  it("toggles, emits 1/0, and reflects the --on class", async () => {
    const el = await mount("sc-switch-base");
    const changes = recordChanges(el);
    el.querySelector("button")!.click();
    await el.updateComplete;
    expect(el.checked).toBe(true);
    expect(el.querySelector("button")!.classList.contains("sc-switch--on")).toBe(true);
    el.querySelector("button")!.click();
    expect(changes).toEqual([1, 0]);
  });
});

describe("sc-knob-base", () => {
  it("steps on wheel (×5 without shift), quantises, and emits", async () => {
    const el = await mount("sc-knob-base", { min: 0, max: 1, step: 0.01, value: 0 });
    const changes = recordChanges(el);
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
  it("carries the orientation modifier and steps on wheel", async () => {
    const el = await mount("sc-slider-base", {
      orientation: "vertical",
      min: 0,
      max: 1,
      step: 0.1,
      value: 0.5,
    });
    expect(el.querySelector(".sc-slider--vertical")).not.toBeNull();
    const changes = recordChanges(el);
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
  it("emits its own value on click", async () => {
    const el = await mount("sc-radio-base", { value: 2, label: "Square" });
    const changes = recordChanges(el);
    el.querySelector("button")!.click();
    expect(changes).toEqual([2]);
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
    return group;
  }

  it("reflects orientation to an attribute for styling", async () => {
    const group = await mountGroup(0);
    group.orientation = "vertical";
    await group.updateComplete;
    expect(group.getAttribute("orientation")).toBe("vertical");
  });

  it("syncs the checked child from its value", async () => {
    const group = await mountGroup(1);
    const radios = Array.from(group.querySelectorAll("sc-radio-base"));
    expect(radios.map((r) => r.checked)).toEqual([false, true, false]);
  });

  it("updates value and re-emits a single group change on child click", async () => {
    const group = await mountGroup(1);
    const changes = recordChanges(group);
    group.querySelectorAll("sc-radio-base")[2].querySelector("button")!.click();
    expect(group.value).toBe(2);
    expect(changes).toEqual([2]);
  });

  it("propagates size/variant/disabled to children", async () => {
    const group = await mountGroup(0);
    group.size = "lg";
    group.variant = "warn";
    group.disabled = true;
    await group.updateComplete;
    const radio = group.querySelector("sc-radio-base")!;
    expect(radio.size).toBe("lg");
    expect(radio.variant).toBe("warn");
    expect(radio.disabled).toBe(true);
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
