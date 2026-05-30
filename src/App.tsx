import { useState } from "react";
import { isTauri, invoke } from "@tauri-apps/api/core";
import "./App.css";

interface AppConfig {
  port: number;
}

function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [error, setError] = useState("");

  async function loadConfig() {
    // GUI (Tauri): over IPC. Browser/serve: over HTTP, same-origin.
    setError("");
    try {
      const cfg: AppConfig = isTauri()
        ? await invoke("get_config")
        : await (await fetch("/api/config")).json();
      setConfig(cfg);
    } catch (err) {
      setError(`Failed to load config: ${String(err)}`);
    }
  }

  return (
    <main className="container">
      <h1>sc-app2</h1>
      <button type="button" onClick={loadConfig}>
        Load config
      </button>
      {config && <pre>{JSON.stringify(config, null, 2)}</pre>}
      {error && <p>{error}</p>}
    </main>
  );
}

export default App;
