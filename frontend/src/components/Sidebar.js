import React from 'react';

export default function Sidebar({ activeTab = 'dashboard', onTabChange }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'companies', label: 'Companies', icon: '🏢' },
    { id: 'predictions', label: 'Predictions', icon: '📈' },
    { id: 'sentiment', label: 'Sentiment', icon: '💬' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">FinSentinal <span style={{color:'#4fd1c5', fontWeight:600, fontSize:'0.9em'}}>FDEWS</span></div>
      </div>

      <nav className="sidebar-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange && onTabChange(tab.id)}
            title={tab.label}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <small>v1.0</small>
      </div>
    </aside>
  );
}
