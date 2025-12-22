import React, { useEffect, useState } from 'react';

export default function RightPanel({ selectedCompany = 'Apple Inc.' }) {
  const [predictions, setPredictions] = useState([]);
  const [selectedCompanyFdi, setSelectedCompanyFdi] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/history?limit=100');
        if (!res.ok) return;
        const j = await res.json();
        if (Array.isArray(j.history)) {
          const grouped = {};
          let selectedCompanyLatest = null;
          
          j.history.forEach((h) => {
            const companyName = h.payload?.company || 'Unknown';
            const ticker = h.payload?.ticker || 'Unknown';
            // Track selected company's FDI
            if (companyName === selectedCompany && !selectedCompanyLatest) {
              selectedCompanyLatest = h;
            }
            // Group by company
            if (!grouped[companyName]) {
              grouped[companyName] = {
                company: companyName,
                ticker,
                fdi: h.fdi,
                risk: h.risk,
                confidence: h.confidence,
                count: 0
              };
            }
            grouped[companyName].count += 1;
          });
          
          if (mounted) {
            setSelectedCompanyFdi(selectedCompanyLatest);
            setPredictions(Object.values(grouped).slice(0, 6));
          }
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => (mounted = false);
  }, [selectedCompany]);

  const getRiskColor = (risk) => {
    if (!risk) return '#4fd1c5';
    if (risk === 'Healthy') return '#4fd1c5';
    if (risk === 'Distressed') return '#ef4444';
    return '#fbbf24';
  };

  return (
    <aside className="right-panel">
      <div className="panel-header">
        <h3>Selected Company</h3>
        <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#8b94a1' }}>{selectedCompany}</p>
      </div>

      {selectedCompanyFdi && (
        <div style={{ padding: '16px', background: 'rgba(79, 209, 197, 0.08)', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(79, 209, 197, 0.2)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: 11, color: '#8b94a1', textTransform: 'uppercase', letterSpacing: '0.3px' }}>FDI Score</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginTop: '4px' }}>{((selectedCompanyFdi.fdi || 0) * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#8b94a1', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Risk Status</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: '6px', color: getRiskColor(selectedCompanyFdi.risk) }}>
                {selectedCompanyFdi.risk || 'Unknown'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#8b94a1', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Model Confidence</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#4fd1c5', marginTop: '6px' }}>
                {selectedCompanyFdi.confidence != null ? `${Math.round(selectedCompanyFdi.confidence * 100)}%` : '—'}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '12px', height: '6px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, (selectedCompanyFdi.fdi || 0) * 100)}%`,
                backgroundColor: getRiskColor(selectedCompanyFdi.risk),
                borderRadius: '3px'
              }}
            />
          </div>
        </div>
      )}

      <div style={{ marginBottom: '12px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: 12, fontWeight: 600, color: '#9aa6b2', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Portfolio Overview</h4>
      </div>

      <div className="predictions-list">
        {predictions.length === 0 ? (
          <div style={{ color: '#8f9aa1', padding: 16, fontSize: 13 }}>No predictions yet</div>
        ) : (
          predictions.map((p, idx) => (
            <div key={idx} className="prediction-item">
              <div className="prediction-ticker">{p.company || `Company ${idx}`}</div>
              <div className="prediction-bar">
                <div
                  className="prediction-bar-fill"
                  style={{
                    width: `${Math.min(100, (p.fdi || 0) * 100)}%`,
                    backgroundColor: getRiskColor(p.risk),
                  }}
                ></div>
              </div>
              <div className="prediction-values">
                <span className="prediction-fdi">{((p.fdi || 0) * 100).toFixed(0)}%</span>
                <span className={`prediction-risk risk-${(p.risk || 'Unknown').toLowerCase()}`}>{p.risk || 'Unknown'}</span>
                <span className="prediction-confidence">
                  {p.confidence != null ? `${Math.round(p.confidence * 100)}%` : '—'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
