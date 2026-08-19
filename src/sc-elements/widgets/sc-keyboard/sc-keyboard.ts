// <sc-keyboard> — an on-screen MIDI-style piano that spawns a voice synth per
// pressed key and releases it on key-up: the declarative equivalent of an
// sclang MIDIFunc noteOn/noteOff pair
//   noteOn:  ~notes[note] = Synth(\def, [\freq, note.midicps, \amp, vel/127])
//   noteOff: ~notes[note].set(\gate, 0)
//
// It owns no persistent node (a leaf widget, like sc-scope): it references a
// <sc-synthdef> by name — exactly as sc-synth does (resolveNode + the synthdef
// type check) — and, on each press, oscClient.createSynth's a transient voice
// into the PLUGIN group (the root's own nodeId), releasing it with a
// gate-0 /n_set. The voices are reaped wholesale by the plugin group's
// gFreeAll on unload; the demo synthdefs pair gate-0 with a done-action so a
// released voice also self-frees.
//
// Three input sources all funnel into noteOn/noteOff over ONE held-note map
// (keyed by MIDI note, so a release matches its press regardless of source):
// on-screen pointer (velocity from the vertical click position), the computer
// keyboard (the tracker row a..k), and Web MIDI hardware (real velocity/127).
//
// Light DOM (createRenderRoot returns `this`) so the .sc-keyboard CSS applies.

import { html } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { isNodeRuntime } from "@/lib/utils/guards";
import { oscClient } from "@/stores/osc";
import type { RuntimeContext } from "@/types/runtime";
import { resolveSynthDefRef } from "@/sc-elements/internal/resolution";
import { failValidation } from "@/sc-elements/internal/validation";
import { ScElement } from "@/sc-elements/internal/sc-element";
import type { ScSynthDef } from "@/sc-elements/synthdef/sc-synthdef";
import styles from "./sc-keyboard.module.scss";

/** MIDI semitones (mod 12) that are black keys. */
const BLACK = new Set([1, 3, 6, 8, 10]);

/** The computer-keyboard "tracker" row → semitone offset from `start`. */
const KEY_OFFSETS: Record<string, number> = {
  a: 0, // C
  w: 1, // C#
  s: 2, // D
  e: 3, // D#
  d: 4, // E
  f: 5, // F
  t: 6, // F#
  g: 7, // G
  y: 8, // G#
  h: 9, // A
  u: 10, // A#
  j: 11, // B
  k: 12, // C (next octave)
};

/** A press awaiting (or holding) its scsynth node. `nodeId` is null between
 *  the /s_new send and its /n_go ack; `releaseWhenReady` records a release
 *  that arrived inside that window (mirrors sc-synth's ack-window catch-up). */
interface Voice {
  nodeId: number | null;
  releaseWhenReady: boolean;
}

const clampVel = (n: number): number => Math.min(1, Math.max(0.05, n));

export class ScKeyboard extends ScElement {
  // Declarative attributes are coerced and defaulted by getProp. `synthdef`
  // is required (enforced by validateProps); the param-name attrs default to
  // the SC-idiomatic names, so a synthdef using `freq`/`amp`/`gate` needs no
  // mapping.

  // ── Runtime values (the element IS the runtime) ─────────────────────────
  /** note → its live voice. Cleared on unload (the ids die with the group). */
  private held = new Map<number, Voice>();
  /** Notes currently pressed — drives the key highlight (reactive redraw). */
  private active = new Set<number>();
  private midiInputs: MIDIInput[] = [];
  private onKeyDown = (e: KeyboardEvent): void => this.handleKeyDown(e);
  private onKeyUp = (e: KeyboardEvent): void => this.handleKeyUp(e);

  /** The resolved definition element (set at parse) — each voice latches the
   *  keyboard's live `envelope` value onto `envParam` inside its /s_new. */
  private defElement!: ScSynthDef;
  /** The def's single array param the `envelope` value targets (resolved at
   *  parse; unset when the keyboard carries no envelope). */
  private envParam?: string;

  /** Validate the synthdef reference the sc-synth way: it must name an actual
   *  <sc-synthdef> in scope — and, when an `envelope` is given, declare
   *  exactly ONE array param to latch it onto. A leaf otherwise — no
   *  children, no node. */
  resolveRuntime(ctx: RuntimeContext): void {
    super.resolveRuntime(ctx);
    const synthdef = this.getProp("synthdef") as string;
    const target = resolveSynthDefRef(this, ctx, synthdef);
    if (this.hasAttribute("envelope") || this.hasAttribute("bind:envelope")) {
      const arrayParams = Object.entries(target.params)
        .filter(([, v]) => Array.isArray(v))
        .map(([k]) => k);
      if (arrayParams.length !== 1) {
        failValidation(
          this,
          `"envelope" requires exactly one array param on <sc-synthdef name="${synthdef}"> (found ${
            arrayParams.length ? arrayParams.join(", ") : "none"
          })`,
        );
      }
      this.envParam = arrayParams[0];
    }
    this.defElement = target;
  }

  /** The plugin group a voice spawns into (the root's own nodeId), or 0 when
   *  the plugin isn't live — a press before/after connection is a no-op. */
  private get groupId(): number {
    const root = this._rootScNode;
    return isNodeRuntime(root) ? root.nodeId : 0;
  }

  /** MIDI note → frequency in Hz (A4 = note 69 = 440 Hz). */
  private static midicps(note: number): number {
    return 440 * 2 ** ((note - 69) / 12);
  }

  /** Start a voice: /s_new the synthdef into the plugin group with the mapped
   *  freq + amp. Guards mirror sc-synth — never adopt a node id from a
   *  superseded/disconnected pass, and honor a release that raced the ack. */
  async noteOn(note: number, velocity: number): Promise<void> {
    const groupId = this.groupId;
    if (groupId === 0 || this.held.has(note)) return;
    const voice: Voice = { nodeId: null, releaseWhenReady: false };
    this.held.set(note, voice);
    this.active.add(note);
    this.requestUpdate();

    const live = this.loadGuard();
    try {
      // The live `envelope` value (typically bind:envelope to a var an
      // editor edits) is latched onto the def's array param INSIDE the
      // /s_new as consecutive index/value pairs, so the voice sounds the
      // CURRENT shape from sample zero (no post-create seed, no race).
      const arrays: Array<{ index: number; values: readonly number[] }> = [];
      const envelope = this.getProp("envelope");
      const index = this.envParam ? this.defElement.paramIndexOf(this.envParam) : undefined;
      if (Array.isArray(envelope) && index !== undefined) {
        arrays.push({ index, values: envelope });
      }
      const nodeId = await oscClient.createSynth(
        this.getProp("synthdef") as string,
        groupId,
        {
          [this.getProp("freq") as string]: ScKeyboard.midicps(note),
          [this.getProp("amp") as string]: velocity,
        },
        arrays,
      );
      // Superseded/disconnected while awaiting /n_go, or released mid-flight.
      if (this.held.get(note) !== voice) return;
      if (!this.isConnected || !live()) {
        this.held.delete(note);
        return;
      }
      voice.nodeId = nodeId;
      if (voice.releaseWhenReady) {
        oscClient.setControl(nodeId, this.getProp("gate") as string, 0);
        this.held.delete(note);
      }
    } catch {
      // createSynth rejected (timeout, connection close) — drop the reservation.
      if (this.held.get(note) === voice) this.held.delete(note);
      this.active.delete(note);
      this.requestUpdate();
    }
  }

  /** Release a voice: gate → 0 (the synthdef's done-action frees it). A release
   *  arriving before the /n_go ack is deferred until noteOn adopts the id. */
  noteOff(note: number): void {
    const voice = this.held.get(note);
    this.active.delete(note);
    this.requestUpdate();
    if (!voice) return;
    if (voice.nodeId !== null) {
      oscClient.setControl(voice.nodeId, this.getProp("gate") as string, 0);
      this.held.delete(note);
    } else {
      voice.releaseWhenReady = true;
    }
  }

  /** Connection loss: drop every held voice (the ids die with the plugin
   *  group's gFreeAll; keeping them would reuse stale ids after reconnect). */
  unload(): void {
    super.unload();
    this.held.clear();
    this.active.clear();
    this.requestUpdate();
  }

  /** Focus leaving the keyboard releases every held note: the tracker-row
   *  keyup only reaches this element while it is focused, so clicking away
   *  mid-hold (into the envelope editor, say) would otherwise strand a
   *  sustaining voice AND deafen that key (`held` blocks re-presses). */
  private onFocusOut = (e: FocusEvent): void => {
    if (e.relatedTarget instanceof Node && this.contains(e.relatedTarget)) return;
    for (const note of [...this.held.keys()]) this.noteOff(note);
  };

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("keydown", this.onKeyDown);
    this.addEventListener("keyup", this.onKeyUp);
    this.addEventListener("focusout", this.onFocusOut);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this.onKeyDown);
    this.removeEventListener("keyup", this.onKeyUp);
    this.removeEventListener("focusout", this.onFocusOut);
    for (const input of this.midiInputs) input.onmidimessage = null;
    this.midiInputs = [];
  }

  /** Attach Web MIDI once the element is live — absent under happy-dom, and a
   *  denied permission just leaves the on-screen/computer inputs working. */
  protected firstUpdated(): void {
    if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) return;
    void navigator
      .requestMIDIAccess()
      .then((access) => {
        if (!this.isConnected) return;
        for (const input of access.inputs.values()) {
          input.onmidimessage = (e) => this.handleMidi(e);
          this.midiInputs.push(input);
        }
      })
      .catch(() => {
        /* no MIDI access — the other input sources still work */
      });
  }

  private handleMidi(e: MIDIMessageEvent): void {
    const data = e.data;
    if (!data || data.length < 3) return;
    const [status, note, velocity] = data;
    const kind = status & 0xf0;
    if (kind === 0x90 && velocity > 0) void this.noteOn(note, velocity / 127);
    else if (kind === 0x80 || (kind === 0x90 && velocity === 0)) this.noteOff(note);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;
    const offset = KEY_OFFSETS[e.key.toLowerCase()];
    if (offset === undefined) return;
    e.preventDefault();
    void this.noteOn((this.getProp("start") as number) + offset, 0.7);
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const offset = KEY_OFFSETS[e.key.toLowerCase()];
    if (offset === undefined) return;
    this.noteOff((this.getProp("start") as number) + offset);
  }

  /** velocity from the vertical click position: top of a key = quiet, bottom =
   *  loud (offsetY grows downward); falls back to a mid velocity when the
   *  layout offset is unavailable. */
  private velocityFromY(e: PointerEvent): number {
    const el = e.currentTarget as HTMLElement;
    const h = el.clientHeight || 0;
    if (!h || Number.isNaN(e.offsetY)) return 0.7;
    return clampVel(e.offsetY / h);
  }

  private pressKey(note: number, e: PointerEvent): void {
    const el = e.currentTarget as HTMLElement;
    if (el.setPointerCapture && typeof e.pointerId === "number") {
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* capture unsupported — pointer up/leave still release the note */
      }
    }
    void this.noteOn(note, this.velocityFromY(e));
  }

  render() {
    const startNote = this.getProp("start") as number;
    const count = (this.getProp("octaves") as number) * 12;
    const notes: number[] = [];
    for (let i = 0; i < count; i++) notes.push(startNote + i);

    const whites = notes.filter((n) => !BLACK.has(n % 12));
    const totalWhites = whites.length || 1;

    // Black keys overlay the white row, centered on the boundary after the
    // white keys that precede them.
    const blacks = notes
      .filter((n) => BLACK.has(n % 12))
      .map((n) => {
        const whitesBefore = notes.filter((m) => m < n && !BLACK.has(m % 12)).length;
        return { note: n, leftPct: (whitesBefore / totalWhites) * 100 };
      });
    const blackWidthPct = (100 / totalWhites) * 0.62;

    return html`
      <div class=${styles.keyboard} tabindex="0">
        <div class=${styles.whites}>
          ${whites.map(
            (n) => html`
              <div
                class=${classMap({ [styles.white]: true, [styles.active]: this.active.has(n) })}
                data-note=${n}
                @pointerdown=${(e: PointerEvent) => this.pressKey(n, e)}
                @pointerup=${() => this.noteOff(n)}
                @pointerleave=${() => this.noteOff(n)}
                @pointercancel=${() => this.noteOff(n)}
              ></div>
            `,
          )}
        </div>
        <div class=${styles.blacks}>
          ${blacks.map(
            (b) => html`
              <div
                class=${classMap({
                  [styles.black]: true,
                  [styles.active]: this.active.has(b.note),
                })}
                data-note=${b.note}
                style="left:${b.leftPct}%;width:${blackWidthPct}%"
                @pointerdown=${(e: PointerEvent) => this.pressKey(b.note, e)}
                @pointerup=${() => this.noteOff(b.note)}
                @pointerleave=${() => this.noteOff(b.note)}
                @pointercancel=${() => this.noteOff(b.note)}
              ></div>
            `,
          )}
        </div>
      </div>
    `;
  }
}
