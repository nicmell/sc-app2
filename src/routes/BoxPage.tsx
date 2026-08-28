// The BOX SHELL (/:sessionId/box/:boxId?plugin=<id>) — ONE dashboard box as
// a first-class session client (docs/multi-tab.md): the dashboard's panels
// load this route in iframes, and the same URL popped into its own tab is
// the identical client. Once the shared connection is up the shell claims
// the box (exclusive phase-one ownership — a second client gets the "open
// elsewhere" panel), resolves the plugin from the `plugin` query param (the
// dashboard's live assignment; a freshly added box isn't server-saved yet)
// falling back to the loader's saved boxes for deep links, seeds THIS
// REALM's layout/presets slices (the worker's live cache beats the saved
// data), mounts the one PluginHost, and forwards every harvest to the
// shared worker — the primary (dashboard) client mirrors those into its
// autosaved presets slice.

import { useEffect, useState } from "react";
import { useParams, useRouteLoaderData, useSearchParams } from "react-router";
import { PluginHost } from "@/components/PluginHost";
import { oscClient } from "@/lib/osc/OscClient";
import { useStatus } from "@/stores/session";
import { addBox, layout, setBoxPlugin } from "@/stores/layout";
import { presets, setPresets } from "@/stores/presets";
import type { SessionInfo } from "@/types/api";
import styles from "./BoxPage.module.scss";

type Claim = "pending" | "granted" | "denied";

export function BoxPage() {
  const { boxId } = useParams();
  const [search] = useSearchParams();
  const info = useRouteLoaderData("session") as SessionInfo;
  const status = useStatus();
  const [claim, setClaim] = useState<Claim>("pending");

  const pluginId = search.get("plugin") ?? info.data.boxes.find((box) => box.i === boxId)?.plugin;

  useEffect(() => {
    if (status !== "connected" || !boxId || !pluginId) return;
    let cancelled = false;
    let offHarvest: (() => void) | null = null;
    void (async () => {
      const granted = await oscClient.claimBox(boxId).catch(() => false);
      if (cancelled) {
        if (granted) oscClient.releaseBox(boxId);
        return;
      }
      if (!granted) {
        setClaim("denied");
        return;
      }
      // The worker's live cache is fresher than the saved session data when
      // a sibling harvested since the last autosave.
      const live = await oscClient.getBoxPresets(boxId).catch(() => null);
      const entry = live ?? info.data.presets[boxId];
      // Seed the slices THIS realm's PluginHost reads: the box into the
      // layout (setBoxPresets' membership guard), its values into presets.
      // Layout first — setBoxPlugin prunes presets on a changed assignment.
      if (layout.get().some((box) => box.i === boxId)) {
        setBoxPlugin(boxId, pluginId);
      } else {
        addBox({ i: boxId, x: 0, y: 0, w: 1, h: 1, plugin: pluginId });
      }
      setPresets(entry ? { [boxId]: entry } : {});
      // Forward every harvest (PluginHost writes the local slice) to the
      // worker's live cache; change-only, so the seed itself doesn't echo.
      offHarvest = presets.subscribe((map) => {
        const current = map[boxId];
        if (current) oscClient.putBoxPresets(boxId, current);
      });
      setClaim("granted");
    })();
    return () => {
      cancelled = true;
      offHarvest?.();
      oscClient.releaseBox(boxId);
    };
  }, [status, boxId, pluginId, info]);

  if (!boxId || !pluginId) {
    return <main className={styles.page}>This box has no plugin assigned.</main>;
  }
  if (claim === "denied") {
    return <main className={styles.page}>This box is open in another window.</main>;
  }
  return (
    <main className={styles.page}>
      {claim === "granted" && <PluginHost pluginId={pluginId} boxId={boxId} />}
    </main>
  );
}
