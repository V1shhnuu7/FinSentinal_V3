import React from 'react';

export default function KPICardEnhanced({ title, value, unit = '', change = null, status = null, icon = null, color = '#4fd1c5' }) {
  const getRiskColor = (s) => {
    if (!s) return '#4fd1c5';
    if (s === 'Low Risk' || s === 'Stable') return '#4fd1c5';
    if (s === 'Moderate' || s === 'Moderate Risk') return '#fbbf24';
    if (s === 'High Risk') return '#ef4444';
    return '#4fd1c5';
  };

  const barColor = getRiskColor(status);

  return (
    <div className="kpi-card-enhanced">
      <div className="kpi-header">
        <div className="kpi-title-row">
          <h4 className="kpi-title">{title}</h4>
        </div>
        {status && <span className={`kpi-status status-${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>}
      </div>

      <div className="kpi-value">
        {value}
        {unit && <span className="kpi-unit">{unit}</span>}
      </div>

      {change && (
        <div className={`kpi-change ${change.startsWith('+') ? 'positive' : 'negative'}`}>
          {change}
        </div>
      )}

      <div className="kpi-bar">
        <div className="kpi-bar-fill" style={{ width: `${Math.min(100, parseFloat(value) || 0)}%`, backgroundColor: barColor }}></div>
      </div>
    </div>
  );
}
