import { useEffect, useRef } from "react";
import { useStore } from "../state/useStore";
import { plugins } from "../state/plugins";
import { loadPluginInto } from "../lib/plugins/PluginManager";
import type { BoxItem } from "../state/layout";

/** Stop a header-button interaction from starting a grid drag. */
const stopDrag = (e: React.MouseEvent) => e.stopPropagation();

export function DashboardPanel({
  box,
  onRemove,
  onAssign,
}: {
  box: BoxItem;
  onRemove: () => void;
  onAssign: () => void;
}) {
  const installed = useStore(plugins);
  const plugin = box.plugin ? installed.find((p) => p.id === box.plugin) : undefined;
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !plugin) return;
    let cancelled = false;
    host.innerHTML = "";
    loadPluginInto(host, plugin).catch((err) => {
      if (!cancelled) host.innerHTML = `<div class="error">failed to load plugin: ${err}</div>`;
    });
    return () => {
      cancelled = true;
      host.innerHTML = "";
    };
  }, [plugin?.id]);

  return (
    <div className="panel dashboard-panel">
      <header className="panel-header">
        <span className="panel-title">{plugin?.name ?? "empty"}</span>
        <span className="cluster panel-actions">
          <button
            type="button"
            data-variant="ghost"
            data-size="sm"
            onMouseDown={stopDrag}
            onClick={onAssign}
          >
            plugin
          </button>
          <button
            type="button"
            data-variant="ghost"
            data-size="sm"
            aria-label="Remove panel"
            onMouseDown={stopDrag}
            onClick={onRemove}
          >
            ×
          </button>
        </span>
      </header>
      <div className="dashboard-panel-body">
        {plugin ? (
          <div className="plugin-host" ref={hostRef} />
        ) : (
          <div className="empty dashboard-panel-empty">
            <button type="button" data-size="sm" onMouseDown={stopDrag} onClick={onAssign}>
              Select plugin
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
