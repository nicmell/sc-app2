// Mounts a plugin's validated XHTML body into a plain host div. The plugin's
// `sc-*` custom elements upgrade themselves on insertion (they wire straight to
// the session singleton) — there is no runtime/bind pipeline. Replaces upstream's
// `<sc-plugin>` element with our HTTP-fetched innerHTML loader.
import { useEffect, useRef } from "react";
import { loadPluginInto, type PluginInfo } from "@/lib/plugins/PluginManager";

export function PluginHost({ plugin }: { plugin: PluginInfo }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    host.innerHTML = "";
    loadPluginInto(host, plugin).catch((err) => {
      if (!cancelled) host.innerHTML = `<div class="error">failed to load plugin: ${err}</div>`;
    });
    return () => {
      cancelled = true;
      host.innerHTML = "";
    };
  }, [plugin.id]);

  return <div className="plugin-host" ref={hostRef} />;
}
