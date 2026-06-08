import { installDebugLog } from "./utils/debugLog";
import "@sc-app/ui-foundation";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initEnv } from "./env";
import { registerScElements } from "./sc-elements";
import { startSession } from "./state/session";

// Mirror console output into the in-app debug log (footer drawer) before any
// other module logs, so boot-time messages are captured too.
installDebugLog();

async function bootstrap(): Promise<void> {
  // Resolve the HTTP base URL once, before anything fetches or connects
  // (browser: relative; Tauri: http://127.0.0.1:<port> via the get_env IPC).
  await initEnv();

  // Define the plugin custom elements + open the session before first render so
  // injected plugin HTML upgrades and the elements have a live session to read.
  registerScElements();
  startSession();

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();
