import { installDebugLog } from "./utils/debugLog";
import "@sc-app/ui-foundation";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { registerScElements } from "./sc-elements";
import { startSession } from "./state/session";

// Mirror console output into the in-app debug log (footer drawer) before any
// other module logs, so boot-time messages are captured too.
installDebugLog();

// Define the plugin custom elements + open the session before first render so
// injected plugin HTML upgrades and the elements have a live session to read.
// (The HTTP base URL needs no async resolution: Tauri injects HTTP_BASE_URL
// before any code runs; browsers are same-origin — see src/http.)
registerScElements();
startSession();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
