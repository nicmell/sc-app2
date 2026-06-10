import { PluginList } from "./PluginList";
import type { PluginInfo } from "@/types/api";

/** Modal to pick which installed plugin fills a grid cell. */
export function PluginPicker({
  onSelect,
  onClose,
}: {
  onSelect: (p: PluginInfo) => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header>Select plugin</header>
        <PluginList onSelect={onSelect} />
        <div className="cluster modal-actions">
          <button type="button" data-variant="ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
