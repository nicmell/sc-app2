import { useRef, useState } from "react";
import { generatePath, useNavigate, useParams } from "react-router";
import { Button, Alert, Empty, Flex } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { useStore } from "@/stores/useStore";
import { plugins, uploadPlugin, deletePlugin } from "@/stores/plugins";
import type { PluginInfo } from "@/types/api";
import styles from "./PluginList.module.scss";

/** Installed-plugin list. With `onSelect` it's a picker (click to choose);
 *  otherwise it's the manager (upload + delete). */
export function PluginList({ onSelect }: { onSelect?: (p: PluginInfo) => void }) {
  const installed = useStore(plugins);
  const sessionId = useParams().sessionId!;
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      await uploadPlugin(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    e.target.value = "";
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
            <Flex gap="xs">
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon="pencil-simple"
                label={`Edit ${p.name}`}
                onClick={() =>
                  void navigate(
                    generatePath(ROUTES.SESSION_PLUGIN_EDIT, { sessionId, pluginId: p.id }),
                  )
                }
              />
              <Button
                variant="danger"
                size="sm"
                iconOnly
                icon="x"
                label={`Remove ${p.name}`}
                onClick={() => void deletePlugin(p.id)}
              />
            </Flex>
          )}
        </Flex>
      ))}

      {!onSelect && (
        <>
          <input ref={fileRef} type="file" accept=".zip" hidden onChange={(e) => void onFile(e)} />
          <Flex gap="xs">
            <Button
              variant="secondary"
              icon="plus"
              label="Create plugin"
              onClick={() =>
                void navigate(generatePath(ROUTES.SESSION_PLUGIN_NEW, { sessionId }))
              }
            />
            <Button
              variant="secondary"
              label="Add plugin…"
              onClick={() => fileRef.current?.click()}
            />
          </Flex>
        </>
      )}
      {error && <Alert variant="error">{error}</Alert>}
    </Flex>
  );
}
