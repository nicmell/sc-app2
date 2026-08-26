// The one CDP client: a thin tab handle over Chrome's :9222 endpoint.
// Interpolate values into evaluated expressions with `js()` (JSON.stringify)
// — never raw string templates.
import { APP, CDP } from "./stack.mjs";

export const js = (value) => JSON.stringify(value);

class Tab {
  constructor(target, socket) {
    this.target = target;
    this.socket = socket;
    this.seq = 0;
    this.pending = new Map();
    socket.onmessage = (ev) => {
      const message = JSON.parse(ev.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(JSON.stringify(message.error)));
        else resolve(message.result);
      }
    };
    // A dying socket (Chrome crash, closed tab) must fail pending sends
    // loudly, not hang the run forever.
    const drain = (why) => () => {
      for (const { reject } of this.pending.values()) reject(new Error(why));
      this.pending.clear();
    };
    socket.onclose = drain("cdp socket closed");
    socket.onerror = drain("cdp socket error");
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.seq;
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  /** Evaluate in-page; `awaitPromise` on by default (async IIFEs are the
   *  norm here). Throws on in-page exceptions. */
  async evaluate(expression, { awaitPromise = true } = {}) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise,
      returnByValue: true,
    });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }

  async navigate(url) {
    await this.send("Page.navigate", { url });
  }

  close() {
    this.socket.close();
  }
}

async function targets() {
  return await (await fetch(`${CDP}/json/list`)).json();
}

async function openTab(target) {
  const socket = await new Promise((resolve, reject) => {
    const s = new WebSocket(target.webSocketDebuggerUrl);
    s.onopen = () => resolve(s);
    s.onerror = () => reject(new Error("cdp socket"));
  });
  const tab = new Tab(target, socket);
  await tab.send("Runtime.enable");
  await tab.send("Page.enable");
  return tab;
}

/** The app tab, reused when one exists (the boot suite's page), else created. */
export async function findOrCreateTab() {
  const existing = (await targets()).find((t) => t.type === "page" && t.url.startsWith(APP));
  if (existing) return openTab(existing);
  const created = await (
    await fetch(`${CDP}/json/new?${APP}/`, { method: "PUT" })
  ).json();
  return openTab(created);
}

/** A clean-slate app tab: close every existing app tab (their WS sessions
 *  end server-side), clear the origin's localStorage (via /@vite/client —
 *  same-origin JS served as text, no app boot), and hand back a fresh tab
 *  still parked there. This is what defeats the session-busy 409 race in
 *  attach mode: localStorage is per-origin across tabs, so a stale stored
 *  session id would otherwise be revived under a dying socket. */
export async function freshTab() {
  for (const target of await targets()) {
    if (target.type === "page" && target.url.startsWith(APP)) {
      await fetch(`${CDP}/json/close/${target.id}`);
    }
  }
  const created = await (
    await fetch(`${CDP}/json/new?${APP}/@vite/client`, { method: "PUT" })
  ).json();
  const tab = await openTab(created);
  // Wait for the trivial same-origin navigation to commit (a fixed sleep is
  // flaky on slow machines and clearing an opaque origin throws).
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const origin = await tab.evaluate("location.origin", { awaitPromise: false });
      if (origin === new URL(APP).origin) break;
    } catch {
      /* not committed yet */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  await tab.evaluate("localStorage.clear(); sessionStorage.clear(); true", {
    awaitPromise: false,
  });
  return tab;
}
