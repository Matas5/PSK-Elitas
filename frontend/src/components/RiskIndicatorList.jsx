import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import './RiskIndicatorList.css';

function RiskIndicatorList() {
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIndicators();
  }, []);

  const fetchIndicators = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllRiskIndicators();
      setIndicators(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch risk indicators');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'GREEN':
        return '#4CAF50';
      case 'YELLOW':
        return '#FFC107';
      case 'RED':
        return '#F44336';
      default:
        return '#999';
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="risk-indicator-list">
      <h2>Risk Indicators</h2>
      {indicators.length === 0 ? (
        <p>No risk indicators yet. Create one to get started!</p>
      ) : (
        <table className="indicators-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Current Value</th>
              <th>Yellow Threshold</th>
              <th>Red Threshold</th>
              <th>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {indicators.map((indicator) => (
              <tr key={indicator.id}>
                <td>{indicator.name}</td>
                <td>{indicator.currentValue}</td>
                <td>{indicator.yellowThreshold}</td>
                <td>{indicator.redThreshold}</td>
                <td>
                  <span
                    className="risk-level-badge"
                    style={{ backgroundColor: getRiskLevelColor(indicator.riskLevel) }}
                  >
                    {indicator.riskLevel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button onClick={fetchIndicators} className="refresh-btn">Refresh</button>
    </div>
  );
}

export default RiskIndicatorList;
