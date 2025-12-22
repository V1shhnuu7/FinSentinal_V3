import React, { useEffect, useState } from 'react';

export default function Predictions() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/history?limit=100');
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && Array.isArray(data.history)) {
          setHistory(data.history);
        }
      } catch (e) {
        console.error('Failed to load history:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const getRiskColor = (risk) => {
    if (risk === 'Healthy') return '#4fd1c5';
    if (risk === 'Moderate') return '#fbbf24';
    if (risk === 'Distressed') return '#ef4444';
    return '#8b94a1';
  };

  const getRiskLabel = (risk) => {
    if (risk === 'Healthy') return 'Stable';
    if (risk === 'Moderate') return 'Moderate Risk';
    if (risk === 'Distressed') return 'High Risk';
    return 'Unknown';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Prediction History</h1>
        <p>Complete record of all model predictions</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#8b94a1' }}>
          Loading predictions...
        </div>
      ) : history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#8b94a1' }}>
          No predictions available yet
        </div>
      ) : (
        <div className="predictions-table">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Timestamp</th>
                <th>FDI Score</th>
                <th>Risk Status</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {history.map((pred, idx) => {
                const ticker = pred.payload?.ticker || 'Unknown';
                const fdi = pred.fdi || 0;
                const risk = pred.risk || 'Unknown';
                const confidence = pred.confidence || pred.payload?.confidence || '—';

                return (
                  <tr key={idx}>
                    <td className="ticker-cell">
                      <strong>{ticker}</strong>
                    </td>
                    <td className="time-cell">
                      {new Date(pred.ts).toLocaleString()}
                    </td>
                    <td className="fdi-cell">
                      <span className="fdi-badge">{(fdi * 100).toFixed(1)}%</span>
                    </td>
                    <td className="risk-cell">
                      <span
                        className="risk-badge"
                        style={{ color: getRiskColor(risk) }}
                      >
                        {getRiskLabel(risk)}
                      </span>
                    </td>
                    <td className="confidence-cell">
                      {typeof confidence === 'number'
                        ? `${Math.round(confidence * 100)}%`
                        : confidence}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
