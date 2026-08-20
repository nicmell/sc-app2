// TRANSITIONAL drift guard (dies with the *.spec.ts files): the crate's
// authored specs/<tag>.spec.json must carry EXACTLY the data of the colocated
// spec.ts registry — tag bijection, category, unflattened content, and the
// ordered, normalized attribute list. Covers what the XSD byte-gate cannot
// (per-attr `runtime`, `required` on runtime attrs, `numeric`,
// scalar-vs-string); the html vocabulary needs no guard here (the crate table
// and html.ts are both pinned against preamble.xml).

import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SPECS } from "@/sc-elements/internal/xsd/registry";
import type { AttrSpec, ElementSpec } from "@/sc-elements/internal/xsd/types";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const SPECS_DIR = resolve(REPO, "src-tauri/crates/sc-validate/specs");

interface Canonical {
  tag: string;
  category: string;
  attrs: Array<[string, Record<string, unknown>]>;
  content: { choice: string[]; mixed: boolean } | null;
}

function canonicalAttr(attr: AttrSpec): Record<string, unknown> {
  const out: Record<string, unknown> = {
    type: attr.type,
    required: attr.required ?? false,
    runtime: attr.runtime !== false,
  };
  if (attr.default !== undefined) out.default = attr.default;
  if (attr.min !== undefined) out.min = attr.min;
  if (attr.max !== undefined) out.max = attr.max;
  if (attr.exclusiveMin !== undefined) out.exclusiveMin = attr.exclusiveMin;
  if (attr.type === "vector") out.numeric = attr.numeric ?? false;
  if (attr.type === "enum") out.values = [...attr.values];
  return out;
}

function canonical(spec: ElementSpec): Canonical {
  return {
    tag: spec.tag,
    category: spec.category,
    attrs: Object.entries(spec.attrs ?? {}).map(([name, attr]) => [name, canonicalAttr(attr)]),
    content: spec.content?.choice?.length
      ? { choice: [...spec.content.choice], mixed: !!spec.content.mixed }
      : null,
  };
}

/** The authored JSON, $comment-stripped and normalized to the same shape. */
function canonicalFile(file: string): Canonical {
  const raw = JSON.parse(readFileSync(resolve(SPECS_DIR, file), "utf8")) as {
    tag: string;
    category: string;
    attrs?: Record<string, Record<string, unknown> & { $comment?: unknown }>;
    content?: { choice?: string[]; mixed?: boolean };
  };
  return {
    tag: raw.tag,
    category: raw.category,
    attrs: Object.entries(raw.attrs ?? {}).map(([name, { $comment: _, ...attr }]) => [
      name,
      {
        ...attr,
        required: attr.required ?? false,
        runtime: attr.runtime !== false,
        ...(attr.type === "vector" ? { numeric: attr.numeric ?? false } : {}),
      },
    ]),
    content: raw.content
      ? { choice: raw.content.choice ?? [], mixed: !!raw.content.mixed }
      : null,
  };
}

describe("crate spec parity (transitional)", () => {
  const files = readdirSync(SPECS_DIR).filter((f) => f.endsWith(".spec.json"));

  it("the crate files and the spec.ts registry are a bijection", () => {
    expect(new Set(files.map((f) => f.replace(/\.spec\.json$/, "")))).toEqual(
      new Set(SPECS.keys()),
    );
  });

  it.each(files)("%s matches its spec.ts", (file) => {
    const fromFile = canonicalFile(file);
    const fromTs = SPECS.get(fromFile.tag);
    expect(fromTs, `no spec.ts for ${fromFile.tag}`).toBeDefined();
    expect(fromFile).toEqual(canonical(fromTs as ElementSpec));
  });
});
