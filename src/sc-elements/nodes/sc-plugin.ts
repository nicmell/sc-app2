// <sc-plugin> — the app-synthesized plugin root (never written in plugin
// HTML; PluginHost renders one per dashboard box, with the box's id as its
// DOM id). It looks its plugin up in the layout/plugins stores by that id,
// loads the entry HTML into itself, parses + validates it into the runtime
// registry (the ScElement parse engine), and owns the plugin's scsynth
// group: created inside the session group on mount, freed — with every synth
// in it — on unmount.

import { html } from "lit";
import { state } from "lit/decorators.js";
import { ADDR_N_GO, AddToTail, gFreeAll, gNewOne, NodeEvent, nFree } from "@sc-app/server-commands";
import { loadPluginInto } from "@/lib/plugins/PluginManager";
import { oscClient } from "@/stores/osc";
import { dropPluginControls } from "@/stores/controls";
import { registerAll, unregisterTree } from "@/runtime/registry";
import type { ScElement } from "@/sc-elements/internal/sc-element";
import { ScNode } from "@/sc-elements/internal/sc-node";
import { layout } from "@/stores/layout";
import { plugins } from "@/stores/plugins";
import type {  } from "@/types/runtime";

export class ScPlugin extends ScNode {
  @state() accessor _error = "";

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
      // The async load pass: the plugin group first, then every child fully,
      // sequentially, in DOM order (/d_recv before /s_new etc.). A failure
      // lands in the same error box as a parse failure.
      await this.load();
    } catch (e) {
      this._error = e instanceof Error ? e.message : String(e);
    }
  }

  /** Create the plugin's scsynth group — the group all of this plugin's
   *  synths live in, freed wholesale on unmount. The plugin's `nodeId` IS
   *  the group id, so children target `targetGroupId` uniformly. */
  async load(): Promise<void> {
    if (!this.isConnected) return; // unmounted mid-load
    const groupId = oscClient.nextNodeId();
    const reply = oscClient.once(ADDR_N_GO, (m) => NodeEvent.nodeId(m) === groupId);
    oscClient.send(gNewOne(groupId, AddToTail, oscClient.sessionGroupId));
    await reply;
    this.nodeId = groupId;
    this.loaded = true;
    await super.load();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unload(); // children first, reverse DOM order
    if (this.nodeId !== 0) {
      oscClient.send(gFreeAll(this.nodeId));
      oscClient.send(nFree(this.nodeId));
      this.nodeId = 0;
      this.loaded = false;
    }
    if (this.id) {
      dropPluginControls(this.id);
      unregisterTree(this.id);
    }
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
