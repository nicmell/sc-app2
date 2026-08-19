// <sc-console> — the OSC message log. Ports the old OscConsole: subscribes to
// the logging middleware's bounded tx/rx store and renders it as a scrolling list,
// pinned to the newest row. Light DOM so ui-components .osc-* styles apply.

import { html } from "lit";
import { ScElement } from "@/sc-elements/internal/sc-element";
import { log } from "@/stores/osc";
import type { LoggedEntry } from "@/types/stores";
import styles from "./sc-console.module.scss";

function fmtTime(ms: number): string {
  const d = new Date(ms);
  const hms = d.toLocaleTimeString([], { hour12: false });
  return `${hms}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

export class ScConsole extends ScElement {
  private off: (() => void) | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.off = log.subscribe(() => this.requestUpdate());
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.off?.();
    this.off = null;
  }

  updated(): void {
    // Auto-scroll to the newest entry, like a terminal.
    const log = this.querySelector(`.${styles.log}`);
    if (log) log.scrollTop = log.scrollHeight;
  }

  render() {
    const entries: LoggedEntry[] = log.get();
    return html`
      <section class=${styles.console}>
        <header class=${styles.header}>
          <sc-base-text as="h2" size="sm" transform="uppercase">OSC console</sc-base-text>
          <span class=${styles.count}>${entries.length}</span>
        </header>
        <div class=${styles.log}>
          ${entries.length === 0
            ? html`<div class=${styles.empty}>waiting for OSC traffic…</div>`
            : entries.map(
                (e) => html`
                  <div class="${styles.row} ${styles[e.dir]}">
                    <span class=${styles.time}>${fmtTime(e.ts)}</span>
                    <span class=${styles.dir}>${e.dir.toUpperCase()}</span>
                    <span class=${styles.addr}>${e.address}</span>
                    <span class=${styles.args}>${e.args.join(" ")}</span>
                  </div>
                `,
              )}
        </div>
      </section>
    `;
  }
}
