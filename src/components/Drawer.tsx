import { ScButton, ScDrawer } from "@sc-app/ui-components/react";
import { PluginList } from "./PluginList";

/** Right-side slide-in drawer for managing installed plugins. A top-layer
 *  <sc-drawer-base> (native <dialog>): backdrop, focus trap, and Esc are free. */
export function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <ScDrawer open={open} side="right" dismissable onClose={onClose}>
      <header>
        <h2>Plugins</h2>
        <ScButton variant="ghost" size="sm" iconOnly icon="x" label="Close" onClick={onClose} />
      </header>
      <div className="drawer-body">
        <PluginList />
      </div>
    </ScDrawer>
  );
}
