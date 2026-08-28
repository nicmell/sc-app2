// Shared React boundary for dashboard and standalone plugin mounts. It resolves
// metadata and loads the authored <sc-plugin> root as the explicitly upgraded,
// processed, DISCONNECTED host. Once connected, the element owns the
// load/unload lifecycle together with its scsynth group.
//
// With a `boxId` (a dashboard mount) the host also joins the presets loop:
// its box's saved values are claimed during the parse (skipped wholesale when
// they were captured against a different installed plugin), and every runtime
// store change is harvested back into the presets slice for the autosave.
import { useEffect, useRef, useState } from "react";
import { loadPluginHost } from "@/lib/plugins/PluginManager";
import type { ScPlugin } from "@/sc-elements";
import { plugins } from "@/stores/plugins";
import { presets, setBoxPresets } from "@/stores/presets";
import { useStore } from "@/stores/useStore";
import type { StateValue } from "@/types/runtime";
import styles from "./PluginHost.module.scss";

/** The persisted values to rehydrate this mount with — only when the box's
 *  entry was captured against the SAME installed plugin (a re-upload mints a
 *  fresh plugin id, so stale state skips wholesale). */
function resumedFor(
  boxId: string | undefined,
  pluginId: string,
): Record<string, StateValue> | undefined {
  const entry = boxId ? presets.get()[boxId] : undefined;
  if (!entry || entry.plugin !== pluginId) return undefined;
  return Object.fromEntries(Object.entries(entry.values).map(([id, e]) => [id, e.value]));
}

export function PluginHost({ pluginId, boxId }: { pluginId: string; boxId?: string }) {
  const info = useStore(plugins).find((plugin) => plugin.id === pluginId);
  const containerRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const [host, setHost] = useState<ScPlugin | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current || !info) return;
    started.current = true;
    const container = containerRef.current;
    if (!container) return;

    void (async () => {
      try {
        const loaded = await loadPluginHost(info, { resumed: resumedFor(boxId, info.id) });
        if (!containerRef.current?.isConnected) return;
        container.appendChild(loaded);
        setHost(loaded);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      }
    })();

    // Intentionally no cleanup: DOM removal disconnects the host, whose own
    // callback unloads it. That also makes the run-once guard safe when
    // StrictMode repeats effect setup for the same mounted container — and
    // when a loader revalidation (refreshPlugins) swaps `info`'s identity
    // without remounting.
  }, [info, boxId]);

  // The harvest subscription lives in its OWN effect keyed on the loaded
  // host: a StrictMode replay or an in-place revalidation of the load effect
  // above can neither strand nor double it, and the cleanup runs exactly at
  // unmount. `host.pluginId` (set by loadPluginHost) avoids the stale-`info`
  // closure.
  useEffect(() => {
    if (!host || !boxId) return;
    return host.runtime.subscribe(() => setBoxPresets(boxId, host.pluginId, host.collectPresets()));
  }, [host, boxId]);

  const message = info ? error : "PluginHost: no plugin assigned";
  return (
    <div className={styles.host} ref={containerRef}>
      {message && <div className={styles.error}>{message}</div>}
    </div>
  );
}
