import { useRef, useState } from "react";
import { Button, Alert, Empty, Stack, Cluster } from "@/components/ui";
import { useStore } from "@/stores/useStore";
import { plugins, uploadPlugin, deletePlugin } from "@/stores/plugins";
import type { PluginInfo } from "@/types/api";
import "./PluginList.scss";

/** Installed-plugin list. With `onSelect` it's a picker (click to choose);
 *  otherwise it's the manager (upload + delete). */
export function PluginList({ onSelect }: { onSelect?: (p: PluginInfo) => void }) {
  const installed = useStore(plugins);
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
    <Stack>
      {installed.length === 0 && <Empty>No plugins installed yet.</Empty>}
      {installed.map((p) => (
        <Cluster key={p.id} className="plugin-row">
          {onSelect ? (
            <button type="button" className="plugin-pick" onClick={() => onSelect(p)}>
              <span className="plugin-name">{p.name}</span>
              <span className="plugin-meta">v{p.version}</span>
            </button>
          ) : (
            <span className="plugin-info">
              <span className="plugin-name">{p.name}</span>
              <span className="plugin-meta">
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
              onClick={() => void deletePlugin(p.id)}
            />
          )}
        </Cluster>
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
      {error && <Alert variant="error">{error}</Alert>}
    </Stack>
  );
}
