import StrudelConsole from "./ui/StrudelConsole";
import OscConsole from "./ui/OscConsole";
import ScopeView from "./ui/ScopeView";
import { SessionProvider, useScopeChunkRef } from "./state/SessionContext";
import "./App.css";

/** Master-out waveform strip; renders the canvas once the scope is live. */
function ScopeStrip() {
  const chunkRef = useScopeChunkRef();
  return (
    <section className="scope-strip">{chunkRef && <ScopeView chunkRef={chunkRef} />}</section>
  );
}

function App() {
  // The session (worker connection + reactive stores) is owned by the provider;
  // the consoles + scope read status / log / chunks through the session context.
  return (
    <SessionProvider>
      <div className="app">
        <StrudelConsole />
        <ScopeStrip />
        <OscConsole />
      </div>
    </SessionProvider>
  );
}

export default App;
