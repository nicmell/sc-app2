// Shared React boundary for dashboard and standalone plugin mounts. It resolves
// metadata and loads the authored <sc-plugin> root as the explicitly upgraded,
// processed, DISCONNECTED host. Once connected, the element owns the
// load/unload lifecycle together with its scsynth group.
import { useEffect, useRef, useState } from "react";
import { loadPluginHost } from "@/lib/plugins/PluginManager";
import { plugins } from "@/stores/plugins";
import { useStore } from "@/stores/useStore";
import styles from "./PluginHost.module.scss";

export function PluginHost({ pluginId }: { pluginId: string }) {
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
        const host = await loadPluginHost(info);
        if (!containerRef.current?.isConnected) return;
        container.appendChild(host);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      }
    })();

    // Intentionally no cleanup: DOM removal disconnects the host, whose own
    // callback unloads and unregisters it. That also makes the run-once guard
    // safe when StrictMode repeats effect setup for the same mounted container.
  }, [info]);

  const message = info ? error : "PluginHost: no plugin assigned";
  return (
    <div className={styles.host} ref={containerRef}>
      {message && <div className={styles.error}>{message}</div>}
    </div>
  );
}
