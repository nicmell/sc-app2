import { useState } from "react";
import "./App.css";

function App() {
  const [serverMsg, setServerMsg] = useState("");

  async function pingServer() {
    // Hits the HTTP server (Vite proxies /api to it in dev).
    try {
      const res = await fetch("/api/hello");
      const { message } = (await res.json()) as { message: string };
      setServerMsg(message);
    } catch (err) {
      setServerMsg(`Request failed: ${String(err)}`);
    }
  }

  return (
    <main className="container">
      <h1>sc-app2</h1>
      <button type="button" onClick={pingServer}>
        Ping server
      </button>
      <p>{serverMsg}</p>
    </main>
  );
}

export default App;
