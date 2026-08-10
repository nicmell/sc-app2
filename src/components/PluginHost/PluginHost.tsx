// Shared React boundary for dashboard and standalone plugin mounts. It resolves
// metadata, fetches and parses the authored XHTML, and processes the imported
// tree on an explicitly upgraded but DISCONNECTED <sc-plugin>. Only the clean,
// registered runtime tree enters the document; from there the element owns its
// load/unload lifecycle and scsynth group.
import { useEffect, useRef, useState } from "react";
import { adoptEntry, fetchPluginEntry } from "@/lib/plugins/PluginManager";
import { registerAll } from "@/runtime/registry";
import type { ScElement, ScPlugin } from "@/sc-elements";
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
        const text = await fetchPluginEntry(info);
        if (!container.isConnected) return; // React unmounted us during the fetch.

        const doc = new DOMParser().parseFromString(text, "text/xml");
        const parseError = doc.querySelector("parsererror");
        if (parseError) {
          throw new Error(`plugin entry is not valid XHTML: ${parseError.textContent}`);
        }

        const host = document.createElement("sc-plugin") as ScPlugin;
        host.id = hostId;
        adoptEntry(host, doc);
        customElements.upgrade(host);
        host.process({
          rootNode: host,
          nodes: new Set<ScElement>(),
          scope: [host],
          path: [],
        });

        if (!container.isConnected) return;
        container.appendChild(host);
        registerAll(host);
      } catch (cause) {
        if (container.isConnected) {
          setError(cause instanceof Error ? cause.message : String(cause));
        }
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
