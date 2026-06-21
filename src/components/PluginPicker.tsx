import { ScButton, ScCluster } from "@sc-app/ui-components/react";
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
    <Modal onClose={onClose} label="Select plugin">
      <header>Select plugin</header>
      <PluginList onSelect={onSelect} />
      <ScCluster className="sc-modal__actions">
        <ScButton variant="ghost" label="Cancel" onClick={onClose} />
      </ScCluster>
    </Modal>
  );
}
