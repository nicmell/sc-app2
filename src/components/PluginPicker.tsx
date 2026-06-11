import { Modal } from "@/components/ui/Modal";
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
    <Modal onClose={onClose}>
      <header>Select plugin</header>
      <PluginList onSelect={onSelect} />
      <div className="cluster modal-actions">
        <button type="button" data-variant="ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
