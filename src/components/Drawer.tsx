// The generic drawer wrapper is imported aliased so this app-level component can
// keep the `Drawer` name.
import { Button, Drawer as BaseDrawer } from "@/components/ui";
import { PluginList } from "./PluginList";
import "./Drawer.scss";

/** Right-side slide-in drawer for managing installed plugins. A top-layer
 *  <sc-base-drawer> (native <dialog>): backdrop, focus trap, and Esc are free. */
export function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BaseDrawer open={open} side="right" dismissable label="Plugins" onClose={onClose}>
      <header>
        <h2>Plugins</h2>
        <Button variant="ghost" size="sm" iconOnly icon="x" label="Close" onClick={onClose} />
      </header>
      <div className="sc-drawer__body">
        <PluginList />
      </div>
    </BaseDrawer>
  );
}
