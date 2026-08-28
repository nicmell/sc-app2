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
  const offRuntime = useRef<(() => void) | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current || !info) return;
    started.current = true;
    const container = containerRef.current;
    if (!container) return;

    void (async () => {
      try {
        const host = await loadPluginHost(info, { resumed: resumedFor(boxId, info.id) });
        if (!containerRef.current?.isConnected) return;
        container.appendChild(host);
        if (boxId) {
          offRuntime.current = host.runtime.subscribe(() =>
            setBoxPresets(boxId, info.id, host.collectPresets()),
          );
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      }
    })();

    // Intentionally no DOM cleanup: removal disconnects the host, whose own
    // callback unloads it. That also makes the run-once guard safe when
    // StrictMode repeats effect setup for the same mounted container — only
    // the harvest subscription needs dropping (the first StrictMode cleanup
    // runs before the async subscription exists and is a no-op).
    return () => {
      offRuntime.current?.();
      offRuntime.current = null;
    };
  }, [info, boxId]);

  const message = info ? error : "PluginHost: no plugin assigned";
  return (
    <div className={styles.host} ref={containerRef}>
      {message && <div className={styles.error}>{message}</div>}
    </div>
  );
}
