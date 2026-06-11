// <sc-plugin> — the app-synthesized plugin root (never written in plugin
// HTML; PluginHost renders one per dashboard box, with the box's id as its
// DOM id). It looks its plugin up in the layout/plugins stores by that id,
// loads the entry HTML into itself, parses + validates it into the runtime
// registry (the ScElement parse engine), and owns the plugin's scsynth
// group: created inside the session group on mount, freed — with every synth
// in it — on unmount.

import { html } from "lit";
import { state } from "lit/decorators.js";
import { AddToTail, gFreeAll, gNewOne, nFree } from "@sc-app/server-commands";
import { loadPluginInto } from "@/lib/plugins/PluginManager";
import { oscClient } from "@/stores/osc";
import { registerAll, unregisterTree } from "@/runtime/registry";
import type { ScElement } from "@/sc-elements/internal/sc-element";
import { ScNode } from "@/sc-elements/internal/sc-node";
import { layout } from "@/stores/layout";
import { plugins } from "@/stores/plugins";
import type {  } from "@/types/runtime";

export class ScPlugin extends ScNode {
  @state() accessor _error = "";

  /** The plugin's scsynth group (inside the session group), once created. */
  private groupNodeId: number | null = null;

  /** Unlike the other sc-elements, the plugin root renders into a shadow
   *  root: the plugin markup stays in the light DOM and shows through the
   *  slot, next to the parse error. */
  createRenderRoot(): HTMLElement | DocumentFragment {
    return this.attachShadow({ mode: "open" });
  }

  protected async firstUpdated(): Promise<void> {
    // The DOM id IS the dashboard box id (assigned by PluginHost's JSX) —
    // resolve the box's assigned plugin from the stores.
    const box = layout.get().find((b) => b.i === this.id);
    const info = plugins.get().find((p) => p.id === box?.plugin);
    if (!info) {
      this._error = "sc-plugin: no plugin assigned";
      return;
    }
    try {
      await loadPluginInto(this, info);
      if (!this.isConnected) return; // unmounted while fetching
      // Process the tree (validation runs inside; the children derive from
      // the DOM): the registry adopts it (root + scChildren) only on success.
      this.process({ rootNode: this, nodes: new Set<ScElement>(), scope: [this], path: [] });
      registerAll(this);
      // The group all of this plugin's synths will live in — freed wholesale
      // on unmount.
      this.groupNodeId = oscClient.nextNodeId();
      oscClient.send(gNewOne(this.groupNodeId, AddToTail, oscClient.sessionGroupId));
    } catch (e) {
      this._error = e instanceof Error ? e.message : String(e);
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.groupNodeId !== null) {
      oscClient.send(gFreeAll(this.groupNodeId));
      oscClient.send(nFree(this.groupNodeId));
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
