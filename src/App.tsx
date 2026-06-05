import { useEffect, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { Drawer } from "./components/Drawer";
import { refreshPlugins } from "./state/plugins";
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
    </div>
  );
}

export default App;
