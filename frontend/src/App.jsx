import { useEffect, useState } from "react";
import { getHealthStatus } from "./api/healthApi";

function App() {
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    getHealthStatus()
        .then((data) => setStatus(data))
        .catch(() => setStatus("Backend not reachable"));
  }, []);

  return (
      <main style={{ padding: "2rem", fontFamily: "Arial" }}>
        <h1>Risk Monitor</h1>
        <p>Backend status: {status}</p>
      </main>
  );
}

export default App;