import { useEffect, useState } from "react";
import { ConnectionOverlay } from "@/components/ConnectionOverlay";
import { Dashboard } from "@/components/Dashboard";
import { Drawer } from "@/components/Drawer";
import { ToastStack } from "@/components/ToastStack";
import { refreshPlugins } from "@/stores/plugins";
import { session } from "@/stores/session";
import styles from "./App.module.scss";

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load the installed-plugin registry from the Rust router on mount.
  useEffect(() => {
    void refreshPlugins();
  }, []);

  // The drawer is a top-layer modal <dialog>, which paints above the
  // ConnectionOverlay's z-indexed "connecting" scrim — close it when the
  // session leaves "connected" so reconnect feedback is never hidden behind
  // an open drawer (the error state's own Modal is top-layer and handles
  // itself).
  useEffect(
    () =>
      session.status.subscribe((status) => {
        if (status !== "connected") setDrawerOpen(false);
      }),
    [],
  );

  return (
    <div className={styles.app}>
      <Dashboard onToggleDrawer={() => setDrawerOpen((open) => !open)} />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <ToastStack />
      <ConnectionOverlay />
    </div>
  );
}

export default App;
