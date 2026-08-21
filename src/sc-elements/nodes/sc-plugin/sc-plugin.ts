// <sc-plugin> — the runtime host for an authored <sc-plugin> entry. React's
// shared PluginHost resolves and fetches the plugin, then imports, upgrades,
// parses, and validates its tree while this element is disconnected. Once React
// connects that prepared host, the element owns the load lifecycle and its
// scsynth group: created inside the session group on mount, freed — with
// every synth in it — on unmount. Title and description live in metadata.json /
// PluginInfo.
//
// The plugin also lives with the OSC connection (`oscClient.connected`,
// the old ScopeController's pattern): a drop unloads every element — flags and
// node ids reset, teardown sends harmlessly dropped on the dead socket —
// while the per-plugin runtime map survives; reestablishment re-runs the
// load pass, so the recreated synths carry the user's current values.

import { html } from "lit";
import { state } from "lit/decorators.js";
import { oscClient } from "@/stores/osc";
import { createStore, type Store } from "@/lib/utils/reactiveStore";
import { process } from "@/sc-elements/internal/engine";
import type { ScElement } from "@/sc-elements/internal/sc-element";
import { ScNode } from "@/sc-elements/internal/sc-node";
import type { PluginRuntimeValues } from "@/types/runtime";
import "./sc-plugin.scss";

export class ScPlugin extends ScNode {
  @state() accessor _error = "";

  /** This instance's literal runtime state (path → value): seeded by the load
   *  pass, written by ScState.dispatchValue, read via _rootScNode by every
   *  descendant. Lives and dies with the element — a remount reseeds. */
  readonly runtime: Store<PluginRuntimeValues> = createStore({});

  /** Parse succeeded — there is a tree to (re)load. A parse failure is
   *  permanent for this mount; reload() never retries it. */
  parsed = false;

  /** Unsubscribe from the `connected` signal (set on connect, cleared on
   *  disconnect). */
  private offConnected?: () => void;

  /** The in-flight pass started by firstUpdated/reload. Test helpers and any
   *  same-turn connection signal join it instead of creating two groups. */
  private loading?: Promise<void>;

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
    // Lit ignores lifecycle return values; kick the initial load off explicitly.
    void this.reload();
  }

  /** Process this authored root: the root is the single sibling of a
   *  virtual top level, so it mints from an empty parent id at position 0,
   *  like any other element. Returns the per-parse `nodes` set. */
  processRoot(): Set<ScElement> {
    const nodes = new Set<ScElement>();
    process({ rootNode: this, nodes, siblings: [this], scope: [this], path: [], index: 0 });
    this.parsed = true; // only reached when the whole tree parsed clean
    return nodes;
  }

  /** Create the plugin's scsynth group — the group all of this plugin's
   *  synths live in, freed wholesale on unmount. The plugin's `nodeId` IS
   *  the group id, so children target `targetGroupId` uniformly. */
  async load(): Promise<void> {
    if (this.loading) return this.loading;
    const loading = this.loadTree();
    this.loading = loading;
    try {
      await loading;
    } finally {
      if (this.loading === loading) this.loading = undefined;
    }
  }

  /** Perform one load pass; load() coalesces callers around this operation. */
  private async loadTree(): Promise<void> {
    if (!this.isConnected || this.loaded) return; // unmounted mid-load / already live
    const live = this.loadGuard();
    const nodeId = await oscClient.createGroup(oscClient.sessionGroupId);
    if (!this.isConnected || !live()) {
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
    const nodeId = this.nodeId;
    super.unload();
    if (nodeId !== 0) {
      oscClient.freeGroup(nodeId);
    }
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
  }

  render() {
    return html`
      ${this._error ? html`<div class="sc-plugin-error">${this._error}</div>` : ""}
      <slot></slot>
    `;
  }
}
