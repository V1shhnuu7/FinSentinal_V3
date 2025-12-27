import React, { useEffect, useState } from 'react';

export default function RecentActivity({ limit = 10 }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/history?limit=${limit}`);
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && data.history) {
          setActivities(data.history.slice(0, limit));
        }
      } catch (err) {
        console.error('Failed to fetch activity:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [limit]);

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getRiskLabel = (risk) => {
    if (typeof risk === 'string') return risk;
    if (risk > 0.7) return 'High Risk';
    if (risk > 0.4) return 'Moderate';
    return 'Low Risk';
  };

  const getRiskColor = (risk) => {
    const label = getRiskLabel(risk);
    if (label.includes('Low')) return '#5de4c7';
    if (label.includes('Moderate')) return '#fbbf24';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="activity-log">
        <h4>📊 Recent Activity</h4>
        <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '20px', textAlign: 'center' }}>
          Loading recent predictions...
        </div>
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="activity-log">
        <h4>📊 Recent Activity</h4>
        <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '20px', textAlign: 'center' }}>
          No recent activity found
        </div>
      </div>
    );
  }

  return (
    <div className="activity-log">
      <h4>📊 Recent Activity</h4>
      {activities.map((activity, idx) => {
        const company = activity.payload?.company || 'Unknown';
        const ticker = activity.payload?.ticker || '';
        const fdi = activity.fdi ? `${(activity.fdi * 100).toFixed(0)}%` : 'N/A';
        const riskColor = getRiskColor(activity.risk);
        
        return (
          <div key={idx} className="activity-item" style={{ borderLeftColor: riskColor }}>
            <div>
              <span className="activity-company">{company}</span>
              {ticker && <span style={{ color: '#6b7280', marginLeft: '6px' }}>({ticker})</span>}
              <span style={{ margin: '0 8px', color: '#4b5563' }}>·</span>
              <span style={{ color: riskColor }}>FDI: {fdi}</span>
            </div>
            <span className="activity-time">{formatTime(activity.ts)}</span>
          </div>
        );
      })}
    </div>
  );
}
