// Per-element attribute extraction + validation (ported from the old sc-app's
// lib/html/handlers, made strict): the backend XSD already validates plugin
// bundles at upload, but the parser re-validates at runtime so hand-injected
// or stale-schema markup fails loudly with the offending tag + attribute.

import { ELEMENTS } from "@/constants/sc-elements";
import type {
  ScControlItem,
  ScConsoleItem,
  ScPluginItem,
  ScRangeItem,
  ScScopeItem,
  ScStrudelItem,
  ScSynthDefItem,
  ScSynthItem,
  ScUgenItem,
  StripRuntime,
} from "@/types/parsers";

/** The props `extractProps` contributes for an item type (everything but the
 *  parser-assigned `id`/`type`/`_element`). */
type HtmlProps<T> = Omit<StripRuntime<T>, "id" | "type" | "_element">;

const UGEN_RATES: ReadonlySet<string> = new Set(["ar", "kr", "ir"]);

function fail(el: Element, message: string): never {
  throw new Error(`<${el.tagName.toLowerCase()}>: ${message}`);
}

function requiredAttr(el: Element, name: string): string {
  const value = el.getAttribute(name);
  if (!value) fail(el, `missing required "${name}" attribute`);
  return value;
}

function numberAttr(el: Element, name: string, fallback: number): number {
  const raw = el.getAttribute(name);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (Number.isNaN(value)) fail(el, `"${name}" attribute must be a number (got "${raw}")`);
  return value;
}

const SC_ELEMENT_SELECTOR = Object.values(ELEMENTS).join(", ");

/** Leaf elements take no attributes today — but they must not nest other
 *  sc-* elements. (Plain DOM children are fine: an upgraded Lit element has
 *  already rendered its own UI into itself by the time the parser runs.) */
function extractLeafProps(el: Element): Record<string, never> {
  if (el.querySelector(SC_ELEMENT_SELECTOR)) fail(el, "must not contain sc-* elements");
  return {};
}

function extractPluginProps(el: Element): HtmlProps<ScPluginItem> {
  return {
    run: el.getAttribute("run") !== "false",
    children: [],
  };
}

function extractSynthDefProps(el: Element): HtmlProps<ScSynthDefItem> {
  return {
    name: requiredAttr(el, "name"),
    children: [],
  };
}

function extractUgenProps(el: Element): HtmlProps<ScUgenItem> {
  const rate = el.getAttribute("rate") ?? "ar";
  if (!UGEN_RATES.has(rate)) fail(el, `"rate" attribute must be one of ar|kr|ir (got "${rate}")`);
  return {
    name: requiredAttr(el, "name"),
    ugen: requiredAttr(el, "type"),
    rate,
    op: el.getAttribute("op") ?? undefined,
    children: [],
  };
}

function extractControlProps(el: Element): HtmlProps<ScControlItem> {
  const name = requiredAttr(el, "name");
  const bind = el.getAttribute("bind");
  if (bind !== null) {
    if (el.getAttribute("value") !== null) fail(el, `"value" and "bind" are mutually exclusive`);
    return { name, bind };
  }
  return { name, value: numberAttr(el, "value", 0) };
}

function extractSynthProps(el: Element): HtmlProps<ScSynthItem> {
  return {
    name: requiredAttr(el, "name"),
    bind: el.getAttribute("bind") ?? "",
    run: el.getAttribute("run") !== "false",
    children: [],
  };
}

function extractRangeProps(el: Element): HtmlProps<ScRangeItem> {
  // min/max/step/value are consumed by the Lit component; the parser only
  // carries the binding — but validate the numerics here all the same.
  numberAttr(el, "min", 0);
  numberAttr(el, "max", 1);
  numberAttr(el, "step", 0.01);
  numberAttr(el, "value", 0);
  return { bind: el.getAttribute("bind") ?? "" };
}

export function extractProps(type: string, el: Element): Record<string, unknown> {
  switch (type) {
    case ELEMENTS.SC_PLUGIN:
      return extractPluginProps(el);
    case ELEMENTS.SC_SYNTHDEF:
      return extractSynthDefProps(el);
    case ELEMENTS.SC_UGEN:
      return extractUgenProps(el);
    case ELEMENTS.SC_CONTROL:
      return extractControlProps(el);
    case ELEMENTS.SC_SYNTH:
      return extractSynthProps(el);
    case ELEMENTS.SC_RANGE:
      return extractRangeProps(el);
    case ELEMENTS.SC_CONSOLE:
      return extractLeafProps(el) satisfies HtmlProps<ScConsoleItem>;
    case ELEMENTS.SC_SCOPE:
      return extractLeafProps(el) satisfies HtmlProps<ScScopeItem>;
    case ELEMENTS.SC_STRUDEL:
      return extractLeafProps(el) satisfies HtmlProps<ScStrudelItem>;
    default:
      throw new Error(`Unknown element type: ${type}`);
  }
}
