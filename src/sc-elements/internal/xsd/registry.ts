// Runtime spec registry: the per-component `<tag>.spec.ts` files, keyed by tag.
// The specs are the single source for the attribute contract — the XSD is
// generated from them (scripts/generate-xsd.ts), and at runtime ScElement reads
// them via `getProp` and the engine's `validate`. Collected with `import.meta.glob` (the
// pattern used in __tests__/examples.test.ts) so a new spec is picked up with no
// manual registration.

import type { ElementSpec } from "@/sc-elements/internal/xsd/types";

const modules = import.meta.glob<{ spec: ElementSpec }>("/src/sc-elements/**/*.spec.ts", {
  eager: true,
});

export const SPECS: ReadonlyMap<string, ElementSpec> = new Map(
  Object.values(modules).map((m) => [m.spec.tag, m.spec]),
);
