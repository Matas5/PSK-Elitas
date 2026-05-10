import { useEffect, useState } from "react";
import { getHealthStatus } from "./api/healthApi";
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/Login"; // Import the Login component

function App() {
  const [status, setStatus] = useState("Loading...");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHealthStatus()
      .then((data) => setStatus(data))
      .catch(() => setStatus("Backend not reachable"));

    // Check if user is logged in
    const authUrl = import.meta.env.VITE_AUTH_URL || "http://localhost:3000";
    fetch(`${authUrl}/user`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Risk Monitor</h1>
      <p>Backend status: {status}</p>

      {user ? (
        <div>
          <p>Welcome, {user.displayName}! ({user.email})</p>
          <a
            href={`${import.meta.env.VITE_AUTH_URL || "http://localhost:3000"}/logout`}
            style={{ padding: "10px 20px", backgroundColor: "#ff6b6b", color: "white", textDecoration: "none", borderRadius: "4px" }}
          >
            Logout
          </a>
        </div>
      ) : (
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />{" "}
            {/* Route for the Login page */}
          </Routes>
        </Router>
      )}
    </main>
  );
}

export default App;
