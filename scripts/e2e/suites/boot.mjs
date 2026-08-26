// The boot suite: the only real-browser coverage of the app's own story —
// wasm validator through the route loader, session mint + truthful-URL
// redirect, WebSocket + OSC + live scsynth status. Assertions are POLLS with
// deadlines and deliberately coarse (presence/regex, never exact strings) so
// copy changes don't rot the suite.
import { freshTab } from "../cdp.mjs";
import { APP } from "../stack.mjs";

async function poll(probe, timeoutMs, everyMs = 250) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    try {
      last = await probe();
      if (last === true) return true;
    } catch (e) {
      last = e.message;
    }
    await new Promise((r) => setTimeout(r, everyMs));
  }
  return last ?? false;
}

export async function run() {
  const rows = [];
  // A probe result is `true` or a diagnostic string — fold that contract
  // into the row shape once.
  const row = (name, result) => rows.push({ name, ok: result === true, detail: result === true ? "" : String(result) });

  // Clean slate (closes stale tabs, clears the stored session id — the
  // fresh-mint guarantee), then boot the app for real.
  const tab = await freshTab();
  try {
  await tab.navigate(`${APP}/`);

  // 1. The router renders under the loading fallback immediately.
  const painted = await poll(
    () => tab.evaluate("(document.getElementById('root')?.innerHTML.length ?? 0) > 0"),
    10_000,
  );
  row("root paints during boot", painted);

  // 2. The wasm validator initialized through the boot loader.
  const validator = await poll(
    () =>
      tab.evaluate(`(async () => {
        const { initValidator, getSpec } = await import("/src/lib/plugins/validate.ts");
        await initValidator();
        return getSpec("sc-slider") !== undefined;
      })()`),
    30_000,
  );
  row("validator initialized (getSpec live)", validator);

  // 3. A typed violation flows end to end (code + position).
  const typed = await poll(
    () =>
      tab.evaluate(`(async () => {
        const { validateEntry } = await import("/src/lib/plugins/validate.ts");
        try {
          validateEntry('<sc-plugin xmlns="http://www.w3.org/1999/xhtml"><sc-slider size="xl" value="1"/></sc-plugin>');
          return "no violations thrown";
        } catch (e) {
          const v = e.violations?.[0];
          return v?.kind?.code === "invalid-enum" &&
            Number.isInteger(v?.line) && Number.isInteger(v?.column)
            ? true
            : "unexpected shape: " + JSON.stringify(e.violations ?? e.message);
        }
      })()`),
    30_000,
  );
  row("typed violations flow (kind.code + position)", typed);

  // 4. The loaders settled: truthful /:uuid URL and a LIVE scsynth footer
  //    (the proof the whole WS/OSC/status pipeline works).
  const connected = await poll(
    () =>
      tab.evaluate(`(() => {
        const uuid = /^\\/[0-9a-f]{8}-[0-9a-f-]{27}$/.test(location.pathname);
        const text = document.getElementById("root")?.innerText ?? "";
        const live = /\\d+(\\.\\d+)?\\s*%/.test(text);
        return uuid && live ? true : "pathname=" + location.pathname + " live=" + live;
      })()`),
    60_000,
    1000,
  );
  row("session minted, connected, live status", connected);
  } finally {
    tab.close();
  }
  return rows;
}
