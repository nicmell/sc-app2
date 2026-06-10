// The runtime processor (ported from the old sc-app's lib/runtime/handlers):
// `processElement` dispatches each hydrated item to its per-type handler,
// which resolves its binds against the cumulative scope and returns the
// runtime values, merged flat into the item itself (the item IS its runtime).
// The HTML attributes are read through `item._element` — the mounted
// component's reactive properties — never copied into the items.
// Still unported (return with their migration steps): the buffer family
// (sc-buffer/waveform/test + the old buffer-bound scope), presets/overrides,
// and synthdef compilation.

import { ELEMENTS } from "@/constants/sc-elements";
import { parseBind } from "@/lib/utils/expression";
import { isControlRuntime, isNodeRuntime, isParentRuntime, isStateRuntime, typeOf } from "@/lib/utils/guards";
import type {
  BaseRuntime,
  ControlRuntime,
  Expr,
  InputRuntime,
  NodeRuntime,
  RunRuntime,
  ScControlRuntime,
  ScElementRuntime,
  ScElementRuntimeBase,
  ScGroupRuntime,
  ScParentRuntime,
  ScPluginRuntime,
  ScRunRuntime,
  ScSynthDefRuntime,
  ScSynthRuntime,
  ScUgenRuntime,
  ScVarRuntime,
  SynthDefRuntime,
  UgenRuntime,
  VarRuntime,
} from "@/types/runtime";

export interface RuntimeContext {
  rootId: string;
  tree: ScElementRuntimeBase;
  nodes: Map<string, ScElementRuntime>;
  synthdefs: ScSynthDefRuntime[];
  scope: ScElementRuntimeBase[];
  visit: (node: ScElementRuntimeBase) => ScElementRuntime;
  parentNode?: ScParentRuntime;
  path: string[];
}

// --- Element-property accessors (the attributes live on the components) ---

function nameOf(el: ScElementRuntimeBase): string | undefined {
  return (el._element as { name?: string }).name;
}

function bindOf(el: ScElementRuntimeBase): string | undefined {
  return (el._element as { bind?: string }).bind;
}

// --- Helpers ---

export function checkDuplicateNames(scope: ScElementRuntimeBase[]): void {
  const seen = new Set<string>();
  for (const el of scope) {
    const name = nameOf(el);
    if (name) {
      if (seen.has(name)) {
        throw new Error(`<${typeOf(el)} name="${name}">: duplicate name in scope`);
      }
      seen.add(name);
    }
  }
}

function collectControlParams(node: ScParentRuntime): Record<string, number> {
  const controls: Record<string, number> = {};
  for (const child of node.children) {
    if (isControlRuntime(child) && child._element.value != null) {
      controls[child._element.name] = child._element.value;
    }
  }
  return controls;
}

function resolve(ctx: RuntimeContext, path: string[]): ScElementRuntime | undefined {
  const [name, ...rest] = path;
  const idx = ctx.scope.findIndex((s) => nameOf(s) === name);
  if (idx < 0) return undefined;

  const target = ctx.nodes.get(ctx.scope[idx].id) ?? processElement({ ...ctx, tree: ctx.scope[idx] });

  return walkPath(target, rest);
}

function walkPath(node: ScElementRuntime, path: string[]): ScElementRuntime | undefined {
  if (path.length === 0) return node;
  if (isParentRuntime(node)) {
    const [name, ...rest] = path;
    const child = node.children.find((c) => nameOf(c) === name);
    return child ? walkPath(child, rest) : undefined;
  }
  return undefined;
}

function resolveControlBind(ctx: RuntimeContext, bind: string): { target: ScElementRuntime; controlName: string } {
  const segments = bind.split(".");
  const controlName = segments.pop()!;
  const target = segments.length > 0 ? resolve(ctx, segments) : ctx.parentNode;
  if (!target || !isNodeRuntime(target)) {
    throw new Error(`<${typeOf(ctx.tree)} bind="${bind}">: does not match any node in scope`);
  }
  if (!isParentRuntime(target) || !target.children.some((c) => isStateRuntime(c) && c._element.name === controlName)) {
    const targetName = nameOf(target) ?? target.id;
    throw new Error(
      `<${typeOf(ctx.tree)} bind="${bind}">: control "${controlName}" is not declared on <${typeOf(target)} name="${targetName}">`,
    );
  }
  return { target, controlName };
}

function parentId(ctx: RuntimeContext): string {
  return ctx.parentNode?.id ?? "";
}

/** Resolve a stateful bind (an enabled sc-control / sc-var referencing other
 *  controls/vars): plain dot-paths or an arithmetic expression over them. */
function resolveStateBind(ctx: RuntimeContext): { targets: Record<string, string>; expression?: Expr } {
  const bind = bindOf(ctx.tree)!;
  const parsed = parseBind(bind);
  const targets: Record<string, string> = {};

  for (const path of parsed.paths) {
    const { target, controlName } = resolveControlBind(ctx, path);
    const targetState = (target as ScParentRuntime).children.find(
      (c) => isStateRuntime(c) && c._element.name === controlName,
    )!;
    checkCircularBind(ctx, targetState.id);
    targets[path] = targetState.id;
  }

  return { targets, expression: parsed.expression };
}

function checkCircularBind(ctx: RuntimeContext, targetId: string): void {
  const visited = new Set<string>([ctx.tree.id]);
  const queue = [targetId];
  while (queue.length > 0) {
    const current = queue.pop()!;
    if (visited.has(current)) {
      throw new Error(`<${typeOf(ctx.tree)} name="${nameOf(ctx.tree)}">: circular bind reference detected`);
    }
    visited.add(current);
    const node = ctx.nodes.get(current);
    if (!node || !isStateRuntime(node)) continue;
    // The runtime values are still unmerged on a state node that's
    // mid-processing (we got here through its own bind resolve) — its targets
    // aren't known yet, but the cycle is still caught from the other end once
    // they are.
    if (node.targets) queue.push(...Object.values(node.targets));
  }
}

function resolveVisualBind(ctx: RuntimeContext): InputRuntime {
  const { target, controlName } = resolveControlBind(ctx, bindOf(ctx.tree)!);
  const control = (target as ScParentRuntime).children.find(
    (c) => isStateRuntime(c) && c._element.name === controlName,
  )!;
  return { rootId: ctx.rootId, parentId: parentId(ctx), path: ctx.path, enabled: true, targetId: control.id };
}

// --- Handlers ---

const pluginHandler = (ctx: RuntimeContext): NodeRuntime => {
  const n = ctx.tree as ScPluginRuntime;
  try {
    ctx.visit(ctx.tree);
    return { rootId: ctx.rootId, parentId: "", path: ctx.path, enabled: true, run: n._element.run ? 1 : 0, loaded: false, nodeId: 0 };
  } catch (e) {
    Object.assign(n, { children: [] });
    for (const id of ctx.nodes.keys()) {
      if (id !== n.id) ctx.nodes.delete(id);
    }
    throw e;
  }
};

function nodeRuntime(ctx: RuntimeContext): NodeRuntime {
  const n = ctx.tree as ScGroupRuntime | ScSynthRuntime;
  return { rootId: ctx.rootId, parentId: parentId(ctx), path: ctx.path, enabled: true, run: n._element.run ? 1 : 0, loaded: false, nodeId: 0 };
}

const synthHandler = (ctx: RuntimeContext): NodeRuntime => {
  const n = ctx.tree as ScSynthRuntime;
  const bind = n._element.bind;
  if (bind && !resolve(ctx, [bind])) {
    throw new Error(`<sc-synth bind="${bind}">: does not match any <sc-synthdef>`);
  }
  ctx.visit(ctx.tree);
  return nodeRuntime(ctx);
};

const groupHandler = (ctx: RuntimeContext): NodeRuntime => {
  ctx.visit(ctx.tree);
  return nodeRuntime(ctx);
};

const varHandler = (ctx: RuntimeContext): VarRuntime => {
  const el = (ctx.tree as ScVarRuntime)._element;
  if (el.bind) {
    const { targets, expression } = resolveStateBind(ctx);
    return { rootId: ctx.rootId, parentId: parentId(ctx), path: ctx.path, enabled: true, name: el.name, value: 0, targets, expression };
  }
  return { rootId: ctx.rootId, parentId: parentId(ctx), path: ctx.path, enabled: true, name: el.name, value: el.value ?? 0 };
};

const runHandler = (ctx: RuntimeContext): RunRuntime => {
  const el = (ctx.tree as ScRunRuntime)._element;
  const target = el.bind ? resolve(ctx, el.bind.split(".")) : ctx.parentNode;
  if (el.bind && (!target || !isNodeRuntime(target))) {
    throw new Error(`<sc-run>: bind "${el.bind}" does not match any node in scope`);
  }
  return { rootId: ctx.rootId, parentId: parentId(ctx), path: ctx.path, enabled: true, targetId: target ? target.id : "" };
};

const ifHandler = (ctx: RuntimeContext): InputRuntime => {
  ctx.visit(ctx.tree);
  return resolveVisualBind(ctx);
};

const selectHandler = (ctx: RuntimeContext): InputRuntime => {
  ctx.visit(ctx.tree);
  return resolveVisualBind(ctx);
};

const radioGroupHandler = (ctx: RuntimeContext): InputRuntime => {
  ctx.visit(ctx.tree);
  return resolveVisualBind(ctx);
};

/** sc-option / sc-radio: declarative entries — never enabled. */
const choiceHandler = (ctx: RuntimeContext): UgenRuntime => {
  return { rootId: ctx.rootId, parentId: parentId(ctx), path: ctx.path, enabled: false };
};

function collectUgenInputs(node: ScUgenRuntime): Record<string, string> {
  const inputs: Record<string, string> = {};
  for (const child of node.children) {
    if (isControlRuntime(child)) {
      const { name, bind, value } = child._element;
      if (!bind && value == null) {
        throw new Error(`<sc-control name="${name}">: requires either a bind or value attribute`);
      }
      inputs[name] = bind ?? String(value);
    }
  }
  return inputs;
}

const synthDefHandler = (ctx: RuntimeContext): SynthDefRuntime => {
  ctx.visit(ctx.tree);
  const n = ctx.tree as unknown as ScSynthDefRuntime;
  ctx.synthdefs.push(n);
  // Collect params + per-ugen input specs as the old app did — compilation
  // (synthDefManager) returns with the lib/synthdef migration step; collecting
  // still validates that every ugen input has a bind or value.
  collectControlParams(n);
  const ugenChildren = n.children.filter((c): c is ScUgenRuntime => typeOf(c) === ELEMENTS.SC_UGEN);
  for (const c of ugenChildren) {
    collectUgenInputs(c);
  }
  return { rootId: ctx.rootId, parentId: parentId(ctx), path: ctx.path, enabled: true, loaded: false };
};

const ugenHandler = (ctx: RuntimeContext): UgenRuntime => {
  ctx.visit(ctx.tree);
  const n = ctx.tree as unknown as ScUgenRuntime;
  for (const child of n.children) {
    if (!isControlRuntime(child) || !child._element.bind) continue;
    for (const ref of child._element.bind.split(",").map((s) => s.trim())) {
      const refId = ref.split(":")[0];
      if (!resolve(ctx, [refId])) {
        throw new Error(
          `<sc-ugen name="${n._element.name}">: input "${child._element.name}" references unknown "${refId}"`,
        );
      }
    }
  }
  return { rootId: ctx.rootId, parentId: parentId(ctx), path: ctx.path, enabled: false };
};

const controlHandler = (ctx: RuntimeContext): ControlRuntime => {
  const el = (ctx.tree as ScControlRuntime)._element;
  const enabled = ctx.parentNode != null && isNodeRuntime(ctx.parentNode);
  if (enabled && el.bind) {
    const { targets, expression } = resolveStateBind(ctx);
    return { rootId: ctx.rootId, parentId: parentId(ctx), path: ctx.path, enabled, name: el.name, value: 0, targets, expression };
  }
  return { rootId: ctx.rootId, parentId: parentId(ctx), path: ctx.path, enabled, name: el.name, value: el.value ?? 0 };
};

const inputHandler = (ctx: RuntimeContext): InputRuntime => {
  return resolveVisualBind(ctx);
};

/** sc-console / sc-scope / sc-strudel: self-contained leaves. */
const leafHandler = (ctx: RuntimeContext): BaseRuntime => {
  return { rootId: ctx.rootId, parentId: parentId(ctx), path: ctx.path, enabled: true };
};

// --- Dispatch ---

export function processElement(ctx: RuntimeContext): ScElementRuntime {
  const existing = ctx.nodes.get(ctx.tree.id);
  if (existing) {
    return existing;
  }
  // Pre-register to prevent re-entrant processing (ancestor resolve during visit)
  const node = ctx.tree as unknown as ScElementRuntime;
  ctx.nodes.set(node.id, node);
  if (ctx.parentNode) {
    ctx.parentNode.children.push(node);
  }
  let runtime: unknown;
  switch (typeOf(ctx.tree)) {
    case ELEMENTS.SC_PLUGIN: runtime = pluginHandler(ctx); break;
    case ELEMENTS.SC_GROUP: runtime = groupHandler(ctx); break;
    case ELEMENTS.SC_SYNTH: runtime = synthHandler(ctx); break;
    case ELEMENTS.SC_SYNTHDEF: runtime = synthDefHandler(ctx); break;
    case ELEMENTS.SC_UGEN: runtime = ugenHandler(ctx); break;
    case ELEMENTS.SC_CONTROL: runtime = controlHandler(ctx); break;
    case ELEMENTS.SC_VAR: runtime = varHandler(ctx); break;
    case ELEMENTS.SC_RANGE: runtime = inputHandler(ctx); break;
    case ELEMENTS.SC_CHECKBOX: runtime = inputHandler(ctx); break;
    case ELEMENTS.SC_RUN: runtime = runHandler(ctx); break;
    case ELEMENTS.SC_DISPLAY: runtime = resolveVisualBind(ctx); break;
    case ELEMENTS.SC_IF: runtime = ifHandler(ctx); break;
    case ELEMENTS.SC_SELECT: runtime = selectHandler(ctx); break;
    case ELEMENTS.SC_OPTION: runtime = choiceHandler(ctx); break;
    case ELEMENTS.SC_RADIO_GROUP: runtime = radioGroupHandler(ctx); break;
    case ELEMENTS.SC_RADIO: runtime = choiceHandler(ctx); break;
    case ELEMENTS.SC_CONSOLE: runtime = leafHandler(ctx); break;
    case ELEMENTS.SC_SCOPE: runtime = leafHandler(ctx); break;
    case ELEMENTS.SC_STRUDEL: runtime = leafHandler(ctx); break;
    default: {
      throw new Error(`Unknown element type: ${typeOf(ctx.tree)}`);
    }
  }
  Object.assign(ctx.tree, runtime);
  return node;
}
