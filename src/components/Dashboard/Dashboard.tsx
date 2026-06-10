// The dashboard: a draggable/resizable react-grid-layout of plugin panels, with
// the empty space carved into clickable "add a panel here" placeholders. Faithful
// to upstream `sc-app/components/Dashboard`, restyled with ui-foundation and
// adapted to our reactiveStores (no redux/runtime/clock):
//   • layout/geometry  → state/layout (reactiveStore + localStorage)
//   • installed plugins → state/plugins (mirrored from the Rust router)
//   • panel content     → PluginHost (fetch entry HTML, inject body; sc-* upgrade)
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import type { Layout } from "react-grid-layout";
import { GridLayout, noCompactor, useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useStore } from "@/stores/useStore";
import { layout, setLayout, addBox, removeBox, setBoxPlugin, randomId, type BoxItem } from "@/stores/layout";
import { plugins } from "@/stores/plugins";
import type { PluginInfo } from "@/lib/plugins/PluginManager";
import { computePlaceholders, isPlaceholder, MARGIN } from "./utils";
import { DashboardPanel } from "./DashboardPanel";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardFooter } from "./DashboardFooter";
import { Placeholder } from "./Placeholder";
import { PluginHost } from "./PluginHost";
import { PluginPicker } from "@/components/PluginPicker";
import "./Dashboard.css";

const HEADER_HEIGHT = 42;
const FOOTER_HEIGHT = 42;
const NUM_ROWS = 8;
const NUM_COLUMNS = 12;

function subscribeToResize(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}

function getViewportHeight() {
  return window.innerHeight;
}

function computeRowHeight(numRows: number, viewportHeight: number): number {
  const available = viewportHeight - HEADER_HEIGHT - FOOTER_HEIGHT;
  return Math.floor((available - MARGIN[1] * (numRows + 1)) / numRows);
}

export function Dashboard({ onToggleDrawer }: { onToggleDrawer: () => void }) {
  const items = useStore(layout);
  const installed = useStore(plugins);
  const { width: containerWidth, containerRef, mounted } = useContainerWidth({ measureBeforeMount: true });
  const viewportHeight = useSyncExternalStore(subscribeToResize, getViewportHeight);
  const rowHeight = computeRowHeight(NUM_ROWS, viewportHeight);

  const [modalOpen, setModalOpen] = useState<BoxItem>();

  const actualNumRows = useMemo(
    () => items.reduce((max, item) => Math.max(max, item.y + item.h), 1),
    [items],
  );

  const placeholders = useMemo(
    () => computePlaceholders(items, Math.max(actualNumRows, NUM_ROWS), NUM_COLUMNS),
    [items, actualNumRows],
  );

  const syncLayout = (current: Layout) => {
    const boxMap = new Map(items.map((item) => [item.i, item]));
    const active = current
      .filter((item) => !isPlaceholder(item))
      .map(({ i, x, y, w, h }) => ({ i, x, y, w, h, plugin: boxMap.get(i)?.plugin }) as BoxItem);
    setLayout(active);
  };

  const handleSelectPlugin = useCallback(
    (plugin: PluginInfo) => {
      const item = modalOpen!;
      if (isPlaceholder(item)) {
        addBox({ i: randomId(), x: item.x, y: item.y, w: item.w, h: item.h, plugin: plugin.id });
      } else {
        setBoxPlugin(item.i, plugin.id);
      }
      setModalOpen(undefined);
    },
    [modalOpen],
  );

  const renderDashboardPanel = (item: BoxItem) => {
    const plugin = item.plugin ? installed.find((p) => p.id === item.plugin) : undefined;
    return (
      <DashboardPanel
        key={item.i}
        title={plugin?.name}
        onClose={() => removeBox(item.i)}
        onEdit={() => setModalOpen(item)}
      >
        {item.plugin && !plugin ? (
          <div className="dashboard-panel-empty">
            Plugin not found
            <button type="button" data-size="sm" onClick={() => setModalOpen(item)}>
              Select plugin
            </button>
          </div>
        ) : plugin ? (
          <PluginHost plugin={plugin} />
        ) : (
          <div className="dashboard-panel-empty">
            <button type="button" data-size="sm" onClick={() => setModalOpen(item)}>
              Select plugin
            </button>
          </div>
        )}
      </DashboardPanel>
    );
  };

  const placeholderElements = useMemo(
    () =>
      placeholders.map((item) => (
        <Placeholder
          key={item.i}
          item={item}
          containerWidth={containerWidth}
          cols={NUM_COLUMNS}
          rowHeight={rowHeight}
          onClick={() => setModalOpen(item)}
        />
      )),
    [placeholders, containerWidth, rowHeight],
  );

  return (
    <div className="dashboard">
      <DashboardHeader onToggleDrawer={onToggleDrawer} />
      <div className="dashboard-grid-wrapper" ref={containerRef}>
        {mounted && (
          <div className="dashboard-grid-container">
            <GridLayout
              className="dashboard-grid"
              width={containerWidth}
              layout={items}
              gridConfig={{ cols: NUM_COLUMNS, rowHeight, margin: MARGIN }}
              compactor={{ ...noCompactor, allowOverlap: false, preventCollision: true }}
              dragConfig={{ handle: ".dashboard-panel-header" }}
              onDragStop={(current) => syncLayout(current)}
              onResizeStop={(current) => syncLayout(current)}
            >
              {items.map((item) => renderDashboardPanel(item))}
            </GridLayout>
            {placeholderElements}
          </div>
        )}
      </div>
      <DashboardFooter />
      {modalOpen && (
        <PluginPicker onClose={() => setModalOpen(undefined)} onSelect={handleSelectPlugin} />
      )}
    </div>
  );
}
