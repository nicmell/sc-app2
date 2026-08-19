// The parse ENGINE — the interpreter driving the two-step element pipeline
// as free functions over a CURSOR context: `ctx.siblings` is the level's
// flattened walk and `ctx.index` the driver-set position of the current
// element (`ctx.scope` stays the cumulative name-lookup chain — the level
// prefix coincides with `siblings`, but nothing contracts on that). The
// engine owns everything positional and unconditional — identity (the
// path-chained hash id), the shared runtime core, the re-entrancy guard,
// the duplicate-name integrity, the canonical error shape — while the
// elements provide the two extension hooks (`validate()` /
// `resolveRuntime(ctx)`) and ScParent calls back into `processChildren`
// where it opens a level.

import { contentHash } from "./contentHash";
import { checkDuplicateNames, nameOf } from "./resolution";
import type { ScElement } from "@/sc-elements/internal/sc-element";
import type { ScParent } from "@/sc-elements/internal/sc-parent";
import type { RuntimeContext } from "@/types/runtime";

/** Process the element at the cursor (`ctx.siblings[ctx.index]`):
 *  pre-register it (so re-entrant resolves of a mid-processing ancestor
 *  return it), assign the identity + shared runtime core (the path-chained
 *  hash id minted from the level owner's id + the cursor position,
 *  `_rootScNode`/`basePath`/`_parentScNode` — the level owner; the OWNER
 *  collects the element into its `_scChildren` once processing completes,
 *  see `processChildren`), then run the element's two steps — `validate()`
 *  (static) and `resolveRuntime(ctx)` (runtime construction). Library
 *  throws get the canonical `<tag>:` prefix; already-shaped errors pass
 *  through. Idempotent — an already-processed element is returned as-is. */
export function process(ctx: RuntimeContext): ScElement {
  const el = ctx.siblings[ctx.index];
  if (ctx.nodes.has(el)) {
    return el;
  }
  ctx.nodes.add(el);
  try {
    el.id = contentHash(el, ctx.parentNode?.id ?? "", ctx.index);
    el._rootScNode = ctx.rootNode;
    el.basePath = ctx.path;
    el._parentScNode = ctx.parentNode;
    el.validate();
    el.resolveRuntime(ctx);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (e instanceof Error && message.startsWith("<")) throw e;
    throw new Error(`<${el.tagName.toLowerCase()}>: ${message}`, { cause: e });
  }
  return el;
}

/** Open a level under `parent` (called back from ScParent.resolveRuntime):
 *  collect the full sibling scope (including transparent containers'
 *  contents) into the level context and check duplicate names across it
 *  BEFORE any child processes — then reset `_scChildren` and drive the
 *  cursor over the siblings in document order, COLLECTING each into the
 *  parent as it completes (a mid-processing element is not yet a child —
 *  the circular-bind rejection in resolveStatePath relies on that). All
 *  siblings share ONE level context. */
export function processChildren(parent: ScParent, ctx: RuntimeContext): void {
  const name = nameOf(parent);
  const path = name ? [...ctx.path, name] : ctx.path;

  const siblings = [...parent.walkScElements()];

  checkDuplicateNames(siblings);

  parent._scChildren = [];
  const childCtx: RuntimeContext = {
    rootNode: ctx.rootNode,
    nodes: ctx.nodes,
    siblings,
    scope: [...siblings, ...ctx.scope],
    parentNode: parent,
    path,
    index: 0,
  };
  for (let i = 0; i < siblings.length; i++) {
    childCtx.index = i;
    process(childCtx);
    parent._scChildren.push(siblings[i]);
  }
}
