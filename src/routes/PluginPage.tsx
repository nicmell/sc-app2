// Full-screen standalone plugin view (/:sessionId/plugins/:pluginId): an
// <sc-plugin> INDEPENDENT of any dashboard box — the explicit `plugin`
// property resolves it, and the "plugin:<id>" DOM id (disjoint from box-…
// ids) keys its own runtime map, registry tree, and scsynth group, dropped on
// leave exactly like a box unmount. The plugins slice is populated — the
// session loader awaited refreshPlugins().

import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui";
import { plugins } from "@/stores/plugins";
import { useStore } from "@/stores/useStore";
import styles from "./PluginPage.module.scss";

export function PluginPage() {
  const { sessionId, pluginId } = useParams();
  const navigate = useNavigate();
  const info = useStore(plugins).find((plugin) => plugin.id === pluginId);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Button
          variant="ghost"
          size="sm"
          icon="arrow-left"
          label="Back"
          onClick={() => void navigate(`/${sessionId}`)}
        />
        <h1>{info?.name ?? "Plugin not found"}</h1>
      </header>
      <div className={styles.content}>
        {info && pluginId && (
          <sc-plugin key={pluginId} id={`plugin:${pluginId}`} plugin={pluginId} />
        )}
      </div>
    </main>
  );
}
