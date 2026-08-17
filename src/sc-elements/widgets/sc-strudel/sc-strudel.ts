// <sc-strudel> — the Strudel REPL. Ports the old StrudelConsole: mounts a
// StrudelMirror editor whose Hap onsets are emitted as `/dirt/play` bundles via
// the session, with a status pill + Play/Stop controls. Light DOM so the
// ui-components .strudel styles + <sc-base-chip>/<sc-base-button> + CodeMirror apply directly.
//
// Parametrized: `value` is the initial pattern code and supports the shared
// ScInput `bind:value` seam (plain path = two-way; expression = read-only);
// `orbit` stamps a default orbit onto every dirt event the pattern doesn't
// route itself. The editor works offline, but unload() stops playback — a
// disconnect would otherwise keep emitting /dirt/play into a dead socket.

import { html } from "lit";
import { ScInput } from "@/sc-elements/internal/sc-input";
import type { StateValue } from "@/types/runtime";
// Type only — the heavy editor stack (@strudel/codemirror + @strudel/transpiler)
// is dynamically imported in mountEditor() so it stays out of the boot bundle.
import type { StrudelMirror } from "@strudel/codemirror";
import { ensureStrudelGlobals } from "@/lib/strudel/prebake";
import { atDate, type OscPacket } from "@sc-app/server-commands";
import type { ConnStatus } from "@/types/stores";
import { oscClient } from "@/stores/osc";
import { session } from "@/stores/session";
import styles from "./sc-strudel.module.scss";

const SAFETY_LOOKAHEAD_MS = 200;

/** A SuperDirt event: a flat bag of params (`s`, `n`, `gain`, `note`, …). */
type DirtEvent = Record<string, string | number>;

/** Build a `/dirt/play` bundle: flat `[key, value, …]` args, scheduled at
 *  `timetagMs` (a wall-clock ms timestamp converted to NTP by the worker codec). */
function dirtPlayBundle(event: DirtEvent, timetagMs: number): OscPacket {
  const args: Array<string | number> = [];
  for (const [k, v] of Object.entries(event)) args.push(k, v);
  return {
    timetag: atDate(timetagMs),
    packets: [{ address: "/dirt/play", args }],
  };
}

const DEFAULT_CODE = `// Strudel — patterns route through StrudelDirt via the OSC bridge.
// Edit, then press Play (or Ctrl+Enter). Stop with the button (or Ctrl+.).
s("bd hh*2 sd hh")`;

/** Decode the attribute-safe two-character `\\n` escape into a real newline.
 *  Editor writes already contain real newlines, so decoding them is a no-op.
 *  Consequently, a literal backslash-n in pattern source cannot be represented
 *  through the XML attribute; that asymmetry is intentional. */
function decodeCode(value: string): string {
  return value.replaceAll("\\n", "\n");
}

const STATUS_VARIANT: Record<ConnStatus, "ok" | "warn" | "error"> = {
  connecting: "warn",
  connected: "ok",
  error: "error",
};

export class ScStrudel extends ScInput {
  private mirror: StrudelMirror | null = null;
  /** Resolves once mountEditor() has loaded the dynamic chunk and built the
   *  editor (or bailed) — `updateComplete` awaits it so callers/tests can too. */
  private editorReady: Promise<void> = Promise.resolve();
  private off: (() => void) | null = null;
  private status: ConnStatus = "connecting";
  private playing = false;
  private detail = "";
  /** The bubbling CodeMirror input listener is installed on its mount root,
   *  then explicitly removed on disconnect before the mirror is discarded. */
  private editorRoot: HTMLDivElement | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.status = session.status.get();
    this.off = session.status.subscribe((s) => {
      this.status = s;
      this.requestUpdate();
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.editorRoot?.removeEventListener("input", this.onEditorInput);
    this.editorRoot = null;
    this.off?.();
    this.off = null;
    if (this.mirror) {
      void this.mirror.stop();
      this.mirror.clear();
      this.mirror = null;
    }
  }

  /** Map static/bound state into the editor. The document comparison is the
   *  two-way loop guard: state echoes of an editor commit do not call setCode. */
  protected syncFromState(value: StateValue | undefined): void {
    if (value === undefined) return;
    const code = decodeCode(String(value));
    if (this.mirror && this.mirror.editor.state.doc.toString() !== code) {
      this.mirror.setCode(code);
    }
  }

  /** CodeMirror's contenteditable emits one bubbling input event per edit.
   *  Plain-path binds commit each document value; expression binds have no
   *  writable target and follow ScInput's read-only snap-back rule. A static
   *  value is only the initial code, so later local edits need no dispatch. */
  private onEditorInput = (): void => {
    if (!this.mirror) return;
    const code = this.mirror.editor.state.doc.toString();
    if (!this.runtimeProps?.value) return;
    const state = this.runtimeValue("value") ?? (this.getProp("value") as StateValue | undefined);
    if (state !== undefined && decodeCode(String(state)) === code) return;
    this.commit(code);
  };

  /** Stop playback on the connection-loss unload — the editor stays mounted
   *  (it works offline); only the event stream dies with the socket. */
  unload(): void {
    super.unload();
    if (this.playing) void this.mirror?.stop();
  }

  protected firstUpdated(): void {
    // Mount the editor once the host div exists — the editor itself doesn't
    // need the connection (Play stays disabled until the session is up AND the
    // lazily-loaded editor chunk has mounted the mirror).
    if (this.mirror) return;
    const root = this.querySelector<HTMLDivElement>(`.${styles.editor}`);
    if (!root) return;
    this.editorReady = this.mountEditor(root);
  }

  /** Lit resolves `updateComplete` after firstUpdated() runs, but it does NOT
   *  await the promise firstUpdated returns — so fold the async editor mount in
   *  here, so `await el.updateComplete` waits for the dynamic chunk + editor. */
  async getUpdateComplete(): Promise<boolean> {
    const done = await super.getUpdateComplete();
    await this.editorReady;
    return done;
  }

  /** Load the editor stack lazily, then build the StrudelMirror. Never rejects:
   *  a chunk-load failure (network blip, stale hash after a redeploy) surfaces
   *  as the widget's `detail` message instead of an unhandled rejection — and
   *  `editorReady` must resolve either way, or every later
   *  `await el.updateComplete` would rethrow the cached rejection. */
  private async mountEditor(root: HTMLDivElement): Promise<void> {
    try {
      await this.buildEditor(root);
    } catch (err) {
      this.detail = `Failed to load the Strudel editor: ${
        err instanceof Error ? err.message : String(err)
      }`;
    }
    // Success enables Play (it's gated on `mirror`); failure shows `detail`.
    this.requestUpdate();
  }

  private async buildEditor(root: HTMLDivElement): Promise<void> {
    const [{ StrudelMirror }, { transpiler }] = await Promise.all([
      import("@strudel/codemirror"),
      import("@strudel/transpiler"),
    ]);
    // The chunk load is async — bail if we were disconnected meanwhile, or if a
    // prior mount already ran.
    if (!this.isConnected || this.mirror) return;

    const defaultOutput = (
      hap: { value: unknown },
      _deadline: number,
      _duration: number,
      _cps: number,
      targetTimeSecs: number,
    ) => {
      const value = hap.value;
      if (!value || typeof value !== "object") return;
      const event: DirtEvent = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (typeof v === "string" || typeof v === "number") event[k] = v;
      }
      if (!event.s) return;
      // The element's default orbit — only when the pattern didn't route
      // the event itself (`.orbit(n)` wins).
      const orbit = this.getProp("orbit") as number | undefined;
      if (orbit !== undefined && event.orbit === undefined) event.orbit = orbit;
      // scsynth and the bridge share a host clock. Cyclist stays entirely in
      // the monotonic performance.now() domain; convert only while stamping.
      const timetag = Math.round(
        oscClient.clockNow() + targetTimeSecs * 1000 - performance.now() + SAFETY_LOOKAHEAD_MS,
      );
      oscClient.send(dirtPlayBundle(event, timetag));
    };

    const clockIntervals = new Map<number, () => void>();
    const setInterval = (cb: () => void, ms: number): number => {
      const sub = oscClient.subscribeClock(ms, cb);
      clockIntervals.set(sub.id, sub.off);
      return sub.id;
    };
    const clearInterval = (id: number): void => {
      clockIntervals.get(id)?.();
      clockIntervals.delete(id);
    };

    // A bind is seeded through syncFromState, not as constructor input: this
    // keeps the shared load-pass path observable and correct in both lifecycle
    // orders (editor-before-load in the app, load-before-editor in tests).
    const initialCode = this.runtimeProps?.value
      ? DEFAULT_CODE
      : decodeCode(String(this.getProp("value") ?? DEFAULT_CODE));
    this.mirror = new StrudelMirror({
      root,
      initialCode,
      defaultOutput,
      transpiler,
      setInterval,
      clearInterval,
      getTime: () => performance.now() / 1000,
      prebake: () => ensureStrudelGlobals().then(() => undefined),
      bgFill: false,
      solo: false,
      onToggle: (started: boolean) => {
        this.playing = started;
        this.requestUpdate();
      },
      onEvalError: (err: Error) => {
        this.detail = err.message;
        this.requestUpdate();
      },
      afterEval: () => {
        this.detail = "";
        this.requestUpdate();
        // Widgets evaluated into the pattern can mount new style modules —
        // re-bridge so they reach the light-DOM editor too.
        this.bridgeEditorStyles();
      },
    });
    this.editorRoot = root;
    root.addEventListener("input", this.onEditorInput);
    if (this.runtimeProps?.value) this.syncFromState(this.runtimeValue("value"));
    this.bridgeEditorStyles();
    // The ctor applies the persisted strudel defaults (18px / monospace) as
    // INLINE styles on the editor root and scroller, beating any stylesheet
    // — re-assert the app's tokens so the editor matches the OSC console's
    // type (same vars .osc-log uses).
    root.style.fontFamily = "var(--font-mono)";
    root.style.fontSize = "var(--font-size-xs)";
    const scroller = root.querySelector<HTMLElement>(".cm-scroller");
    if (scroller) scroller.style.fontFamily = "var(--font-mono)";
  }

  /** CodeMirror mounts its style modules into the editor's COMPOSED-tree
   *  root: its root detection walks up through `assignedSlot`, so inside a
   *  plugin — whose markup is slotted into `<sc-plugin>`'s shadow root —
   *  the styles land in that shadow root's adoptedStyleSheets, where they
   *  cannot style the editor (its DOM lives in the light tree: broken
   *  flex layout, no theme colors). Re-adopt those sheets onto the document
   *  so they actually apply; a constructed sheet may be adopted by many
   *  roots, so this is safe and idempotent. */
  private bridgeEditorStyles(): void {
    if (!("adoptedStyleSheets" in document)) return;
    // Walk exactly like CodeMirror's root detection (assignedSlot first).
    // Start one step up: the element itself is never a ShadowRoot.
    let node: Node | null = this.assignedSlot ?? this.parentNode;
    while (node && !(node instanceof ShadowRoot)) {
      node = (node instanceof Element ? node.assignedSlot : null) ?? node.parentNode;
    }
    if (!(node instanceof ShadowRoot)) return; // not slotted — nothing to bridge
    const missing = node.adoptedStyleSheets.filter((s) => !document.adoptedStyleSheets.includes(s));
    if (missing.length) {
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...missing];
    }
  }

  render() {
    return html`
      <section class=${styles.root}>
        <header class=${styles.header}>
          <sc-base-text as="h1" size="sm" transform="uppercase">strudel</sc-base-text>
          <sc-base-chip
            dot
            variant=${STATUS_VARIANT[this.status]}
            label=${this.status}
          ></sc-base-chip>
          <sc-base-button
            label=${this.playing ? "Update" : "Play"}
            ?disabled=${this.status !== "connected" || !this.mirror}
            @click=${() => this.mirror?.evaluate()}
          ></sc-base-button>
          <sc-base-button
            label="Stop"
            variant="secondary"
            ?disabled=${!this.playing}
            @click=${() => this.mirror?.stop()}
          ></sc-base-button>
        </header>
        <div class=${styles.editor}></div>
        ${this.detail ? html`<p class=${styles.detail}>${this.detail}</p>` : ""}
      </section>
    `;
  }
}
