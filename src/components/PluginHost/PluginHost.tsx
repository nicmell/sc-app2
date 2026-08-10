// Shared React boundary for dashboard and standalone plugin mounts. It resolves
// metadata and loads the authored <sc-plugin> root as the explicitly upgraded,
// processed, DISCONNECTED host. Only the clean, registered runtime tree enters
// the document; from there the element owns its load/unload lifecycle and
// scsynth group.
import { useEffect, useRef, useState } from "react";
import { loadPluginHost } from "@/lib/plugins/PluginManager";
import { registerAll } from "@/runtime/registry";
import { plugins } from "@/stores/plugins";
import { useStore } from "@/stores/useStore";
import styles from "./PluginHost.module.scss";

export function PluginHost({ pluginId, hostId }: { pluginId: string; hostId: string }) {
  const info = useStore(plugins).find((plugin) => plugin.id === pluginId);
  const containerRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current || !info) return;
    started.current = true;
    const container = containerRef.current;
    if (!container) return;

    void (async () => {
      try {
        const host = await loadPluginHost(info, hostId);
        if (!containerRef.current?.isConnected) return;
        container.appendChild(host);
        registerAll(host);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      }
    })();

    // Intentionally no cleanup: DOM removal disconnects the host, whose own
    // callback unloads and unregisters it. That also makes the run-once guard
    // safe when StrictMode repeats effect setup for the same mounted container.
  }, [hostId, info]);

  const message = info ? error : "PluginHost: no plugin assigned";
  return (
    <div className={styles.host} ref={containerRef}>
      {message && <div className={styles.error}>{message}</div>}
    </div>
  );
}
