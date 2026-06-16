import { ScButton } from "@sc-app/ui-components/react";
import { PluginList } from "./PluginList";

/** Right-side slide-in drawer for managing installed plugins. */
export function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <div className="drawer-backdrop" onClick={onClose} />}
      <aside className="drawer" data-open={open} aria-hidden={!open}>
        <header className="drawer-header">
          <h2>Plugins</h2>
          <ScButton variant="ghost" size="sm" iconOnly icon="x" label="Close" onClick={onClose} />
        </header>
        <div className="drawer-body">
          <PluginList />
        </div>
      </aside>
    </>
  );
}
