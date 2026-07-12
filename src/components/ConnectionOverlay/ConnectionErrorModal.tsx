import { Button, Flex } from "@/components/ui";
import { Modal, modalStyles } from "@/components/ui/Modal";

export function ConnectionErrorModal({ onRetry }: { onRetry: () => void }) {
  return (
    <Modal label="Connection failed">
      <h2 className={modalStyles.title}>Connection failed</h2>
      <p className={modalStyles.body}>
        The session could not be established — the server or scsynth may be down.
      </p>
      <Flex wrap align="center" gap="xs" className={modalStyles.actions}>
        <Button label="Retry" onClick={onRetry} />
      </Flex>
    </Modal>
  );
}
