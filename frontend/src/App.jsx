import React, { useState } from 'react';
import HelloWorld from './components/HelloWorld';
import RiskIndicatorList from './components/RiskIndicatorList';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('hello');

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="nav-title">Risk Monitor System</h1>
          <ul className="nav-links">
            <li>
              <button
                className={currentView === 'hello' ? 'active' : ''}
                onClick={() => setCurrentView('hello')}
              >
                Hello World
              </button>
            </li>
            <li>
              <button
                className={currentView === 'indicators' ? 'active' : ''}
                onClick={() => setCurrentView('indicators')}
              >
                Risk Indicators
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <main className="main-content">
        {currentView === 'hello' && <HelloWorld />}
        {currentView === 'indicators' && <RiskIndicatorList />}
      </main>
    </div>
  );
}

export default App;
