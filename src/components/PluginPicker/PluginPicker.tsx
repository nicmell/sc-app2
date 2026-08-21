import { Button } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { PluginList } from "@/components/PluginList";
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
    <Modal
      onClose={onClose}
      title="Select plugin"
      actions={<Button variant="ghost" label="Cancel" onClick={onClose} />}
    >
      <PluginList onSelect={onSelect} />
    </Modal>
  );
}
