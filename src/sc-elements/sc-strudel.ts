// <sc-strudel> — the Strudel REPL. Ports the old StrudelConsole: mounts a
// StrudelMirror editor whose Hap onsets are emitted as `/dirt/play` bundles via
// the session, with a status pill + Play/Stop controls. Light DOM so the
// ui-foundation .strudel/.status-pill styles + CodeMirror apply directly.

import { LitElement, html } from "lit";
import { StrudelMirror } from "@strudel/codemirror";
import { transpiler } from "@strudel/transpiler";
import { ensureStrudelGlobals } from "@/lib/strudel/prebake";
import { OSC, atDate, type OscPacket } from "@sc-app/server-commands";
import type { ConnStatus } from "@/types/stores";
import { session } from "@/stores/session";

const SAFETY_LOOKAHEAD_MS = 200;

/** A SuperDirt event: a flat bag of params (`s`, `n`, `gain`, `note`, …). */
type DirtEvent = Record<string, string | number>;

/** Build a `/dirt/play` bundle: flat `[key, value, …]` args, scheduled at
 *  `timetagMs` (a wall-clock ms timestamp — osc-js converts it to NTP). */
function dirtPlayBundle(event: DirtEvent, timetagMs: number): OscPacket {
  const args: Array<string | number> = [];
  for (const [k, v] of Object.entries(event)) args.push(k, v);
  const message = new OSC.Message("/dirt/play", ...args);
  return new OSC.Bundle([message], atDate(timetagMs));
}

const DEFAULT_CODE = `// Strudel — patterns route through StrudelDirt via the OSC bridge.
// Edit, then press Play (or Ctrl+Enter). Stop with the button (or Ctrl+.).
s("bd hh*2 sd hh")`;

const STATUS_VARIANT: Record<ConnStatus, "ok" | "warn" | "error"> = {
  connecting: "warn",
  connected: "ok",
  error: "error",
};

export class ScStrudel extends LitElement {
  private mirror: InstanceType<typeof StrudelMirror> | null = null;
  private off: (() => void) | null = null;
  private status: ConnStatus = "connecting";
  private playing = false;
  private detail = "";

  protected createRenderRoot(): HTMLElement {
    return this;
  }

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
    this.off?.();
    this.off = null;
    if (this.mirror) {
      void this.mirror.stop();
      this.mirror.clear();
      this.mirror = null;
    }
  }

  updated(): void {
    // Mount the editor once, the first time we're connected and the host exists.
    if (this.mirror || this.status !== "connected") return;
    const root = this.querySelector<HTMLDivElement>(".strudel-editor");
    if (!root) return;

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
      const timetag = Math.round(
        Date.now() + targetTimeSecs * 1000 - performance.now() + SAFETY_LOOKAHEAD_MS,
      );
      session.send(dirtPlayBundle(event, timetag));
    };

    this.mirror = new StrudelMirror({
      root,
      initialCode: DEFAULT_CODE,
      defaultOutput,
      getTime: () => performance.now() / 1000,
      transpiler,
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
      },
    });
  }

  render() {
    return html`
      <section class="strudel">
        <header class="strudel-header">
          <h1>strudel</h1>
          <span class="status-pill" data-variant=${STATUS_VARIANT[this.status]}>${this.status}</span>
          <button
            type="button"
            ?disabled=${this.status !== "connected"}
            @click=${() => this.mirror?.evaluate()}
          >
            ${this.playing ? "Update" : "Play"}
          </button>
          <button
            type="button"
            data-variant="secondary"
            ?disabled=${!this.playing}
            @click=${() => this.mirror?.stop()}
          >
            Stop
          </button>
        </header>
        <div class="strudel-editor"></div>
        ${this.detail ? html`<p class="strudel-detail">${this.detail}</p>` : ""}
      </section>
    `;
  }
}
