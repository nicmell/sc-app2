import { useState } from "react";
import { GridLayout, noCompactor, useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useStore } from "../state/useStore";
import { layout, removeBox, setBoxPlugin, syncGeometry } from "../state/layout";
import { DashboardPanel } from "./DashboardPanel";
import { PluginPicker } from "./PluginPicker";

const COLS = 12;
const ROW_HEIGHT = 80;
const MARGIN: [number, number] = [10, 10];

export function Dashboard() {
  const items = useStore(layout);
  const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: true });
  const [assigning, setAssigning] = useState<string | null>(null);

  return (
    <div className="dashboard" ref={containerRef}>
      {mounted && (
        <GridLayout
          className="dashboard-grid"
          width={width}
          layout={items}
          gridConfig={{ cols: COLS, rowHeight: ROW_HEIGHT, margin: MARGIN }}
          compactor={{ ...noCompactor, allowOverlap: false, preventCollision: true }}
          dragConfig={{ handle: ".panel-header" }}
          onDragStop={syncGeometry}
          onResizeStop={syncGeometry}
        >
          {items.map((box) => (
            <div key={box.i} className="grid-cell">
              <DashboardPanel
                box={box}
                onRemove={() => removeBox(box.i)}
                onAssign={() => setAssigning(box.i)}
              />
            </div>
          ))}
        </GridLayout>
      )}
      {items.length === 0 && (
        <div className="dashboard-empty empty">
          Add a panel, then assign a plugin to it.
        </div>
      )}
      {assigning && (
        <PluginPicker
          onClose={() => setAssigning(null)}
          onSelect={(p) => {
            setBoxPlugin(assigning, p.id);
            setAssigning(null);
          }}
        />
      )}
    </div>
  );
}
