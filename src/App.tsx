import StrudelConsole from "./strudel/StrudelConsole";
import OscConsole from "./strudel/OscConsole";
import { SessionProvider } from "./state/SessionContext";
import "./App.css";

function App() {
  // The session (worker connection + reactive stores) is owned by the provider;
  // the two consoles read status / log / send through the session context.
  return (
    <SessionProvider>
      <div className="app">
        <StrudelConsole />
        <OscConsole />
      </div>
    </SessionProvider>
  );
}

export default App;
