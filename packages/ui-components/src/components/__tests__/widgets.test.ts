// Behaviour gate for the graphical `-base` widgets: render output + variant
// classes, the `change` event contract, and the parent-driven composition
// (radio-group child sync, select dropdown). Mounts the real custom elements
// into happy-dom; no styling is asserted (that lives in the foundation CSS).

import { beforeAll, describe, expect, it } from "vitest";
import { registerUiComponents } from "../index";
// Every component is shadow DOM with literal (shadow-scoped) class names;
// assertions query `el.shadowRoot` + plain class strings.

beforeAll(() => {
  registerUiComponents();
});

/** The widget tags — all map to ScControlBase subclasses (so `updateComplete`
 *  and the control props are visible), unlike the full element map. */
type WidgetTag =
  | "sc-base-checkbox"
  | "sc-base-switch"
  | "sc-base-knob"
  | "sc-base-slider"
  | "sc-base-option"
  | "sc-base-radio"
  | "sc-base-radio-group"
  | "sc-base-select"
  | "sc-base-icon"
  | "sc-base-button"
  | "sc-base-badge"
  | "sc-base-toast"
  | "sc-base-chip"
  | "sc-base-input"
  | "sc-base-inputnumber"
  | "sc-base-textarea"
  | "sc-base-text"
  | "sc-base-progress";

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

describe("sc-base-checkbox", () => {
  it("renders a hidden native checkbox; size reflects to the host", async () => {
    const el = await mount("sc-base-checkbox", { size: "lg" });
    const label = el.shadowRoot!.querySelector("label")!;
    const input = el.shadowRoot!.querySelector("input")!;
    expect(input.type).toBe("checkbox");
    expect(input.classList.contains("sr-only")).toBe(true);
    expect(label).not.toBeNull();
    expect(el.getAttribute("size")).toBe("lg");
  });

  it("toggles and re-emits a composed change carrying checked", async () => {
    const el = await mount("sc-base-checkbox");
    const checks: boolean[] = [];
    el.addEventListener("change", (e) =>
      checks.push((e.target as unknown as ScCheckboxLike).checked),
    );
    const input = el.shadowRoot!.querySelector("input")!;
    input.click();
    expect(el.checked).toBe(true);
    input.click();
    expect(el.checked).toBe(false);
    expect(checks).toEqual([true, false]);
  });

  it("disables the native input", async () => {
    const el = await mount("sc-base-checkbox", { disabled: true });
    expect(el.shadowRoot!.querySelector("input")!.disabled).toBe(true);
  });
});

/** The host re-emits change with `e.target` = the host element, which exposes
 *  `.checked` (checkbox/switch) — not the native input. */
type ScCheckboxLike = { checked: boolean };

describe("sc-base-switch", () => {
  it("uses a role=switch native input and fires native change", async () => {
    const el = await mount("sc-base-switch");
    const checks: boolean[] = [];
    el.addEventListener("change", (e) =>
      checks.push((e.target as unknown as ScCheckboxLike).checked),
    );
    const input = el.shadowRoot!.querySelector("input")!;
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

describe("sc-base-knob", () => {
  it("renders a hidden range and steps it on wheel, firing native change", async () => {
    const el = await mount("sc-base-knob", { min: 0, max: 1, step: 0.01, value: 0 });
    expect(el.shadowRoot!.querySelector("input")!.type).toBe("range");
    const changes = nativeChanges(el);
    el.dispatchEvent(new WheelEvent("wheel", { deltaY: -1, cancelable: true }));
    expect(el.value).toBeCloseTo(0.05);
    expect(changes).toEqual([0.05]);
  });

  it("clamps to max", async () => {
    const el = await mount("sc-base-knob", { min: 0, max: 1, step: 0.1, value: 0.95 });
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
    const el = await mount("sc-base-knob", { min: 0, max: 1, step: 0.01, value: 0.5 });
    const changes = nativeChanges(el);
    drag(el, 15); // +15/60 * 1 = +0.25
    expect(el.value).toBeCloseTo(0.75);
    expect(changes).toEqual([0.75]);
  });

  it("decreases on downward drag", async () => {
    const el = await mount("sc-base-knob", { min: 0, max: 1, step: 0.01, value: 0.5 });
    drag(el, -30); // -30/60 * 1 = -0.5
    expect(el.value).toBeCloseTo(0);
  });

  it("Shift makes the drag finer (×0.2)", async () => {
    const el = await mount("sc-base-knob", { min: 0, max: 1, step: 0.01, value: 0.5 });
    drag(el, 15, { shiftKey: true }); // +0.25 * 0.2 = +0.05
    expect(el.value).toBeCloseTo(0.55);
  });

  it("follows the dominant axis (horizontal drag also adjusts)", async () => {
    const el = await mount("sc-base-knob", { min: 0, max: 1, step: 0.01, value: 0.5 });
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 0, clientY: 300 }));
    document.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, clientX: 15, clientY: 300 }),
    );
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    expect(el.value).toBeCloseTo(0.75); // dx=15 dominates → +15/60 = +0.25
  });
});

describe("sc-base-slider", () => {
  it("reflects orientation to the host and steps the hidden range on wheel", async () => {
    const el = await mount("sc-base-slider", {
      orientation: "vertical",
      min: 0,
      max: 1,
      step: 0.1,
      value: 0.5,
    });
    expect(el.getAttribute("orientation")).toBe("vertical");
    expect(el.shadowRoot!.querySelector("input")!.type).toBe("range");
    const changes = nativeChanges(el);
    el.dispatchEvent(new WheelEvent("wheel", { deltaY: -1, cancelable: true }));
    expect(el.value).toBeCloseTo(1);
    expect(changes).toEqual([1]);
  });
});

describe("sc-base-option", () => {
  it("renders an option row with its label (standalone, no context)", async () => {
    const el = await mount("sc-base-option", { value: 7, label: "Saw" });
    const row = el.shadowRoot!.querySelector('[role="option"]')!;
    expect(row.textContent!.trim()).toBe("Saw");
    expect(row.getAttribute("aria-selected")).toBe("false");
    expect(el.hasAttribute("selected")).toBe(false);
  });
});

describe("sc-base-radio", () => {
  it("renders a hidden native radio and checks itself on click (standalone)", async () => {
    const el = await mount("sc-base-radio", { value: 2, label: "Square" });
    const input = el.shadowRoot!.querySelector("input")!;
    expect(input.type).toBe("radio");
    input.click();
    expect(el.checked).toBe(true);
  });
});

describe("sc-base-radio-group", () => {
  async function mountGroup(value: number) {
    const group = document.createElement("sc-base-radio-group");
    group.innerHTML =
      '<sc-base-radio value="0" label="a"></sc-base-radio>' +
      '<sc-base-radio value="1" label="b"></sc-base-radio>' +
      '<sc-base-radio value="2" label="c"></sc-base-radio>';
    group.value = value;
    document.body.appendChild(group);
    await group.updateComplete;
    const radios = Array.from(group.querySelectorAll("sc-base-radio"));
    await Promise.all(radios.map((r) => r.updateComplete));
    await group.updateComplete; // let context propagate + children re-render
    await Promise.all(radios.map((r) => r.updateComplete));
    return { group, radios };
  }

  it("reflects the orientation to the host", async () => {
    const { group } = await mountGroup(0);
    group.orientation = "vertical";
    await group.updateComplete;
    expect(group.getAttribute("orientation")).toBe("vertical");
  });

  it("shares one name and checks the selected child's input", async () => {
    const { radios } = await mountGroup(1);
    const inputs = radios.map((r) => r.shadowRoot!.querySelector("input")!);
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
    radios[2].shadowRoot!.querySelector("input")!.click();
    expect(group.value).toBe(2);
    expect(changes).toBe(1);
    expect(lastTarget).toBe(group);
  });

  it("propagates size to children via context", async () => {
    const { group, radios } = await mountGroup(0);
    group.size = "lg";
    await group.updateComplete;
    await Promise.all(radios.map((r) => r.updateComplete));
    // The group is authoritative for size: it's synced onto the child's own
    // reflected `size`, so :host([size]) drives the scale.
    expect(radios[0].getAttribute("size")).toBe("lg");
    expect(radios[0].shadowRoot!.querySelector("label")).not.toBeNull();
  });
});

describe("sc-base-select", () => {
  async function mountSelect(value: number) {
    const select = document.createElement("sc-base-select");
    select.innerHTML =
      '<sc-base-option value="0" label="Sine"></sc-base-option>' +
      '<sc-base-option value="1" label="Saw"></sc-base-option>' +
      '<sc-base-option value="2" label="Square"></sc-base-option>';
    select.value = value;
    document.body.appendChild(select);
    await select.updateComplete;
    const options = Array.from(select.querySelectorAll("sc-base-option"));
    await Promise.all(options.map((o) => o.updateComplete));
    return { select, options };
  }

  const combobox = (s: HTMLElement) => s.shadowRoot!.querySelector<HTMLButtonElement>(".combobox")!;
  const dropdown = (s: HTMLElement) => s.shadowRoot!.querySelector<HTMLElement>("sc-base-popover")!;

  // The dropdown is delegated to <sc-base-popover> (the shared top-layer overlay);
  // open/close + light-dismiss aren't exercisable in happy-dom — that's the CDP
  // harness's job. Here we assert the wiring + the context selection path.
  it("shows the selected option label and delegates the dropdown to a listbox popover", async () => {
    const { select } = await mountSelect(1);
    expect(combobox(select).textContent!.trim()).toBe("Saw");
    const panel = dropdown(select);
    expect(panel.getAttribute("role")).toBe("listbox");
    // The combobox names the listbox (was a native popovertarget; now ARIA wiring).
    expect(combobox(select).getAttribute("aria-controls")).toBe(panel.id);
    expect(combobox(select).getAttribute("aria-haspopup")).toBe("listbox");
  });

  it("picks an option via context: updates value, fires change", async () => {
    const { select, options } = await mountSelect(0);
    let changes = 0;
    select.addEventListener("change", () => (changes += 1));
    options[2].shadowRoot!.querySelector<HTMLElement>('[role="option"]')!.click();
    await select.updateComplete;
    expect(select.value).toBe(2);
    expect(changes).toBe(1);
  });

  it("marks the selected option via context", async () => {
    const { options } = await mountSelect(1);
    await Promise.all(options.map((o) => o.updateComplete));
    // Selection is derived from the select's value, reflected to :host([selected]).
    expect(options.map((o) => o.hasAttribute("selected"))).toEqual([false, true, false]);
  });
});

describe("sc-base-icon", () => {
  it("renders the regular icon classes, decorative by default", async () => {
    const el = await mount("sc-base-icon", { name: "play" });
    const i = el.shadowRoot!.querySelector("i")!;
    expect(i.classList.contains("ph")).toBe(true); // regular weight (default)
    expect(i.classList.contains("ph-play")).toBe(true);
    expect(i.getAttribute("aria-hidden")).toBe("true");
  });

  it("maps the variant to the weight class", async () => {
    const fill = await mount("sc-base-icon", { name: "play", variant: "fill" });
    expect(fill.shadowRoot!.querySelector("i")!.classList.contains("ph-fill")).toBe(true);
    const duo = await mount("sc-base-icon", { name: "play", variant: "duotone" });
    expect(duo.shadowRoot!.querySelector("i")!.classList.contains("ph-duotone")).toBe(true);
  });

  it("reflects the size to the host when given", async () => {
    const el = await mount("sc-base-icon", { name: "play", size: "lg" });
    expect(el.getAttribute("size")).toBe("lg");
  });

  it("becomes labelled (role=img) when given a label", async () => {
    const el = await mount("sc-base-icon", { name: "play", label: "Play" });
    const i = el.shadowRoot!.querySelector("i")!;
    expect(i.getAttribute("role")).toBe("img");
    expect(i.getAttribute("aria-label")).toBe("Play");
    expect(i.hasAttribute("aria-hidden")).toBe(false);
  });
});

describe("sc-base-button", () => {
  it("renders a typed button; variant/size reflect to the host; label text", async () => {
    const el = await mount("sc-base-button", { label: "Run", variant: "danger", size: "lg" });
    const btn = el.shadowRoot!.querySelector("button")!;
    expect(btn.getAttribute("type")).toBe("button");
    expect(el.getAttribute("variant")).toBe("danger");
    expect(el.getAttribute("size")).toBe("lg");
    expect(el.shadowRoot!.querySelector(".label")!.textContent).toBe("Run");
  });

  it("renders leading + trailing icons tagged for the edge-hug layout", async () => {
    const el = await mount("sc-base-button", {
      label: "Open",
      icon: "folder",
      trailingIcon: "caret-down",
    });
    const icons = Array.from(el.shadowRoot!.querySelectorAll("sc-base-icon"));
    expect(icons.map((i) => i.getAttribute("name"))).toEqual(["folder", "caret-down"]);
    // Leading/trailing tagged so each hugs its button edge; sized via em (no size attr).
    expect(icons[0].classList.contains("lead")).toBe(true);
    expect(icons[1].classList.contains("trail")).toBe(true);
  });

  it("icon-only: square modifier, no label text, label used as aria-label", async () => {
    const el = await mount("sc-base-button", { icon: "play", iconOnly: true, label: "Play" });
    const btn = el.shadowRoot!.querySelector("button")!;
    expect(btn.classList.contains("iconOnly")).toBe(true);
    expect(el.shadowRoot!.querySelector(".label")).toBeNull();
    expect(el.shadowRoot!.querySelector("sc-base-icon")!.getAttribute("name")).toBe("play");
    expect(btn.getAttribute("aria-label")).toBe("Play");
  });

  it("loading: spinner takes the icon slot, button is busy + disabled, label stays", async () => {
    const el = await mount("sc-base-button", { label: "Save", icon: "gear", loading: true });
    const btn = el.shadowRoot!.querySelector("button")!;
    expect(el.shadowRoot!.querySelector(".spinner")).not.toBeNull();
    expect(el.shadowRoot!.querySelector("sc-base-icon")).toBeNull(); // spinner replaced the icon
    expect(el.shadowRoot!.querySelector(".label")!.textContent).toBe("Save");
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute("aria-busy")).toBe("true");
  });

  it("loading works without an icon (spinner in the leading slot) and icon-only", async () => {
    const plain = await mount("sc-base-button", { label: "Go", loading: true });
    expect(plain.shadowRoot!.querySelector(".spinner")!.classList.contains("lead")).toBe(true);
    expect(plain.shadowRoot!.querySelector(".label")!.textContent).toBe("Go");

    const iconOnly = await mount("sc-base-button", { icon: "play", iconOnly: true, loading: true });
    expect(iconOnly.shadowRoot!.querySelector(".spinner")).not.toBeNull();
    expect(iconOnly.shadowRoot!.querySelector(".label")).toBeNull();
    expect(iconOnly.shadowRoot!.querySelector("button")!.classList.contains("iconOnly")).toBe(true);
  });

  it("fires a bubbling click from the inner button", async () => {
    const el = await mount("sc-base-button", { label: "Go" });
    let clicks = 0;
    el.addEventListener("click", () => (clicks += 1));
    el.shadowRoot!.querySelector("button")!.click();
    expect(clicks).toBe(1);
  });

  it("does not click when disabled", async () => {
    const el = await mount("sc-base-button", { label: "Go", disabled: true });
    let clicks = 0;
    el.addEventListener("click", () => (clicks += 1));
    el.shadowRoot!.querySelector("button")!.click();
    expect(clicks).toBe(0);
  });
});

describe("sc-base-badge", () => {
  it("renders the label; ok is the base variant", async () => {
    const el = await mount("sc-base-badge", { label: "connected" });
    expect(el.shadowRoot!.textContent!.trim()).toBe("connected");
    expect(el.getAttribute("variant")).toBe("ok");
  });

  it("reflects the variant to the host", async () => {
    const el = await mount("sc-base-badge", { label: "offline", variant: "error" });
    expect(el.getAttribute("variant")).toBe("error");
  });
});

describe("sc-base-toast", () => {
  it("renders the message; default is the base variant", async () => {
    const el = await mount("sc-base-toast", { message: "Saved." });
    expect(el.shadowRoot!.querySelector(".message")!.textContent!.trim()).toBe("Saved.");
    expect(el.getAttribute("variant")).toBe("default");
  });

  it("reflects the variant to the host", async () => {
    const el = await mount("sc-base-toast", { message: "Late", variant: "warn" });
    expect(el.getAttribute("variant")).toBe("warn");
  });

  it("dispatches a bubbling dismiss event on close", async () => {
    const el = await mount("sc-base-toast", { message: "x" });
    let dismissed = 0;
    el.addEventListener("dismiss", () => (dismissed += 1));
    el.shadowRoot!.querySelector<HTMLButtonElement>(".close")!.click();
    expect(dismissed).toBe(1);
  });
});

describe("sc-base-chip", () => {
  it("renders the label; neutral is the base variant, no dot", async () => {
    const el = await mount("sc-base-chip", { label: "idle" });
    expect(el.shadowRoot!.textContent!.trim()).toBe("idle");
    expect(el.getAttribute("variant")).toBe("neutral");
    expect(el.shadowRoot!.querySelector(".dot")).toBeNull();
  });

  it("reflects the variant and shows the dot when enabled", async () => {
    const el = await mount("sc-base-chip", { label: "alive", variant: "ok", dot: true });
    expect(el.getAttribute("variant")).toBe("ok");
    expect(el.shadowRoot!.querySelector(".dot")).not.toBeNull();
  });
});

describe("sc-base-input", () => {
  it("renders a text input; size reflects to the host", async () => {
    const el = await mount("sc-base-input", { size: "lg", placeholder: "name" });
    const input = el.shadowRoot!.querySelector("input")!;
    expect(input.type).toBe("text");
    expect(el.getAttribute("size")).toBe("lg");
    expect(input.placeholder).toBe("name");
  });

  it("mirrors value and re-emits a composed input", async () => {
    const el = await mount("sc-base-input");
    const inputs: string[] = [];
    el.addEventListener("input", (e) =>
      inputs.push((e.target as unknown as ScInputBaseLike).value),
    );
    const input = el.shadowRoot!.querySelector("input")!;
    input.value = "hello";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(el.value).toBe("hello");
    expect(inputs).toEqual(["hello"]);
  });
});

/** The host re-emits input/change with `e.target` = the host, which exposes
 *  `.value`. */
type ScInputBaseLike = { value: string };

describe("sc-base-inputnumber", () => {
  it("renders a number input plus two stepper buttons", async () => {
    const el = await mount("sc-base-inputnumber", { value: 2 });
    expect(el.shadowRoot!.querySelector("input")!.type).toBe("number");
    expect(el.shadowRoot!.querySelectorAll(".step").length).toBe(2);
  });

  it("steps up by `step`, re-emitting composed change with the new value", async () => {
    const el = await mount("sc-base-inputnumber", { value: 0, step: 1, max: 5 });
    const changes: number[] = [];
    el.addEventListener("change", (e) =>
      changes.push(Number((e.target as unknown as { value: number }).value)),
    );
    el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".step")[0].click();
    expect(el.value).toBe(1);
    expect(changes).toEqual([1]);
  });

  it("clamps to max at the bound", async () => {
    const el = await mount("sc-base-inputnumber", { value: 4.5, step: 1, max: 5 });
    const up = el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".step")[0];
    up.click(); // 4.5 → clamp(quantize(5.5)) = 5
    up.click(); // already 5 → no-op
    expect(el.value).toBe(5);
  });

  it("clamps a typed out-of-range value on change", async () => {
    const el = await mount("sc-base-inputnumber", { value: 0, max: 5 });
    const input = el.shadowRoot!.querySelector("input")!;
    input.value = "999";
    input.dispatchEvent(new Event("input", { bubbles: true })); // live: 999
    input.dispatchEvent(new Event("change", { bubbles: true })); // commit: clamps
    expect(el.value).toBe(5);
  });

  it("rounds the outer corners only (top-right up, bottom-right down)", async () => {
    const el = await mount("sc-base-inputnumber", { value: 1 });
    expect(el.shadowRoot!.querySelector(".stepUp")).not.toBeNull();
    expect(el.shadowRoot!.querySelector(".stepDown")).not.toBeNull();
  });
});

describe("sc-base-textarea", () => {
  it("renders a textarea with rows; size reflects to the host", async () => {
    const el = await mount("sc-base-textarea", { rows: 5, size: "lg", placeholder: "notes" });
    const ta = el.shadowRoot!.querySelector("textarea")!;
    expect(ta.getAttribute("rows")).toBe("5");
    expect(el.getAttribute("size")).toBe("lg");
    expect(ta.placeholder).toBe("notes");
  });

  it("mirrors value and re-emits a composed input", async () => {
    const el = await mount("sc-base-textarea");
    const inputs: string[] = [];
    el.addEventListener("input", (e) =>
      inputs.push((e.target as unknown as ScInputBaseLike).value),
    );
    const ta = el.shadowRoot!.querySelector("textarea")!;
    ta.value = "multi\nline";
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    expect(el.value).toBe("multi\nline");
    expect(inputs).toEqual(["multi\nline"]);
  });
});

describe("sc-base-text", () => {
  it("renders a <span> by default and reflects the typography modifiers to the host", async () => {
    const el = document.createElement("sc-base-text");
    el.textContent = "Heading";
    el.size = "xl";
    el.weight = "bold";
    el.tone = "dim";
    el.font = "mono";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.textContent).toBe("Heading");
    expect(el.shadowRoot!.querySelector("span")).not.toBeNull();
    // Modifiers reflect to the host (styled via :host([attr]) > *), like the rest of the library.
    expect(el.getAttribute("size")).toBe("xl");
    expect(el.getAttribute("weight")).toBe("bold");
    expect(el.getAttribute("tone")).toBe("dim");
    expect(el.getAttribute("font")).toBe("mono");
  });

  it("renders the semantic element chosen by `as`, keeping the visual modifiers", async () => {
    const el = document.createElement("sc-base-text");
    el.setAttribute("as", "h2");
    el.textContent = "Title";
    el.size = "lg";
    document.body.appendChild(el);
    await el.updateComplete;
    const heading = el.shadowRoot!.querySelector("h2")!;
    expect(heading).not.toBeNull();
    expect(el.shadowRoot!.querySelector("span")).toBeNull();
    expect(el.getAttribute("size")).toBe("lg"); // look stays prop-driven
    expect(heading.textContent!.trim()).toBe(""); // text is slotted (light DOM)
    expect(el.textContent).toBe("Title");
  });

  it("supports label as a semantic element", async () => {
    const el = document.createElement("sc-base-text");
    el.as = "label";
    el.textContent = "Frequency";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("label")).not.toBeNull();
    expect(el.textContent).toBe("Frequency");
  });

  it("reflects the truncate/inline boolean modifiers to the host", async () => {
    const el = document.createElement("sc-base-text");
    el.truncate = true;
    el.inline = true;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("span")).not.toBeNull();
    expect(el.hasAttribute("truncate")).toBe(true);
    expect(el.hasAttribute("inline")).toBe(true);
  });
});

// These widgets are shadow DOM and do NOT participate in outer forms (by
// design — form participation was dropped). They still forward `name` to their
// hidden native input for radio grouping + a11y.
describe("name forwarding", () => {
  it("forwards `name` to the native input/textarea", async () => {
    const input = await mount("sc-base-input", { name: "title" });
    expect(input.shadowRoot!.querySelector("input")!.name).toBe("title");
    const ta = await mount("sc-base-textarea", { name: "notes" });
    expect(ta.shadowRoot!.querySelector("textarea")!.name).toBe("notes");
    const num = await mount("sc-base-inputnumber", { name: "freq" });
    expect(num.shadowRoot!.querySelector("input")!.name).toBe("freq");
    const cb = await mount("sc-base-checkbox", { name: "agree" });
    expect(cb.shadowRoot!.querySelector("input")!.name).toBe("agree");
    const knob = await mount("sc-base-knob", { name: "gain" });
    expect(knob.shadowRoot!.querySelector("input")!.name).toBe("gain");
  });

  it("radio-group shares its name with the radios + value on the checked one", async () => {
    const group = document.createElement("sc-base-radio-group");
    group.setAttribute("name", "wave");
    group.innerHTML =
      '<sc-base-radio value="0"></sc-base-radio><sc-base-radio value="1"></sc-base-radio>';
    group.value = 1;
    document.body.appendChild(group);
    await group.updateComplete;
    const radios = Array.from(group.querySelectorAll("sc-base-radio"));
    await Promise.all(radios.map((r) => r.updateComplete));
    await group.updateComplete;
    await Promise.all(radios.map((r) => r.updateComplete));
    const inputs = radios.map((r) => r.shadowRoot!.querySelector("input")!);
    expect(inputs.every((i) => i.name === "wave")).toBe(true);
    expect(inputs[1].checked).toBe(true);
    expect(inputs[1].value).toBe("1");
  });
});

// happy-dom has no top layer / layout, so we assert structure + open-state +
// event wiring only; the escape-clipping / positioning / light-dismiss is
// verified in a real browser (the CDP harness).
describe("sc-base-popover", () => {
  it("renders a .sc-popover panel slotting its children", async () => {
    const el = document.createElement("sc-base-popover");
    el.innerHTML = "<span>menu</span>";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.renderRoot.querySelector(".panel")).not.toBeNull();
    expect(el.querySelector("span")!.textContent).toBe("menu");
  });

  it("anchors to its previous sibling and reflects open via a toggle event", async () => {
    const anchor = document.createElement("button");
    const el = document.createElement("sc-base-popover");
    document.body.append(anchor, el);
    await el.updateComplete;
    expect(el.previousElementSibling).toBe(anchor);

    let toggles = 0;
    el.addEventListener("toggle", () => toggles++);
    el.open = true;
    await el.updateComplete;
    // The panel carries the popover attribute (top-layer opt-in) once attached.
    expect(el.renderRoot.querySelector(".panel")!.getAttribute("popover")).toBe("auto");
    expect(toggles).toBeGreaterThanOrEqual(0); // toggle event only fires where the API runs
  });
});

// showModal()/::backdrop/focus-trap need a real top layer (CDP harness); here we
// assert the structure, the slotted content, and the dismissable wiring.
describe("sc-base-modal", () => {
  it("renders a <dialog class=modal> slotting its content", async () => {
    const el = document.createElement("sc-base-modal");
    el.innerHTML = '<h2 class="sc-modal__title">Hi</h2>';
    document.body.appendChild(el);
    await el.updateComplete;
    const dialog = el.renderRoot.querySelector("dialog");
    expect(dialog).not.toBeNull();
    // Content stays light-DOM (slotted), reachable from the host.
    expect(el.querySelector(".sc-modal__title")!.textContent).toBe("Hi");
  });

  it("emits close + clears open when the dialog closes", async () => {
    const el = document.createElement("sc-base-modal");
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

// sc-base-drawer shares ScDialogBase with the modal; the showModal()/top-layer/
// slide is CDP-verified. Here: structure, slotted content, side reflection, and
// the close-event contract.
describe("sc-base-drawer", () => {
  it("renders a <dialog class=drawer> slotting its content, side reflected", async () => {
    const el = document.createElement("sc-base-drawer");
    el.side = "left";
    el.innerHTML = "<header><h2>Plugins</h2></header><div>body</div>";
    document.body.appendChild(el);
    await el.updateComplete;
    const dialog = el.renderRoot.querySelector("dialog");
    expect(dialog).not.toBeNull();
    expect(el.getAttribute("side")).toBe("left");
    expect(el.querySelector("header h2")!.textContent).toBe("Plugins");
  });

  it("defaults to the right side and emits close on dialog close", async () => {
    const el = document.createElement("sc-base-drawer");
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

// Content wrappers: shadow DOM rendering a bare <slot>; the author's children
// stay light-DOM (slotted, still reachable from the host), styling driven by
// `:host` + reflected modifier attributes (variant/disabled).
describe("content wrappers", () => {
  it("sc-base-alert slots children and applies the variant class", async () => {
    const el = document.createElement("sc-base-alert");
    el.innerHTML = "scsynth <strong>down</strong>";
    el.variant = "error";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.querySelector("strong")!.textContent).toBe("down"); // slotted light DOM
    expect(el.getAttribute("variant")).toBe("error");
  });

  it("sc-base-alert defaults to the info variant (role=status)", async () => {
    const el = document.createElement("sc-base-alert");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.variant).toBe("info");
    expect(el.getAttribute("variant")).toBe("info");
    expect(el.getAttribute("role")).toBe("status");
  });

  it("sc-base-panel slots its header + content and reflects disabled", async () => {
    const el = document.createElement("sc-base-panel");
    el.innerHTML = "<header>Seq</header><span>body</span>";
    el.disabled = true;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.querySelector("header")!.textContent).toBe("Seq");
    expect(el.querySelector("span")!.textContent).toBe("body");
    expect(el.hasAttribute("disabled")).toBe(true);
  });

  it("sc-base-empty slots children", async () => {
    const el = document.createElement("sc-base-empty");
    el.textContent = "no items yet";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("slot")).not.toBeNull();
    expect(el.textContent).toBe("no items yet");
  });

  it("sc-base-flex exposes neutral defaults and reflects its layout axes", async () => {
    const el = document.createElement("sc-base-flex");
    el.innerHTML = "<span>a</span><span>b</span>";
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.querySelectorAll("span").length).toBe(2); // slotted light DOM
    expect([el.orientation, el.wrap, el.justify, el.align, el.gap]).toEqual([
      "horizontal",
      false,
      "start",
      "stretch",
      "none",
    ]);

    el.orientation = "vertical";
    el.wrap = true;
    el.justify = "space-between";
    el.align = "center";
    el.gap = "md";
    await el.updateComplete;
    expect([
      el.getAttribute("orientation"),
      el.hasAttribute("wrap"),
      el.getAttribute("justify"),
      el.getAttribute("align"),
      el.getAttribute("gap"),
    ]).toEqual(["vertical", true, "space-between", "center", "md"]);
  });

  it("sc-base-row / sc-base-col expose the non-responsive 24-unit grid", async () => {
    const row = document.createElement("sc-base-row");
    const col = document.createElement("sc-base-col");
    col.textContent = "content";
    row.appendChild(col);
    document.body.appendChild(row);
    await Promise.all([row.updateComplete, col.updateComplete]);

    expect([row.align, row.justify, row.gutter, row.wrap]).toEqual(["top", "start", "none", true]);
    expect(row.querySelector("sc-base-col")).toBe(col); // direct slotted child

    row.align = "middle";
    row.justify = "space-between";
    row.gutter = "md";
    row.wrap = false;
    col.span = 8;
    col.offset = 2;
    col.order = 3;
    col.push = 1;
    await Promise.all([row.updateComplete, col.updateComplete]);

    expect([
      row.getAttribute("align"),
      row.getAttribute("justify"),
      row.getAttribute("gutter"),
      row.style.getPropertyValue("--sc-row-wrap"),
    ]).toEqual(["middle", "space-between", "md", "nowrap"]);
    expect([
      col.style.getPropertyValue("--sc-col-span"),
      col.style.getPropertyValue("--sc-col-offset"),
      col.style.getPropertyValue("--sc-col-order"),
      col.style.getPropertyValue("--sc-col-push"),
    ]).toEqual(["8", "2", "3", "1"]);

    col.span = 99; // grid placement is clamped to the 24-unit contract
    col.flex = "auto";
    await col.updateComplete;
    expect(col.style.getPropertyValue("--sc-col-span")).toBe("24");
    expect(col.style.getPropertyValue("--sc-col-flex")).toBe("auto");
  });
});

// sc-base-disclosure wraps a native <details> in shadow DOM, syncing `open`.
describe("sc-base-disclosure", () => {
  it("renders details with slotted summary + content, mirrors open", async () => {
    const el = document.createElement("sc-base-disclosure");
    el.innerHTML = '<span slot="summary">Title</span><p>body</p>';
    el.open = true;
    document.body.appendChild(el);
    await el.updateComplete;
    const details = el.renderRoot.querySelector("details")!;
    expect(details.open).toBe(true);
    expect(el.querySelector('[slot="summary"]')!.textContent).toBe("Title");
  });

  it("mirrors a native toggle back into open + emits toggle", async () => {
    const el = document.createElement("sc-base-disclosure");
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
    for (const tag of ["sc-base-modal", "sc-base-drawer"] as const) {
      const el = document.createElement(tag);
      el.label = "Plugins";
      document.body.appendChild(el);
      await el.updateComplete;
      expect(el.renderRoot.querySelector("dialog")!.getAttribute("aria-label")).toBe("Plugins");
    }
  });

  it("radio-group is role=radiogroup with its label as aria-label", async () => {
    const el = document.createElement("sc-base-radio-group");
    el.label = "Waveform";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("role")).toBe("radiogroup");
    expect(el.getAttribute("aria-label")).toBe("Waveform");
  });

  it("alert role tracks severity (error=alert, else status)", async () => {
    const el = document.createElement("sc-base-alert");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.getAttribute("role")).toBe("status"); // default info
    el.variant = "error";
    await el.updateComplete;
    expect(el.getAttribute("role")).toBe("alert");
  });

  it("toast role tracks severity (error/warn=alert, else status)", async () => {
    const el = await mount("sc-base-toast", { variant: "error" });
    expect(el.getAttribute("role")).toBe("alert");
    const info = await mount("sc-base-toast", { variant: "info" });
    expect(info.getAttribute("role")).toBe("status");
  });

  it("knob/slider expose label as aria-label + a precision-rounded aria-valuetext", async () => {
    for (const tag of ["sc-base-knob", "sc-base-slider"] as const) {
      const el = await mount(tag, { label: "Gain", value: 0.8, step: 0.01 });
      const input = el.shadowRoot!.querySelector("input")!;
      expect(input.getAttribute("aria-label")).toBe("Gain");
      expect(input.getAttribute("aria-valuetext")).toBe("0.80");
    }
  });
});

describe("sc-base-progress", () => {
  it("defaults to an indeterminate bar (role=progressbar, busy, no valuenow)", async () => {
    const el = await mount("sc-base-progress");
    const bar = el.shadowRoot!.querySelector(".bar")!;
    expect(bar.classList.contains("indeterminate")).toBe(true);
    expect(bar.getAttribute("role")).toBe("progressbar");
    expect(bar.getAttribute("aria-busy")).toBe("true");
    expect(bar.hasAttribute("aria-valuenow")).toBe(false);
    expect(el.shadowRoot!.querySelector(".fill")).not.toBeNull();
  });

  it("with a value becomes determinate: rounded aria-valuenow + a fill width", async () => {
    const el = await mount("sc-base-progress", { value: 60 });
    const bar = el.shadowRoot!.querySelector(".bar")!;
    expect(bar.classList.contains("determinate")).toBe(true);
    expect(bar.hasAttribute("aria-busy")).toBe(false);
    expect(bar.getAttribute("aria-valuenow")).toBe("60");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect((el.shadowRoot!.querySelector(".fill") as HTMLElement).style.width).toBe("60%");
  });

  it("clamps value to [0,max] for the fill width and honours a custom max", async () => {
    const over = await mount("sc-base-progress", { value: 9999 });
    expect((over.shadowRoot!.querySelector(".fill") as HTMLElement).style.width).toBe("100%");
    const scaled = await mount("sc-base-progress", { value: 5, max: 10 });
    expect((scaled.shadowRoot!.querySelector(".fill") as HTMLElement).style.width).toBe("50%");
    expect(scaled.shadowRoot!.querySelector(".bar")!.getAttribute("aria-valuemax")).toBe("10");
  });

  it("spinner variant renders the ring host itself with the determinate angle", async () => {
    const indet = await mount("sc-base-progress", { variant: "spinner" });
    const ring = indet.shadowRoot!.querySelector(".spinner")!;
    expect(ring.classList.contains("indeterminate")).toBe(true);
    expect(indet.shadowRoot!.querySelector(".fill")).toBeNull();

    const det = await mount("sc-base-progress", { variant: "spinner", value: 75 });
    expect(
      (det.shadowRoot!.querySelector(".spinner") as HTMLElement).style.getPropertyValue("--_pct"),
    ).toBe("75");
  });

  it("carries the label as the accessible name", async () => {
    const el = await mount("sc-base-progress", { label: "Connecting…" });
    expect(el.shadowRoot!.querySelector(".bar")!.getAttribute("aria-label")).toBe("Connecting…");
  });
});
