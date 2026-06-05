import { PluginList } from "./PluginList";

/** Right-side slide-in drawer for managing installed plugins. */
export function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <div className="drawer-backdrop" onClick={onClose} />}
      <aside className="drawer" data-open={open} aria-hidden={!open}>
        <header className="drawer-header">
          <h2>Plugins</h2>
          <button type="button" data-variant="ghost" data-size="sm" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="drawer-body">
          <PluginList />
        </div>
      </aside>
    </>
  );
}
