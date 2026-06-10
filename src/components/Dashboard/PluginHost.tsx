// Mounts a plugin into a dashboard box: creates the app-synthesized
// <sc-plugin> root (which loads + parses the entry HTML, registers the tree in
// the runtime registry, and owns the plugin's scsynth group) and removes it on
// unmount, which frees the group and the parsed tree.
import { useEffect, useRef } from "react";
import { ELEMENTS } from "@/constants/sc-elements";
import type { ScPlugin } from "@/sc-elements";
import type { PluginInfo } from "@/types/api";

export function PluginHost({ plugin }: { plugin: PluginInfo }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const el = document.createElement(ELEMENTS.SC_PLUGIN) as ScPlugin;
    el.plugin = plugin;
    host.appendChild(el);
    return () => {
      el.remove();
    };
  }, [plugin.id]);

  return <div className="plugin-host" ref={hostRef} />;
}
