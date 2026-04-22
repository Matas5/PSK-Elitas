import React from 'react';
import RiskIndicatorList from './components/RiskIndicatorList';
import './App.css';

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="nav-title">Risk Monitor System</h1>
        </div>
      </nav>

      <main className="main-content">
        <RiskIndicatorList />
      </main>
    </div>
  );
}

export default App;
