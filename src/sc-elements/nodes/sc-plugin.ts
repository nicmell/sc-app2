// <sc-plugin> — the app-synthesized plugin root (never written in plugin
// HTML; PluginHost creates one per dashboard box). It loads the plugin's
// entry HTML into itself, parses + validates it into the runtime registry
// (the ScElement parse engine), and owns the plugin's scsynth group: created
// inside the session group on mount, freed — with every synth in it — on
// unmount.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { AddToTail, gFreeAll, gNewOne, nFree } from "@sc-app/server-commands";
import { loadPluginInto } from "@/lib/plugins/PluginManager";
import { oscClient } from "@/lib/osc/OscClient";
import { session } from "@/lib/session/SessionManager";
import { randomId } from "@/lib/utils/randomId";
import { registerAll, unregisterTree } from "@/runtime/registry";
import { runAttribute, ScElement } from "@/sc-elements/internal/sc-element";
import type { PluginInfo } from "@/types/api";
import type { NodeRuntime, RuntimeContext, ScElementRuntime, ScElementRuntimeBase, ScPluginProps, ScPluginRuntime } from "@/types/runtime";

export class ScPlugin extends ScElement<ScPluginRuntime> implements ScPluginProps {
  static properties = {
    _error: { state: true },
  };

  declare _error: string;

  @property(runAttribute) accessor run = true;

  /** The plugin to load — set imperatively by PluginHost before mounting. */
  plugin?: PluginInfo;

  /** The plugin's scsynth group (inside the session group), once created. */
  private groupNodeId: number | null = null;

  constructor() {
    super();
    this._error = "";
  }

  /** Unlike the other sc-elements, the plugin root renders into a shadow
   *  root: the plugin markup stays in the light DOM and shows through the
   *  slot, next to the parse error. */
  createRenderRoot(): HTMLElement | DocumentFragment {
    return this.attachShadow({ mode: "open" });
  }

  /** The root runtime: parse the children (the whole plugin tree), rolling
   *  the per-parse nodes map back on any validation/resolution error. */
  protected resolveRuntime(item: ScElementRuntimeBase, ctx: RuntimeContext): NodeRuntime {
    try {
      this.processChildren(item, ctx);
      return this.nodeRuntime(ctx, this.run);
    } catch (e) {
      Object.assign(item, { children: [] });
      for (const id of ctx.nodes.keys()) {
        if (id !== item.id) ctx.nodes.delete(id);
      }
      throw e;
    }
  }

  protected async firstUpdated(): Promise<void> {
    if (!this.plugin) {
      this._error = "sc-plugin: no plugin assigned";
      return;
    }
    try {
      await loadPluginInto(this, this.plugin);
      if (!this.isConnected) return; // unmounted while fetching
      // Hydrate + process the tree (the old loadPlugin flow): the per-parse
      // nodes map is adopted by the global registry only on success.
      const boxId = this.id || randomId();
      const nodes = new Map<string, ScElementRuntime>();
      const tree = this.hydrate(boxId);
      this.process(tree, { rootId: boxId, nodes, scope: [tree], path: [] });
      registerAll(nodes);
      // The group all of this plugin's synths will live in — freed wholesale
      // on unmount.
      this.groupNodeId = oscClient.nextNodeId();
      session.send(gNewOne(this.groupNodeId, AddToTail, oscClient.sessionGroupId));
    } catch (e) {
      this._error = e instanceof Error ? e.message : String(e);
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.groupNodeId !== null) {
      session.send(gFreeAll(this.groupNodeId));
      session.send(nFree(this.groupNodeId));
      this.groupNodeId = null;
    }
    if (this.id) unregisterTree(this.id);
  }

  render() {
    return html`
      ${this._error
        ? html`<div class="sc-plugin-error" style="color:var(--color-log-error,#e57373);font-size:0.85rem;padding:0.5rem 0">${this._error}</div>`
        : ""}
      <slot></slot>
    `;
  }
}
