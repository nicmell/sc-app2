// The runtime processor (ported from the old sc-app's lib/runtime/handlers,
// trimmed to the migrated elements): `processElement` dispatches each hydrated
// item to its per-type handler, which validates it, resolves its binds against
// the cumulative scope, and attaches the `runtime` object. Handlers for the
// not-yet-migrated elements (sc-group, sc-var, sc-run, sc-if, selects/radios,
// buffers/waveform/test, presets/overrides, bind expressions, synthdef
// compilation) return with their migration steps.

import { ELEMENTS } from "@/constants/sc-elements";
import { isControl, isNode, isParent, isState } from "@/lib/utils/guards";
import type {
  BaseRuntime,
  ControlRuntime,
  InputRuntime,
  NodeRuntime,
  ScControlItem,
  ScElementItem,
  ScElementItemBase,
  ScParentItem,
  ScPluginItem,
  ScSynthDefItem,
  ScSynthItem,
  ScUgenItem,
  StripRuntime,
  SynthDefRuntime,
  UgenRuntime,
} from "@/types/parsers";

export interface RuntimeContext {
  rootId: string;
  tree: ScElementItemBase;
  nodes: Map<string, ScElementItem>;
  synthdefs: ScSynthDefItem[];
  scope: ScElementItemBase[];
  visit: (node: ScElementItemBase) => ScElementItem;
  parentNode?: ScParentItem;
  path: string[];
}

// --- Helpers ---

export function checkDuplicateNames(scope: ScElementItemBase[]): void {
  const seen = new Set<string>();
  for (const el of scope) {
    if ("name" in el && el.name) {
      if (seen.has(el.name as string)) {
        throw new Error(`<${el.type} name="${el.name}">: duplicate name in scope`);
      }
      seen.add(el.name as string);
    }
  }
}

function collectControlParams(node: { children: ScElementItemBase[] }): Record<string, number> {
  const controls: Record<string, number> = {};
  for (const child of node.children) {
    if (isControl(child) && child.value != null) {
      controls[child.name] = child.value;
    }
  }
  return controls;
}

function resolve(ctx: RuntimeContext, path: string[]): ScElementItem | undefined {
  const [name, ...rest] = path;
  const idx = ctx.scope.findIndex((s) => "name" in s && (s as { name?: string }).name === name);
  if (idx < 0) return undefined;

  const target = ctx.nodes.get(ctx.scope[idx].id) ?? processElement({ ...ctx, tree: ctx.scope[idx] });

  return walkPath(target, rest);
}

function walkPath(node: ScElementItem, path: string[]): ScElementItem | undefined {
  if (path.length === 0) return node;
  if (isParent(node)) {
    const [name, ...rest] = path;
    const child = node.children.find((c) => "name" in c && (c as { name?: string }).name === name);
    return child ? walkPath(child, rest) : undefined;
  }
  return undefined;
}

function resolveControlBind(ctx: RuntimeContext): { target: ScElementItem; controlName: string } {
  const n = ctx.tree as ScElementItemBase & { bind: string };
  const segments = n.bind.split(".");
  const controlName = segments.pop()!;
  const target = segments.length > 0 ? resolve(ctx, segments) : ctx.parentNode;
  if (!target || !isNode(target)) {
    throw new Error(`<${n.type} bind="${n.bind}">: does not match any node in scope`);
  }
  if (!isParent(target) || !target.children.some((c) => isState(c) && c.name === controlName)) {
    const targetName = "name" in target ? (target as { name: string }).name : target.id;
    throw new Error(
      `<${n.type} bind="${n.bind}">: control "${controlName}" is not declared on <${target.type} name="${targetName}">`,
    );
  }
  return { target, controlName };
}

function parentId(ctx: RuntimeContext): string {
  return ctx.parentNode?.id ?? "";
}

/** Resolve a stateful bind (an enabled sc-control referencing another
 *  control). Plain dot-paths only — the arithmetic bind-expression parser
 *  returns with the sc-var migration step. */
function resolveStateBind(ctx: RuntimeContext): { targets: Record<string, string> } {
  const n = ctx.tree as ScElementItemBase & { bind: string };
  const { target, controlName } = resolveControlBind(ctx);
  const targetState = (target as ScParentItem).children.find((c) => isState(c) && c.name === controlName)!;
  checkCircularBind(ctx, targetState.id);
  return { targets: { [n.bind]: targetState.id } };
}

function checkCircularBind(ctx: RuntimeContext, targetId: string): void {
  const visited = new Set<string>([ctx.tree.id]);
  const queue = [targetId];
  while (queue.length > 0) {
    const current = queue.pop()!;
    if (visited.has(current)) {
      throw new Error(
        `<${ctx.tree.type} name="${(ctx.tree as { name?: string }).name}">: circular bind reference detected`,
      );
    }
    visited.add(current);
    const node = ctx.nodes.get(current);
    if (!node || !isState(node)) continue;
    // `runtime` is still unset on a state node that's mid-processing (we got
    // here through its own bind resolve) — its targets aren't known yet, but
    // the cycle is still caught from the other end once they are.
    const targets = (node.runtime as { targets?: Record<string, string> } | undefined)?.targets;
    if (targets) queue.push(...Object.values(targets));
  }
}

function resolveVisualBind(ctx: RuntimeContext): InputRuntime {
  const { target, controlName } = resolveControlBind(ctx);
  const control = (target as ScParentItem).children.find((c) => isState(c) && c.name === controlName)!;
  return { rootId: ctx.rootId, parentId: parentId(ctx), path: ctx.path, enabled: true, targetId: control.id };
}

// --- Handlers ---

const pluginHandler = (ctx: RuntimeContext): NodeRuntime => {
  const n = ctx.tree as StripRuntime<ScPluginItem>;
  try {
    ctx.visit(ctx.tree);
    return { rootId: ctx.rootId, parentId: "", path: ctx.path, enabled: true, run: n.run ? 1 : 0, loaded: false, nodeId: 0 };
  } catch (e) {
    Object.assign(n, { children: [] });
    for (const id of ctx.nodes.keys()) {
      if (id !== n.id) ctx.nodes.delete(id);
    }
    throw e;
  }
};

function nodeRuntime(ctx: RuntimeContext): NodeRuntime {
  const n = ctx.tree as StripRuntime<ScSynthItem>;
  return { rootId: ctx.rootId, parentId: parentId(ctx), path: ctx.path, enabled: true, run: n.run ? 1 : 0, loaded: false, nodeId: 0 };
}

const synthHandler = (ctx: RuntimeContext): NodeRuntime => {
  const n = ctx.tree as StripRuntime<ScSynthItem>;
  if (n.bind && !resolve(ctx, [n.bind])) {
    throw new Error(`<sc-synth bind="${n.bind}">: does not match any <sc-synthdef>`);
  }
  ctx.visit(ctx.tree);
  return nodeRuntime(ctx);
};

function collectUgenInputs(node: { children: ScElementItemBase[] }): Record<string, string> {
  const inputs: Record<string, string> = {};
  for (const child of node.children) {
    if (isControl(child)) {
      if (!child.bind && child.value == null) {
        throw new Error(`<sc-control name="${child.name}">: requires either a bind or value attribute`);
      }
      inputs[child.name] = child.bind ?? String(child.value);
    }
  }
  return inputs;
}

const synthDefHandler = (ctx: RuntimeContext): SynthDefRuntime => {
  ctx.visit(ctx.tree);
  const n = ctx.tree as StripRuntime<ScSynthDefItem>;
  ctx.synthdefs.push(n as unknown as ScSynthDefItem);
  // Collect params + per-ugen input specs as the old app did — compilation
  // (synthDefManager) returns with the lib/synthdef migration step; collecting
  // still validates that every ugen input has a bind or value.
  collectControlParams(n as { children: ScElementItemBase[] });
  const ugenChildren = (n.children ?? []).filter((c): c is ScUgenItem => c.type === "sc-ugen");
  for (const c of ugenChildren) {
    collectUgenInputs(c);
  }
  return { rootId: ctx.rootId, parentId: parentId(ctx), path: ctx.path, enabled: true, loaded: false };
};

const ugenHandler = (ctx: RuntimeContext): UgenRuntime => {
  ctx.visit(ctx.tree);
  const n = ctx.tree as StripRuntime<ScUgenItem>;
  for (const child of n.children ?? []) {
    if (!isControl(child) || !child.bind) continue;
    for (const ref of child.bind.split(",").map((s) => s.trim())) {
      const refId = ref.split(":")[0];
      if (!resolve(ctx, [refId])) {
        throw new Error(`<sc-ugen name="${n.name}">: input "${child.name}" references unknown "${refId}"`);
      }
    }
  }
  return { rootId: ctx.rootId, parentId: parentId(ctx), path: ctx.path, enabled: false };
};

const controlHandler = (ctx: RuntimeContext): ControlRuntime => {
  const n = ctx.tree as StripRuntime<ScControlItem>;
  const enabled = ctx.parentNode != null && isNode(ctx.parentNode);
  if (enabled && n.bind) {
    const { targets } = resolveStateBind(ctx);
    return { rootId: ctx.rootId, parentId: parentId(ctx), path: ctx.path, enabled, name: n.name, value: 0, targets };
  }
  return { rootId: ctx.rootId, parentId: parentId(ctx), path: ctx.path, enabled, name: n.name, value: n.value ?? 0 };
};

const inputHandler = (ctx: RuntimeContext): InputRuntime => {
  return resolveVisualBind(ctx);
};

/** sc-console / sc-scope / sc-strudel: self-contained leaves. */
const leafHandler = (ctx: RuntimeContext): BaseRuntime => {
  return { rootId: ctx.rootId, parentId: parentId(ctx), path: ctx.path, enabled: true };
};

// --- Dispatch ---

export function processElement(ctx: RuntimeContext): ScElementItem {
  const existing = ctx.nodes.get(ctx.tree.id);
  if (existing) {
    return existing;
  }
  // Pre-register to prevent re-entrant processing (ancestor resolve during visit)
  const node = ctx.tree as unknown as ScElementItem;
  ctx.nodes.set(node.id, node);
  if (ctx.parentNode) {
    ctx.parentNode.children.push(node);
  }
  let runtime: unknown;
  switch (ctx.tree.type) {
    case ELEMENTS.SC_PLUGIN: runtime = pluginHandler(ctx); break;
    case ELEMENTS.SC_SYNTH: runtime = synthHandler(ctx); break;
    case ELEMENTS.SC_SYNTHDEF: runtime = synthDefHandler(ctx); break;
    case ELEMENTS.SC_UGEN: runtime = ugenHandler(ctx); break;
    case ELEMENTS.SC_CONTROL: runtime = controlHandler(ctx); break;
    case ELEMENTS.SC_RANGE: runtime = inputHandler(ctx); break;
    case ELEMENTS.SC_CONSOLE: runtime = leafHandler(ctx); break;
    case ELEMENTS.SC_SCOPE: runtime = leafHandler(ctx); break;
    case ELEMENTS.SC_STRUDEL: runtime = leafHandler(ctx); break;
    default: {
      throw new Error(`Unknown element type: ${(ctx.tree as ScElementItemBase).type}`);
    }
  }
  Object.assign(ctx.tree, { runtime });
  return node;
}
