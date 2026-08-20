// Base for the LEVEL-OPENING elements — the only ones owning parsed sc
// children (`ScNode`'s plugin/group/synth, `ScSynthDef`, `ScUgen`).
// Transparent containers and leaves never extend it: they have no
// `_scChildren` at all (reading the property off them yields undefined).
// Carries the whole children machinery: the runtime-tree field, the
// parse-scope walker, `processChildren`, and the load/unload child walks.

import { isNodeType } from "@/lib/utils/guards";
import { processChildren } from "@/sc-elements/internal/engine";
import { isTransparent } from "@/sc-elements/internal/engine/resolution";
import { ScElement } from "@/sc-elements/internal/sc-element";
import type { RuntimeContext } from "@/types/runtime";

export abstract class ScParent extends ScElement {
  /** The parsed sc-* child elements (NOT the DOM children: sc-* descendants
   *  reached through plain HTML wrappers, with transparent containers'
   *  contents flattened in). */
  _scChildren: ScElement[] = [];
  /** The load-pass epoch — only the plugin ROOT's counts (`loadGuard` reads
   *  it through `_rootScNode`). Bumped by the root's unload()/reload(), it
   *  invalidates a suspended load pass: the sequential walk re-checks it
   *  after every awaited child and aborts when it moved (disconnect unload,
   *  or a newer pass superseding this one). */
  loadEpoch = 0;

  /** This element's sc-* descendants, recursing through plain HTML wrappers
   *  AND through transparent (nameless) sc containers — those are yielded
   *  too, before their contents, so ONE flat level covers an sc-if's whole
   *  subtree (its contents live in the enclosing scope: same duplicate
   *  check, same bind scope, same store paths — unconditionally, since
   *  sc-if only hides visually). Nameless leaves have no sc children at
   *  parse time, so descending into them is a no-op. */
  *walkScElements(el: Element = this): Generator<ScElement> {
    for (const child of Array.from(el.children)) {
      if (isNodeType(child.tagName.toLowerCase())) {
        yield child as ScElement;
        if (isTransparent(child)) yield* this.walkScElements(child);
      } else {
        yield* this.walkScElements(child);
      }
    }
  }

  /** Extending ScParent IS opening a level: the base resolution recurses
   *  into the children first (the engine's `processChildren` drives the
   *  cursor and collects them into `_scChildren`), then runs ScElement's
   *  generic bind pass — overrides layer their own resolution over
   *  `super.resolveRuntime(ctx)` with `this._scChildren` already parsed. */
  resolveRuntime(ctx: RuntimeContext): void {
    processChildren(this, ctx);
    super.resolveRuntime(ctx);
  }

  /** The async load pass, in strict DOM order: own wiring first (the base
   *  prefix), then each child fully awaited before the next — no
   *  concurrency, no reactive gates. The bind-order constraint (targets
   *  declared before their references) makes DOM order a valid dependency
   *  order, so a synthdef's /d_recv is acknowledged before its synth's
   *  /s_new is sent. Overrides sequence their own OSC and call
   *  `super.load()` where the children should follow. */
  async load(): Promise<void> {
    await super.load();
    const live = this.loadGuard();
    for (const child of this._scChildren) {
      await child.load();
      if (!live()) return; // pass invalidated mid-await
    }
  }

  /** Children unload in REVERSE DOM order so dependents go before their
   *  targets; sends are fire-and-forget — no replies awaited. */
  unload(): void {
    for (const child of [...this._scChildren].reverse()) {
      child.unload();
    }
    super.unload();
  }
}
