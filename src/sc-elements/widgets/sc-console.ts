// <sc-console> — the OSC message log. Ports the old OscConsole: subscribes to
// the session's bounded tx/rx log store and renders it as a scrolling list,
// pinned to the newest row. Light DOM so ui-foundation .osc-* styles apply.

import { html } from "lit";
import { ScElement } from "@/sc-elements/internal/sc-element";
import type { ScConsoleItem } from "@/types/parsers";
import { session } from "@/stores/session";
import type { LoggedEntry } from "@/types/stores";

function fmtTime(ms: number): string {
  const d = new Date(ms);
  const hms = d.toLocaleTimeString([], { hour12: false });
  return `${hms}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

export class ScConsole extends ScElement<ScConsoleItem> {
  validate(): void {
    this.requireNoScChildren();
  }

  private off: (() => void) | null = null;


  connectedCallback(): void {
    super.connectedCallback();
    this.off = session.log.subscribe(() => this.requestUpdate());
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.off?.();
    this.off = null;
  }

  updated(): void {
    // Auto-scroll to the newest entry, like a terminal.
    const log = this.querySelector(".osc-log");
    if (log) log.scrollTop = log.scrollHeight;
  }

  render() {
    const entries: LoggedEntry[] = session.log.get();
    return html`
      <section class="osc-console">
        <header class="osc-header">
          <h2>OSC console</h2>
          <span class="osc-count">${entries.length}</span>
        </header>
        <div class="osc-log">
          ${entries.length === 0
            ? html`<div class="osc-empty">waiting for OSC traffic…</div>`
            : entries.map(
                (e) => html`
                  <div class="osc-row osc-${e.dir}">
                    <span class="osc-time">${fmtTime(e.ts)}</span>
                    <span class="osc-dir">${e.dir.toUpperCase()}</span>
                    <span class="osc-addr">${e.address}</span>
                    <span class="osc-args">${e.args.join(" ")}</span>
                  </div>
                `,
              )}
        </div>
      </section>
    `;
  }
}
