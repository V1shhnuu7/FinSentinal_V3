import React, { useEffect, useState } from 'react';

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Static sector/ticker mapping for display
  const companyMeta = {
    'Apple Inc.': { ticker: 'AAPL', sector: 'Technology' },
    'Microsoft Corp.': { ticker: 'MSFT', sector: 'Technology' },
    'NVIDIA Corp.': { ticker: 'NVDA', sector: 'Technology' },
    'Meta Platforms': { ticker: 'META', sector: 'Technology' },
    'Amazon.com Inc.': { ticker: 'AMZN', sector: 'Technology' },
    'Tesla Inc.': { ticker: 'TSLA', sector: 'Automotive' },
    'Google (Alphabet)': { ticker: 'GOOGL', sector: 'Technology' },
    'Netflix Inc.': { ticker: 'NFLX', sector: 'Media' },
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/history?limit=200');
        if (!res.ok) return;
        const data = await res.json();
        const history = data.history || [];
        // Get latest FDI/risk for each company
        const latestByCompany = {};
        history.forEach((h) => {
          const name = h.payload?.company || 'Unknown';
          if (!latestByCompany[name]) {
            latestByCompany[name] = h;
          }
        });
        // Only show tracked companies
        const tracked = Object.keys(companyMeta).map((name) => {
          const meta = companyMeta[name];
          const h = latestByCompany[name] || {};
          return {
            name,
            ticker: meta.ticker,
            sector: meta.sector,
            hasData: h.fdi != null && h.risk != null,
            fdi: h.fdi,
            risk: h.risk,
          };
        });
        if (mounted) setCompanies(tracked);
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

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Companies</h1>
        <p>Financial health overview of tracked organizations</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#8b94a1' }}>Loading...</div>
      ) : (
        <div className="companies-grid">
          {companies.map((company, idx) => (
            <div key={idx} className="company-card">
              <div className="company-header">
                <div className="company-info">
                  <h3 className="company-name">{company.name}</h3>
                  <p className="company-ticker">{company.ticker}</p>
                </div>
                <div className="company-sector">{company.sector}</div>
              </div>

              <div className="company-metrics">
                <div className="metric">
                  <span className="metric-label">FDI Score</span>
                  <span className="metric-value">
                    {company.hasData ? `${(company.fdi * 100).toFixed(1)}%` : '—'}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Status</span>
                  <span className="metric-badge" style={{ color: getRiskColor(company.risk), opacity: company.hasData ? 1 : 0.5 }}>
                    {company.hasData ? company.risk : 'No Data'}
                  </span>
                </div>
              </div>

              <div className="company-bar">
                <div
                  className="company-bar-fill"
                  style={{
                    width: company.hasData ? `${Math.min(100, company.fdi * 100)}%` : '0%',
                    backgroundColor: getRiskColor(company.risk),
                    opacity: company.hasData ? 1 : 0.2,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
