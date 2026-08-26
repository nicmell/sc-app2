import { useRef, useState } from "react";
import { Button, Alert, Empty, Flex } from "@/components/ui";
import { HttpError } from "@/lib/http";
import { plugins, uploadPlugin, deletePlugin } from "@/stores/plugins";
import { pushToast } from "@/stores/toasts";
import { useStore } from "@/stores/useStore";
import type { PluginInfo } from "@/types/api";
import styles from "./PluginList.module.scss";

/** Installed-plugin list. With `onSelect` it's a picker (click to choose);
 *  otherwise it's the manager (upload + delete). */
export function PluginList({ onSelect }: { onSelect?: (p: PluginInfo) => void }) {
  const installed = useStore(plugins);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<Error | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      await uploadPlugin(file);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
    e.target.value = "";
  };

  const onDelete = async (p: PluginInfo) => {
    try {
      await deletePlugin(p.id);
    } catch (err) {
      pushToast({
        variant: "error",
        message: `failed to remove ${p.name}: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  };

  return (
    <Flex orientation="vertical" gap="xs">
      {installed.length === 0 && <Empty>No plugins installed yet.</Empty>}
      {installed.map((p) => (
        <Flex justify="space-between" align="center" gap="xs" key={p.id} className={styles.row}>
          {onSelect ? (
            <button type="button" className={styles.pick} onClick={() => onSelect(p)}>
              <span className="plugin-name">{p.name}</span>
              <span className={styles.meta}>v{p.version}</span>
            </button>
          ) : (
            <span className={styles.info}>
              <span className="plugin-name">{p.name}</span>
              <span className={styles.meta}>
                {p.author} · v{p.version}
              </span>
            </span>
          )}
          {!onSelect && (
            <Button
              variant="danger"
              size="sm"
              iconOnly
              icon="x"
              label={`Remove ${p.name}`}
              onClick={() => void onDelete(p)}
            />
          )}
        </Flex>
      ))}

      {!onSelect && (
        <>
          <input ref={fileRef} type="file" accept=".zip" hidden onChange={(e) => void onFile(e)} />
          <Button
            variant="secondary"
            label="Add plugin…"
            onClick={() => fileRef.current?.click()}
          />
        </>
      )}
      {error && (
        <Alert variant="error">
          {error.message}
          {error instanceof HttpError && error.violations && (
            <ul className={styles.violations}>
              {error.violations.map((violation) => (
                <li key={violation.message}>{violation.message}</li>
              ))}
            </ul>
          )}
        </Alert>
      )}
    </Flex>
  );
}
