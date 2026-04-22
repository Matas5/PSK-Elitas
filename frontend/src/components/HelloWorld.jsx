import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import './HelloWorld.css';

function HelloWorld() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHelloMessage();
  }, []);

  const fetchHelloMessage = async () => {
    try {
      setLoading(true);
      const data = await apiService.getHelloMessage();
      setMessage(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch hello message from backend');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hello-world">
      <div className="hello-world-card">
        <h1>Risk Monitor System</h1>
        <h2>Hello World Demo</h2>
        
        {loading && <p className="loading">Connecting to backend...</p>}
        {error && <p className="error">{error}</p>}
        {message && (
          <div className="message-box">
            <p className="message-text">Backend says: <strong>{message}</strong></p>
          </div>
        )}
        
        <button onClick={fetchHelloMessage} className="test-btn">
          Test Backend Connection
        </button>
      </div>
    </div>
  );
}

export default HelloWorld;
