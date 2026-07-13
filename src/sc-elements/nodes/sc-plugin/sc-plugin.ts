// <sc-plugin> — the runtime host for an authored <sc-plugin> entry. PluginHost
// renders one per dashboard box, and PluginPage renders a standalone one; the
// loader imports the entry's children into that host without replacing its runtime
// id. Title and description live in metadata.json / PluginInfo. It resolves its
// plugin — the `plugin` property, else the
// layout/plugins stores keyed by its DOM id — then parses + validates it into the runtime
// registry (the ScElement parse engine), and owns the plugin's scsynth
// group: created inside the session group on mount, freed — with every synth
// in it — on unmount.
//
// The plugin also lives with the OSC connection (`oscClient.connected`,
// the old ScopeController's pattern): a drop unloads every element — flags and
// node ids reset, teardown sends harmlessly dropped on the dead socket —
// while the per-plugin runtime map survives; reestablishment re-runs the
// load pass, so the recreated synths carry the user's current values.

import { html } from "lit";
import { state } from "lit/decorators.js";
import { loadPluginInto } from "@/lib/plugins/PluginManager";
import { oscClient } from "@/stores/osc";
import { dropPluginRuntime } from "@/stores/runtime";
import { registerAll, unregisterTree } from "@/runtime/registry";
import type { ScElement } from "@/sc-elements/internal/sc-element";
import { ScNode } from "@/sc-elements/internal/sc-node";
import { layout } from "@/stores/layout";
import { plugins } from "@/stores/plugins";
import type { RuntimeContext } from "@/types/runtime";
import "./sc-plugin.scss";

export class ScPlugin extends ScNode {
  @state() accessor _error = "";

  /** Explicit plugin id for instances outside a dashboard box (a plain JS
   *  property, deliberately not an attribute — validateProps rejects unknown
   *  attributes; React 19 assigns it as a property since the field exists). */
  plugin?: string;

  /** Parse succeeded — there is a tree to (re)load. A parse failure is
   *  permanent for this mount; reload() never retries it. */
  parsed = false;

  /** Unsubscribe from the `connected` signal (set on connect, cleared on
   *  disconnect). */
  private offConnected?: () => void;

  /** Unlike the other sc-elements, the plugin root renders into a shadow
   *  root: the plugin markup stays in the light DOM and shows through the
   *  slot, next to the parse error. */
  createRenderRoot(): HTMLElement | DocumentFragment {
    return this.createShadowRenderRoot();
  }

  connectedCallback(): void {
    super.connectedCallback();
    // Live with the connection (a change-only signal — the initial load runs
    // in firstUpdated): a drop unloads, reestablishment reloads.
    this.offConnected ??= oscClient.connected.subscribe((up) =>
      up ? void this.reload() : this.unload(),
    );
  }

  protected firstUpdated(): void {
    // Lit ignores the lifecycle return; kick the async boot off explicitly.
    void this.boot();
  }

  private async boot(): Promise<void> {
    // The explicit `plugin` property wins (standalone PluginPage instance);
    // otherwise the DOM id IS the dashboard box id (assigned by PluginHost's
    // JSX) and the box's assigned plugin resolves from the stores.
    const assigned = this.plugin ?? layout.get().find((box) => box.i === this.id)?.plugin;
    const info = plugins.get().find((candidate) => candidate.id === assigned);
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

  process(ctx: RuntimeContext): ScElement {
    const el = super.process(ctx);
    this.parsed = true; // only reached when the whole tree parsed clean
    return el;
  }

  /** Create the plugin's scsynth group — the group all of this plugin's
   *  synths live in, freed wholesale on unmount. The plugin's `nodeId` IS
   *  the group id, so children target `targetGroupId` uniformly. */
  async load(): Promise<void> {
    if (!this.isConnected || this.loaded) return; // unmounted mid-load / already live
    const epoch = this.loadEpoch;
    const nodeId = await oscClient.createGroup(oscClient.sessionGroupId);
    if (!this.isConnected || this.loadEpoch !== epoch) {
      // unload() could not free a group whose id had not arrived yet.
      oscClient.freeGroup(nodeId);
      return;
    }
    this.nodeId = nodeId;
    this.loaded = true;
    await super.load();
  }

  /** The inverse of the load pass: children first (reverse DOM order), then
   *  this plugin's group. Bumping the epoch aborts any suspended pass. The
   *  teardown sends go out normally on a live socket (DOM unmount) and are
   *  silently dropped on a dead one (connection loss — the bridge has
   *  already freed the whole session group server-side). */
  unload(): void {
    this.loadEpoch++;
    super.unload();
    if (this.nodeId !== 0) {
      oscClient.freeGroup(this.nodeId);
    }
    this.nodeId = 0;
    this.loaded = false;
  }

  /** Re-run the load pass once the connection is reestablished. Nothing to
   *  do without a parsed tree (parse failures are permanent) or when already
   *  live (the signal can't race a completed load — `connected` only flips
   *  after a full disconnect, which unloaded). */
  private async reload(): Promise<void> {
    if (!this.parsed || this.loaded) return;
    this.loadEpoch++;
    this._error = "";
    try {
      await this.load();
    } catch (e) {
      this._error = e instanceof Error ? e.message : String(e);
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.offConnected?.();
    this.offConnected = undefined;
    this.unload();
    if (this.id) {
      dropPluginRuntime(this.id);
      unregisterTree(this.id);
    }
  }

  render() {
    return html`
      ${this._error
        ? html`<div
            class="sc-plugin-error"
            style="color:var(--color-log-error);font-size:var(--font-size-sm);padding:var(--space-xs) 0"
          >
            ${this._error}
          </div>`
        : ""}
      <slot></slot>
    `;
  }
}
