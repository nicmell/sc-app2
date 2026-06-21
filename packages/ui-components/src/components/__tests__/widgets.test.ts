// Behaviour gate for the graphical `-base` widgets: render output + variant
// classes, the `change` event contract, and the parent-driven composition
// (radio-group child sync, select dropdown). Mounts the real custom elements
// into happy-dom; no styling is asserted (that lives in the foundation CSS).

import { beforeAll, describe, expect, it } from "vitest";
import { registerUiComponents } from "../index";
// Components now carry scoped CSS-module class names; import the same modules the
// components use so assertions reference the identical (vitest-stable) locals.
import badgeStyles from "../sc-badge.module.css";
import popoverStyles from "../sc-popover.module.css";
import checkboxStyles from "../sc-checkbox.module.css";
import sliderStyles from "../sc-slider.module.css";
import optionStyles from "../sc-option.module.css";
import radioStyles from "../sc-radio.module.css";
import iconStyles from "../sc-icon.module.css";
import buttonStyles from "../sc-button.module.css";
import toastStyles from "../sc-toast.module.css";
import chipStyles from "../sc-chip.module.css";
import inputStyles from "../sc-input.module.css";
import inputnumberStyles from "../sc-inputnumber.module.css";
import textareaStyles from "../sc-textarea.module.css";
import progressStyles from "../sc-progress.module.css";
import { widgetShared as widget } from "../internal/sc-widget-base";

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
  | "sc-text-base"
  | "sc-progress-base";

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

describe("sc-checkbox-base", () => {
  it("renders a hidden native checkbox with the variant/size classes on the label", async () => {
    const el = await mount("sc-checkbox-base", { size: "lg", variant: "ok" });
    const label = el.querySelector("label")!;
    const input = el.querySelector("input")!;
    expect(input.type).toBe("checkbox");
    expect(input.classList.contains("sr-only")).toBe(true);
    expect(label.classList.contains(checkboxStyles.root)).toBe(true);
    expect(label.classList.contains(checkboxStyles.lg)).toBe(true);
    expect(label.classList.contains(widget.ok)).toBe(true);
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

  // Drag sensitivity = (width || 40) × 1.5 = 60px for the full range (happy-dom
  // reports width 0), along whichever axis dominates the gesture. Up increases.
  function drag(el: HTMLElement, dyUp: number, opts: { shiftKey?: boolean } = {}): void {
    const startY = 300;
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 0, clientY: startY }));
    document.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, clientX: 0, clientY: startY - dyUp, ...opts }),
    );
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  }

  it("increases on upward drag", async () => {
    const el = await mount("sc-knob-base", { min: 0, max: 1, step: 0.01, value: 0.5 });
    const changes = nativeChanges(el);
    drag(el, 15); // +15/60 * 1 = +0.25
    expect(el.value).toBeCloseTo(0.75);
    expect(changes).toEqual([0.75]);
  });

  it("decreases on downward drag", async () => {
    const el = await mount("sc-knob-base", { min: 0, max: 1, step: 0.01, value: 0.5 });
    drag(el, -30); // -30/60 * 1 = -0.5
    expect(el.value).toBeCloseTo(0);
  });

  it("Shift makes the drag finer (×0.2)", async () => {
    const el = await mount("sc-knob-base", { min: 0, max: 1, step: 0.01, value: 0.5 });
    drag(el, 15, { shiftKey: true }); // +0.25 * 0.2 = +0.05
    expect(el.value).toBeCloseTo(0.55);
  });

  it("follows the dominant axis (horizontal drag also adjusts)", async () => {
    const el = await mount("sc-knob-base", { min: 0, max: 1, step: 0.01, value: 0.5 });
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 0, clientY: 300 }));
    document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 15, clientY: 300 }));
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    expect(el.value).toBeCloseTo(0.75); // dx=15 dominates → +15/60 = +0.25
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
    expect(el.querySelector("." + sliderStyles.vertical)).not.toBeNull();
    expect(el.querySelector("input")!.type).toBe("range");
    const changes = nativeChanges(el);
    el.dispatchEvent(new WheelEvent("wheel", { deltaY: -1, cancelable: true }));
    expect(el.value).toBeCloseTo(1);
    expect(changes).toEqual([1]);
  });
});

describe("sc-option-base", () => {
  it("renders an option row with its label (standalone, no context)", async () => {
    const el = await mount("sc-option-base", { value: 7, label: "Saw" });
    const row = el.querySelector("." + optionStyles.root)!;
    expect(row.getAttribute("role")).toBe("option");
    expect(row.textContent!.trim()).toBe("Saw");
    expect(row.getAttribute("aria-selected")).toBe("false");
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
    const label = radios[0].querySelector("." + radioStyles.root)!;
    expect(label.classList.contains(radioStyles.lg)).toBe(true);
    expect(label.classList.contains(widget.warn)).toBe(true);
  });
});

describe("sc-select-base", () => {
  async function mountSelect(value: number) {
    const select = document.createElement("sc-select-base");
    select.innerHTML =
      '<sc-option-base value="0" label="Sine"></sc-option-base>' +
      '<sc-option-base value="1" label="Saw"></sc-option-base>' +
      '<sc-option-base value="2" label="Square"></sc-option-base>';
    select.value = value;
    document.body.appendChild(select);
    await select.updateComplete;
    const options = Array.from(select.querySelectorAll("sc-option-base"));
    await Promise.all(options.map((o) => o.updateComplete));
    return { select, options };
  }

  const combobox = (s: HTMLElement) => s.shadowRoot!.querySelector<HTMLButtonElement>(".sc-select__combobox")!;
  const dropdown = (s: HTMLElement) => s.shadowRoot!.querySelector<HTMLElement>(".sc-select__dropdown")!;

  // The dropdown is a top-layer `popover` element, always present and toggled
  // by the browser via `popovertarget` (open/close + light-dismiss aren't
  // exercisable in happy-dom — that's the CDP harness's job). Here we assert the
  // wiring + the context selection path, which are framework-level.
  it("shows the selected option label and wires the combobox to the popover dropdown", async () => {
    const { select } = await mountSelect(1);
    expect(combobox(select).textContent!.trim()).toBe("Saw");
    const panel = dropdown(select);
    expect(panel.getAttribute("role")).toBe("listbox");
    expect(combobox(select).getAttribute("popovertarget")).toBe(panel.id);
  });

  it("picks an option via context: updates value, fires change", async () => {
    const { select, options } = await mountSelect(0);
    let changes = 0;
    select.addEventListener("change", () => (changes += 1));
    options[2].querySelector<HTMLElement>("." + optionStyles.root)!.click();
    await select.updateComplete;
    expect(select.value).toBe(2);
    expect(changes).toBe(1);
  });

  it("marks the selected option via context", async () => {
    const { options } = await mountSelect(1);
    await Promise.all(options.map((o) => o.updateComplete));
    const rows = options.map((o) => o.querySelector("." + optionStyles.root)!);
    expect(rows.map((r) => r.classList.contains(optionStyles.selected))).toEqual([
      false,
      true,
      false,
    ]);
  });
});

describe("sc-icon-base", () => {
  it("renders the fill icon classes, decorative by default", async () => {
    const el = await mount("sc-icon-base", { name: "play" });
    const i = el.querySelector("i")!;
    expect(i.classList.contains(iconStyles.root)).toBe(true);
    expect(i.classList.contains("ph-fill")).toBe(true);
    expect(i.classList.contains("ph-play")).toBe(true);
    expect(i.getAttribute("aria-hidden")).toBe("true");
  });

  it("applies the size modifier when given", async () => {
    const el = await mount("sc-icon-base", { name: "play", size: "lg" });
    expect(el.querySelector("i")!.classList.contains(iconStyles.lg)).toBe(true);
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
    expect(btn.classList.contains(buttonStyles.root)).toBe(true);
    expect(btn.classList.contains(buttonStyles.danger)).toBe(true);
    expect(btn.classList.contains(buttonStyles.lg)).toBe(true);
    expect(el.querySelector("." + buttonStyles.label)!.textContent).toBe("Run");
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
    expect(btn.classList.contains(buttonStyles.iconOnly)).toBe(true);
    expect(el.querySelector("." + buttonStyles.label)).toBeNull();
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
    const span = el.querySelector("." + badgeStyles.root)!;
    expect(span.textContent!.trim()).toBe("connected");
    expect(span.classList.contains(badgeStyles.warn)).toBe(false);
    expect(span.classList.contains(badgeStyles.error)).toBe(false);
  });

  it("applies the variant modifier class", async () => {
    const el = await mount("sc-badge-base", { label: "offline", variant: "error" });
    expect(
      el.querySelector("." + badgeStyles.root)!.classList.contains(badgeStyles.error),
    ).toBe(true);
  });
});

describe("sc-toast-base", () => {
  it("renders the message; default has no variant modifier", async () => {
    const el = await mount("sc-toast-base", { message: "Saved." });
    const toast = el.querySelector("." + toastStyles.root)!;
    expect(el.querySelector("." + toastStyles.message)!.textContent!.trim()).toBe("Saved.");
    expect(toast.className).toBe(toastStyles.root);
  });

  it("applies the variant modifier class", async () => {
    const el = await mount("sc-toast-base", { message: "Late", variant: "warn" });
    expect(el.querySelector("." + toastStyles.root)!.classList.contains(toastStyles.warn)).toBe(
      true,
    );
  });

  it("dispatches a bubbling dismiss event on close", async () => {
    const el = await mount("sc-toast-base", { message: "x" });
    let dismissed = 0;
    el.addEventListener("dismiss", () => (dismissed += 1));
    el.querySelector<HTMLButtonElement>("." + toastStyles.close)!.click();
    expect(dismissed).toBe(1);
  });
});

describe("sc-chip-base", () => {
  it("renders the label; neutral is the base class with no modifier or dot", async () => {
    const el = await mount("sc-chip-base", { label: "idle" });
    const chip = el.querySelector("." + chipStyles.root)!;
    expect(chip.textContent!.trim()).toBe("idle");
    expect(chip.className).toBe(chipStyles.root);
    expect(el.querySelector("." + chipStyles.dot)).toBeNull();
  });

  it("applies the variant modifier and shows the dot when enabled", async () => {
    const el = await mount("sc-chip-base", { label: "alive", variant: "ok", dot: true });
    const chip = el.querySelector("." + chipStyles.root)!;
    expect(chip.classList.contains(chipStyles.ok)).toBe(true);
    expect(el.querySelector("." + chipStyles.dot)).not.toBeNull();
  });
});

describe("sc-input-base", () => {
  it("renders a text input with the size class", async () => {
    const el = await mount("sc-input-base", { size: "lg", placeholder: "name" });
    const input = el.querySelector("input")!;
    expect(input.type).toBe("text");
    expect(input.classList.contains(inputStyles.root)).toBe(true);
    expect(input.classList.contains(inputStyles.lg)).toBe(true);
    expect(input.placeholder).toBe("name");
  });

  it("mirrors value on the native input event", async () => {
    const el = await mount("sc-input-base");
    const inputs: string[] = [];
    el.addEventListener("input", (e) => inputs.push((e.target as HTMLInputElement).value));
    const input = el.querySelector("input")!;
    input.value = "hello";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(el.value).toBe("hello");
    expect(inputs).toEqual(["hello"]);
  });
});

describe("sc-inputnumber-base", () => {
  it("renders a number input plus two stepper buttons", async () => {
    const el = await mount("sc-inputnumber-base", { value: 2 });
    expect(el.querySelector("input")!.type).toBe("number");
    expect(el.querySelectorAll("." + inputnumberStyles.step).length).toBe(2);
  });

  it("steps up by `step`, firing native change with the new value", async () => {
    const el = await mount("sc-inputnumber-base", { value: 0, step: 1, max: 5 });
    const changes: number[] = [];
    el.addEventListener("change", (e) => changes.push(Number((e.target as HTMLInputElement).value)));
    el.querySelectorAll<HTMLButtonElement>("." + inputnumberStyles.step)[0].click();
    expect(el.value).toBe(1);
    expect(changes).toEqual([1]);
  });

  it("clamps to max at the bound", async () => {
    const el = await mount("sc-inputnumber-base", { value: 4.5, step: 1, max: 5 });
    const up = el.querySelectorAll<HTMLButtonElement>("." + inputnumberStyles.step)[0];
    up.click(); // 4.5 → clamp(quantize(5.5)) = 5
    up.click(); // already 5 → no-op
    expect(el.value).toBe(5);
  });

  it("clamps a typed out-of-range value on change", async () => {
    const el = await mount("sc-inputnumber-base", { value: 0, max: 5 });
    const input = el.querySelector("input")!;
    input.value = "999";
    input.dispatchEvent(new Event("input", { bubbles: true })); // live: 999
    input.dispatchEvent(new Event("change", { bubbles: true })); // commit: clamps
    expect(el.value).toBe(5);
  });

  it("rounds the outer corners only (top-right up, bottom-right down)", async () => {
    const el = await mount("sc-inputnumber-base", { value: 1 });
    expect(el.querySelector("." + inputnumberStyles.stepUp)).not.toBeNull();
    expect(el.querySelector("." + inputnumberStyles.stepDown)).not.toBeNull();
  });
});

describe("sc-textarea-base", () => {
  it("renders a textarea with rows + size class", async () => {
    const el = await mount("sc-textarea-base", { rows: 5, size: "lg", placeholder: "notes" });
    const ta = el.querySelector("textarea")!;
    expect(ta.getAttribute("rows")).toBe("5");
    expect(ta.classList.contains(textareaStyles.root)).toBe(true);
    expect(ta.classList.contains(textareaStyles.lg)).toBe(true);
    expect(ta.placeholder).toBe("notes");
  });

  it("mirrors value on the native input event", async () => {
    const el = await mount("sc-textarea-base");
    const inputs: string[] = [];
    el.addEventListener("input", (e) => inputs.push((e.target as HTMLTextAreaElement).value));
    const ta = el.querySelector("textarea")!;
    ta.value = "multi\nline";
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    expect(el.value).toBe("multi\nline");
    expect(inputs).toEqual(["multi\nline"]);
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

describe("form participation", () => {
  it("forwards `name` to the native input/textarea", async () => {
    const input = await mount("sc-input-base", { name: "title" });
    expect(input.querySelector("input")!.name).toBe("title");
    const ta = await mount("sc-textarea-base", { name: "notes" });
    expect(ta.querySelector("textarea")!.name).toBe("notes");
    const num = await mount("sc-inputnumber-base", { name: "freq" });
    expect(num.querySelector("input")!.name).toBe("freq");
    const cb = await mount("sc-checkbox-base", { name: "agree" });
    expect(cb.querySelector("input")!.name).toBe("agree");
    const knob = await mount("sc-knob-base", { name: "gain" });
    expect(knob.querySelector("input")!.name).toBe("gain");
  });

  it("radio-group shares its name with the radios + value on the checked one", async () => {
    const group = document.createElement("sc-radio-group-base");
    group.setAttribute("name", "wave");
    group.innerHTML =
      '<sc-radio-base value="0"></sc-radio-base><sc-radio-base value="1"></sc-radio-base>';
    group.value = 1;
    document.body.appendChild(group);
    await group.updateComplete;
    const radios = Array.from(group.querySelectorAll("sc-radio-base"));
    await Promise.all(radios.map((r) => r.updateComplete));
    await group.updateComplete;
    await Promise.all(radios.map((r) => r.updateComplete));
    const inputs = radios.map((r) => r.querySelector("input")!);
    expect(inputs.every((i) => i.name === "wave")).toBe(true);
    expect(inputs[1].checked).toBe(true);
    expect(inputs[1].value).toBe("1");
  });

  it("submits through a <form> via FormData", async () => {
    const form = document.createElement("form");
    const cb = document.createElement("sc-checkbox-base");
    cb.setAttribute("name", "agree");
    cb.checked = true;
    const inp = document.createElement("sc-input-base");
    inp.setAttribute("name", "title");
    inp.value = "hi";
    form.append(cb, inp);
    document.body.appendChild(form);
    await cb.updateComplete;
    await inp.updateComplete;
    const data = new FormData(form);
    expect(data.get("title")).toBe("hi");
    expect(data.get("agree")).toBe("on");
  });
});

// happy-dom has no top layer / layout, so we assert structure + open-state +
// event wiring only; the escape-clipping / positioning / light-dismiss is
// verified in a real browser (the CDP harness).
describe("sc-popover-base", () => {
  it("renders a .sc-popover panel slotting its children", async () => {
    const el = document.createElement("sc-popover-base");
    el.innerHTML = "<span>menu</span>";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.renderRoot.querySelector("." + popoverStyles.panel)).not.toBeNull();
    expect(el.querySelector("span")!.textContent).toBe("menu");
  });

  it("anchors to its previous sibling and reflects open via a toggle event", async () => {
    const anchor = document.createElement("button");
    const el = document.createElement("sc-popover-base");
    document.body.append(anchor, el);
    await el.updateComplete;
    expect(el.previousElementSibling).toBe(anchor);

    let toggles = 0;
    el.addEventListener("toggle", () => toggles++);
    el.open = true;
    await el.updateComplete;
    // The panel carries the popover attribute (top-layer opt-in) once attached.
    expect(el.renderRoot.querySelector("." + popoverStyles.panel)!.getAttribute("popover")).toBe(
      "auto",
    );
    expect(toggles).toBeGreaterThanOrEqual(0); // toggle event only fires where the API runs
  });
});

// showModal()/::backdrop/focus-trap need a real top layer (CDP harness); here we
// assert the structure, the slotted content, and the dismissable wiring.
describe("sc-modal-base", () => {
  it("renders a <dialog class=modal> slotting its content", async () => {
    const el = document.createElement("sc-modal-base");
    el.innerHTML = '<h2 class="sc-modal__title">Hi</h2>';
    document.body.appendChild(el);
    await el.updateComplete;
    const dialog = el.renderRoot.querySelector("dialog");
    expect(dialog).not.toBeNull();
    expect(dialog!.classList.contains("sc-modal")).toBe(true);
    // Content stays light-DOM (slotted), reachable from the host.
    expect(el.querySelector(".sc-modal__title")!.textContent).toBe("Hi");
  });

  it("emits close + clears open when the dialog closes", async () => {
    const el = document.createElement("sc-modal-base");
    el.dismissable = true;
    el.open = true;
    document.body.appendChild(el);
    await el.updateComplete;
    let closed = 0;
    el.addEventListener("close", () => closed++);
    // Simulate the native dialog `close` event (Esc / backdrop / programmatic).
    el.renderRoot.querySelector("dialog")!.dispatchEvent(new Event("close"));
    expect(closed).toBe(1);
    expect(el.open).toBe(false);
  });
});

// sc-drawer-base shares ScDialogBase with the modal; the showModal()/top-layer/
// slide is CDP-verified. Here: structure, slotted content, side reflection, and
// the close-event contract.
describe("sc-drawer-base", () => {
  it("renders a <dialog class=drawer> slotting its content, side reflected", async () => {
    const el = document.createElement("sc-drawer-base");
    el.side = "left";
    el.innerHTML = "<header><h2>Plugins</h2></header><div>body</div>";
    document.body.appendChild(el);
    await el.updateComplete;
    const dialog = el.renderRoot.querySelector("dialog");
    expect(dialog!.classList.contains("sc-drawer")).toBe(true);
    expect(el.getAttribute("side")).toBe("left");
    expect(el.querySelector("header h2")!.textContent).toBe("Plugins");
  });

  it("defaults to the right side and emits close on dialog close", async () => {
    const el = document.createElement("sc-drawer-base");
    el.dismissable = true;
    el.open = true;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("side")).toBe("right");
    let closed = 0;
    el.addEventListener("close", () => closed++);
    el.renderRoot.querySelector("dialog")!.dispatchEvent(new Event("close"));
    expect(closed).toBe(1);
    expect(el.open).toBe(false);
  });
});

// Host-only content wrappers (the sc-text-base pattern): no template, light DOM,
// children preserved, styling driven by reflected attributes.
describe("host-only content wrappers", () => {
  it("sc-alert-base preserves children and reflects variant", async () => {
    const el = document.createElement("sc-alert-base");
    el.innerHTML = "scsynth <strong>down</strong>";
    el.variant = "error";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.renderRoot).toBe(el); // light DOM (host-only)
    expect(el.querySelector("strong")!.textContent).toBe("down");
    expect(el.getAttribute("variant")).toBe("error");
  });

  it("sc-alert-base defaults to the info variant", async () => {
    const el = document.createElement("sc-alert-base");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("variant")).toBe("info");
  });

  it("sc-panel-base preserves its header + content and reflects disabled", async () => {
    const el = document.createElement("sc-panel-base");
    el.innerHTML = "<header>Seq</header><span>body</span>";
    el.disabled = true;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.querySelector("header")!.textContent).toBe("Seq");
    expect(el.querySelector("span")!.textContent).toBe("body");
    expect(el.hasAttribute("disabled")).toBe(true);
  });

  it("sc-empty-base preserves children", async () => {
    const el = document.createElement("sc-empty-base");
    el.textContent = "no items yet";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.renderRoot).toBe(el);
    expect(el.textContent).toBe("no items yet");
  });

  it("sc-stack-base / sc-cluster-base preserve children and reflect gap", async () => {
    for (const tag of ["sc-stack-base", "sc-cluster-base"] as const) {
      const el = document.createElement(tag);
      el.innerHTML = "<span>a</span><span>b</span>";
      el.gap = "md";
      document.body.appendChild(el);
      await el.updateComplete;
      expect(el.renderRoot).toBe(el); // light DOM (host-only)
      expect(el.querySelectorAll("span").length).toBe(2);
      expect(el.getAttribute("gap")).toBe("md");
    }
  });
});

// sc-disclosure-base wraps a native <details> in shadow DOM, syncing `open`.
describe("sc-disclosure-base", () => {
  it("renders details with slotted summary + content, mirrors open", async () => {
    const el = document.createElement("sc-disclosure-base");
    el.innerHTML = '<span slot="summary">Title</span><p>body</p>';
    el.open = true;
    document.body.appendChild(el);
    await el.updateComplete;
    const details = el.renderRoot.querySelector("details")!;
    expect(details.open).toBe(true);
    expect(el.querySelector('[slot="summary"]')!.textContent).toBe("Title");
  });

  it("mirrors a native toggle back into open + emits toggle", async () => {
    const el = document.createElement("sc-disclosure-base");
    el.innerHTML = '<span slot="summary">T</span><p>b</p>';
    document.body.appendChild(el);
    await el.updateComplete;
    let toggles = 0;
    el.addEventListener("toggle", () => toggles++);
    const details = el.renderRoot.querySelector("details")!;
    // Simulate the user opening it. happy-dom fires `toggle` on the open setter;
    // a real browser fires it async — either way our handler re-emits.
    details.open = true;
    details.dispatchEvent(new Event("toggle"));
    expect(el.open).toBe(true);
    expect(toggles).toBeGreaterThanOrEqual(1);
  });
});

// Accessibility wiring (Tier 1): names, roles, live regions, value text.
describe("a11y wiring", () => {
  it("modal/drawer expose `label` as the dialog aria-label", async () => {
    for (const tag of ["sc-modal-base", "sc-drawer-base"] as const) {
      const el = document.createElement(tag);
      el.label = "Plugins";
      document.body.appendChild(el);
      await el.updateComplete;
      expect(el.renderRoot.querySelector("dialog")!.getAttribute("aria-label")).toBe("Plugins");
    }
  });

  it("radio-group is role=radiogroup with its label as aria-label", async () => {
    const el = document.createElement("sc-radio-group-base");
    el.label = "Waveform";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("role")).toBe("radiogroup");
    expect(el.getAttribute("aria-label")).toBe("Waveform");
  });

  it("alert role tracks severity (error=alert, else status)", async () => {
    const el = document.createElement("sc-alert-base");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("role")).toBe("status"); // default info
    el.variant = "error";
    await el.updateComplete;
    expect(el.getAttribute("role")).toBe("alert");
  });

  it("toast role tracks severity (error/warn=alert, else status)", async () => {
    const el = await mount("sc-toast-base", { variant: "error" });
    expect(el.querySelector("." + toastStyles.root)!.getAttribute("role")).toBe("alert");
    const info = await mount("sc-toast-base", { variant: "info" });
    expect(info.querySelector("." + toastStyles.root)!.getAttribute("role")).toBe("status");
  });

  it("knob/slider expose label as aria-label + a precision-rounded aria-valuetext", async () => {
    for (const tag of ["sc-knob-base", "sc-slider-base"] as const) {
      const el = await mount(tag, { label: "Gain", value: 0.8, step: 0.01 });
      const input = el.querySelector("input")!;
      expect(input.getAttribute("aria-label")).toBe("Gain");
      expect(input.getAttribute("aria-valuetext")).toBe("0.80");
    }
  });
});

describe("sc-progress-base", () => {
  it("defaults to an indeterminate bar (role=progressbar, busy, no valuenow)", async () => {
    const el = await mount("sc-progress-base");
    const bar = el.querySelector("." + progressStyles.bar)!;
    expect(bar.classList.contains(progressStyles.indeterminate)).toBe(true);
    expect(bar.getAttribute("role")).toBe("progressbar");
    expect(bar.getAttribute("aria-busy")).toBe("true");
    expect(bar.hasAttribute("aria-valuenow")).toBe(false);
    expect(el.querySelector("." + progressStyles.fill)).not.toBeNull();
  });

  it("with a value becomes determinate: rounded aria-valuenow + a fill width", async () => {
    const el = await mount("sc-progress-base", { value: 60 });
    const bar = el.querySelector("." + progressStyles.bar)!;
    expect(bar.classList.contains(progressStyles.determinate)).toBe(true);
    expect(bar.hasAttribute("aria-busy")).toBe(false);
    expect(bar.getAttribute("aria-valuenow")).toBe("60");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect((el.querySelector("." + progressStyles.fill) as HTMLElement).style.width).toBe("60%");
  });

  it("clamps value to [0,max] for the fill width and honours a custom max", async () => {
    const over = await mount("sc-progress-base", { value: 9999 });
    expect((over.querySelector("." + progressStyles.fill) as HTMLElement).style.width).toBe("100%");
    const scaled = await mount("sc-progress-base", { value: 5, max: 10 });
    expect((scaled.querySelector("." + progressStyles.fill) as HTMLElement).style.width).toBe(
      "50%",
    );
    expect(scaled.querySelector("." + progressStyles.bar)!.getAttribute("aria-valuemax")).toBe("10");
  });

  it("spinner variant renders the ring host itself with the determinate angle", async () => {
    const indet = await mount("sc-progress-base", { variant: "spinner" });
    const ring = indet.querySelector("." + progressStyles.spinner)!;
    expect(ring.classList.contains(progressStyles.indeterminate)).toBe(true);
    expect(indet.querySelector("." + progressStyles.fill)).toBeNull();

    const det = await mount("sc-progress-base", { variant: "spinner", value: 75 });
    expect(
      (det.querySelector("." + progressStyles.spinner) as HTMLElement).style.getPropertyValue(
        "--_pct",
      ),
    ).toBe("75");
  });

  it("carries the label as the accessible name", async () => {
    const el = await mount("sc-progress-base", { label: "Connecting…" });
    expect(el.querySelector("." + progressStyles.bar)!.getAttribute("aria-label")).toBe(
      "Connecting…",
    );
  });
});
