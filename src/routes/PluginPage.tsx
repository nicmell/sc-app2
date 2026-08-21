// Full-screen standalone plugin view (/:sessionId/plugins/:pluginId): an
// standalone PluginHost INDEPENDENT of any dashboard box. It owns its runtime
// store, parsed element tree, and scsynth group, dropped on leave exactly like a box
// unmount. The plugins slice is populated — the session loader awaited
// refreshPlugins().

import { generatePath, useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui";
import { PluginHost } from "@/components/PluginHost";
import { ROUTES } from "@/constants/routes";
import { plugins } from "@/stores/plugins";
import { useStore } from "@/stores/useStore";
import styles from "./PluginPage.module.scss";

export function PluginPage() {
  const { sessionId: matchedSessionId, pluginId } = useParams();
  const sessionId = matchedSessionId!;
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
          onClick={() => void navigate(generatePath(ROUTES.SESSION, { sessionId }))}
        />
        <h1>{info?.name ?? "Plugin not found"}</h1>
      </header>
      <div className={styles.content}>
        {info && pluginId && <PluginHost key={pluginId} pluginId={pluginId} />}
      </div>
    </main>
  );
}
