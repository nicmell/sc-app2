// Mounts a plugin into a dashboard box: renders the app-synthesized
// <sc-plugin> root declaratively (React mounts custom elements like any DOM
// tag) with the box's id as its DOM id — the component looks its plugin up in
// the stores, loads + parses the entry HTML, registers the tree in the
// runtime registry, and owns the plugin's scsynth group, freed when React
// unmounts it. Keyed by the assigned plugin so changing a box's plugin
// remounts a fresh element.
import type { BoxItem } from "@/types/stores";

export function PluginHost({ box }: { box: BoxItem }) {
  return (
    <div className="plugin-host">
      <sc-plugin key={box.plugin} id={box.i} />
    </div>
  );
}
