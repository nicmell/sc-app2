import { useEffect, useState } from "react";
import { ConnectionOverlay } from "@/components/ConnectionOverlay";
import { Dashboard } from "@/components/Dashboard";
import { Drawer } from "@/components/Drawer";
import { ToastStack } from "@/components/ToastStack";
import { refreshPlugins } from "@/stores/plugins";
import "./App.css";

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load the installed-plugin registry from the Rust router on mount.
  useEffect(() => {
    void refreshPlugins();
  }, []);

  return (
    <div className="app">
      <Dashboard onToggleDrawer={() => setDrawerOpen((open) => !open)} />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <ToastStack />
      <ConnectionOverlay />
    </div>
  );
}

export default App;
