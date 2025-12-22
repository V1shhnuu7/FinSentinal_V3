import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import KPICardEnhanced from '../components/KPICardEnhanced';
import MainChart from '../components/MainChart';
import RightPanel from '../components/RightPanel';
import ModelInterpretation from '../components/ModelInterpretation';
// import InputForm from '../components/InputForm';
import AssetLiabilityChart from '../components/AssetLiabilityChart';
import RiskComparisonChart from '../components/RiskComparisonChart';
import Companies from './Companies';
import Predictions from './Predictions';
import Sentiment from './Sentiment';
import Footer from '../components/Footer';

const COMPANY_TO_TICKER = {
  'Apple Inc.': 'AAPL',
  'Microsoft Corp.': 'MSFT',
  'NVIDIA Corp.': 'NVDA',
  'Meta Platforms': 'META',
  'Amazon.com Inc.': 'AMZN',
  'Tesla Inc.': 'TSLA',
  'Google (Alphabet)': 'GOOGL',
  'Netflix Inc.': 'NFLX',
};

const TICKER_TO_COMPANY = Object.fromEntries(Object.entries(COMPANY_TO_TICKER).map(([company, ticker]) => [ticker, company]));

const DEFAULT_SENTIMENT = 68;
const DEFAULT_VOLATILITY = 14.2;

function pickFirst(obj, keys) {
  if (!obj) return undefined;
  for (const k of keys) {
    if (k in obj && obj[k] !== null && obj[k] !== undefined) return obj[k];
  }
  return undefined;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCompany, setSelectedCompany] = useState('Apple Inc.');

  const [fdi, setFdi] = useState(null);
  const [risk, setRisk] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [historySnapshot, setHistorySnapshot] = useState([]);
  const [features, setFeatures] = useState([]);
  const [samples, setSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState(null);
  const [prefill, setPrefill] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPrediction = useCallback(async (payload = {}) => {
    setLoading(true);
    setError(null);
    try {
      // Add company info to payload
      const payloadWithCompany = { ...payload, company: selectedCompany };
      
      const res = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadWithCompany)
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(`HTTP ${res.status}${txt ? ` - ${txt}` : ''}`);
      }

      const json = await res.json().catch(async () => {
        const txt = await res.text().catch(() => null);
        throw new Error(`Invalid JSON response${txt ? `: ${txt}` : ''}`);
      });

      // try several possible field names for FDI, label, and confidence
      const fdiVal = pickFirst(json, ['fdi_score', 'fdi', 'score', 'prediction', 'value']);
      const riskVal = pickFirst(json, ['risk_label', 'label', 'risk', 'prediction_label']);
      const confVal = pickFirst(json, ['confidence', 'model_confidence', 'probability', 'prob']);

      setFdi(fdiVal ?? null);
      setRisk(riskVal ?? null);
      setConfidence(confVal ?? null);
    } catch (err) {
      setError(err.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]);

  // When company changes, fetch its latest prediction from history
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/history?limit=100');
        if (!res.ok) return;
        const data = await res.json();
        const history = data.history || [];
        if (mounted) {
          setHistorySnapshot(history);
        }
        
        // Find latest prediction for selected company (check payload for ticker match)
        for (const pred of history) {
          const companyName = pred.payload?.company || '';
          const ticker = pred.payload?.ticker || '';
          if (companyName.toLowerCase().includes(selectedCompany.toLowerCase()) || 
              selectedCompany.toLowerCase().includes(ticker.toLowerCase())) {
            if (mounted) {
              setFdi(pred.fdi);
              setRisk(pred.risk);
              setConfidence(pred.confidence);
            }
            return;
          }
        }
        
        // If no history found, fetch a default prediction
        if (mounted && history.length > 0) {
          const latest = history[0];
          setFdi(latest.fdi);
          setRisk(latest.risk);
          setConfidence(latest.confidence);
        }
      } catch (err) {
        // ignore
      }
    })();
    return () => (mounted = false);
  }, [selectedCompany]);

  // fetch feature schema so we can render a dynamic form
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch('/features');
        if (!r.ok) return;
        const j = await r.json();
        if (mounted && Array.isArray(j.features)) setFeatures(j.features.slice(0, 24));
      } catch (e) {
        // ignore; form will be empty
      }
    })();

    // also fetch a short sample list for quick autofill
    (async () => {
      try {
        const r = await fetch('/samples?limit=20');
        if (!r.ok) return;
        const j = await r.json();
        if (mounted && Array.isArray(j.samples)) setSamples(j.samples || []);
      } catch (e) {
        // ignore
      }
    })();
    return () => (mounted = false);
  }, []);

  const companyHistory = useMemo(() => {
    if (!historySnapshot.length || !selectedCompany) return [];
    const normalized = selectedCompany.toLowerCase();
    const targetTicker = (COMPANY_TO_TICKER[selectedCompany] || '').toLowerCase();
    return historySnapshot.filter((entry) => {
      const companyName = (entry.payload?.company || '').toLowerCase();
      const ticker = (entry.payload?.ticker || '').toLowerCase();
      const nameMatch = companyName && (companyName.includes(normalized) || normalized.includes(companyName));
      const tickerMatch = targetTicker && ticker && ticker === targetTicker;
      return nameMatch || tickerMatch;
    });
  }, [historySnapshot, selectedCompany]);

  const sentimentScore = useMemo(() => {
    const recent = (companyHistory.length ? companyHistory : historySnapshot).slice(-8);
    if (recent.length) {
      const avg = recent.reduce((sum, record) => sum + (record.confidence ?? record.fdi ?? DEFAULT_SENTIMENT / 100), 0) / recent.length;
      return Math.round(avg * 100);
    }
    if (confidence != null) return Math.round(Number(confidence) * 100);
    if (fdi != null) return Math.round(Number(fdi) * 100);
    return DEFAULT_SENTIMENT;
  }, [companyHistory, historySnapshot, confidence, fdi]);

  const sentimentTrend = useMemo(() => {
    const source = companyHistory.length ? companyHistory : historySnapshot;
    if (source.length < 2) return '+0.0%';
    const latest = (source[source.length - 1]?.confidence ?? source[source.length - 1]?.fdi ?? 0) * 100;
    const prev = (source[source.length - 2]?.confidence ?? source[source.length - 2]?.fdi ?? 0) * 100;
    const delta = latest - prev;
    const prefix = delta >= 0 ? '+' : '';
    return `${prefix}${delta.toFixed(1)}%`;
  }, [companyHistory, historySnapshot]);

  const sentimentStatus = useMemo(() => {
    if (!Number.isFinite(sentimentScore)) return 'Moderate Risk';
    if (sentimentScore >= 70) return 'Stable';
    if (sentimentScore >= 50) return 'Moderate Risk';
    return 'High Risk';
  }, [sentimentScore]);

  const volatilityScore = useMemo(() => {
    const source = companyHistory.length ? companyHistory : historySnapshot;
    if (source.length < 2) return DEFAULT_VOLATILITY;
    const recent = source.slice(-8).map((record) => record.fdi ?? 0);
    if (!recent.length) return DEFAULT_VOLATILITY;
    const mean = recent.reduce((sum, value) => sum + value, 0) / recent.length;
    const variance = recent.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / recent.length;
    return Number((Math.sqrt(variance) * 100).toFixed(1));
  }, [companyHistory, historySnapshot]);

  const volatilityTrend = useMemo(() => {
    const source = companyHistory.length ? companyHistory : historySnapshot;
    if (source.length < 2) return '+0.0%';
    const latest = (source[source.length - 1]?.fdi ?? 0) * 100;
    const baselineValues = source.slice(-6, -1).map((record) => (record.fdi ?? 0) * 100);
    const baseline = baselineValues.length
      ? baselineValues.reduce((sum, value) => sum + value, 0) / baselineValues.length
      : latest;
    const delta = latest - baseline;
    const prefix = delta >= 0 ? '+' : '';
    return `${prefix}${delta.toFixed(1)}%`;
  }, [companyHistory, historySnapshot]);

  const volatilityStatus = useMemo(() => {
    if (!Number.isFinite(volatilityScore)) return 'Moderate Risk';
    if (volatilityScore < 12) return 'Stable';
    if (volatilityScore < 20) return 'Moderate Risk';
    return 'High Risk';
  }, [volatilityScore]);

  const confidencePercent = useMemo(() => {
    if (confidence != null && !Number.isNaN(Number(confidence))) return Math.round(Number(confidence) * 100);
    if (fdi != null && !Number.isNaN(Number(fdi))) return Math.round(Number(fdi) * 100);
    return null;
  }, [confidence, fdi]);

  const confidenceStatus = useMemo(() => {
    if (confidencePercent == null) return 'Moderate Risk';
    if (confidencePercent >= 80) return 'Stable';
    if (confidencePercent >= 60) return 'Moderate Risk';
    return 'High Risk';
  }, [confidencePercent]);

  const fdiTrend = useMemo(() => {
    if (companyHistory.length < 2) return null;
    const latest = companyHistory[companyHistory.length - 1]?.fdi;
    const prev = companyHistory[companyHistory.length - 2]?.fdi;
    if (latest == null || prev == null) return null;
    const delta = (latest - prev) * 100;
    const prefix = delta >= 0 ? '+' : '';
    return `${prefix}${delta.toFixed(1)} pts`;
  }, [companyHistory]);

  const getRiskStatus = (r) => {
    if (!r) return null;
    if (r === 'Healthy') return 'Stable';
    if (r === 'Distressed') return 'High Risk';
    return 'Moderate Risk';
  };

  if (activeTab !== 'dashboard') {
    return (
      <div className="app-shell">
        <TopNav selectedCompany={selectedCompany} onCompanyChange={setSelectedCompany} />
        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="main-content-layout">
            {activeTab === 'companies' && <Companies />}
            {activeTab === 'predictions' && <Predictions />}
            {activeTab === 'sentiment' && <Sentiment />}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <TopNav selectedCompany={selectedCompany} onCompanyChange={setSelectedCompany} />

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="main-content-layout">
          <section className="main-section">
            {/* KPI Cards Row */}
            <div className="kpi-grid">
              <KPICardEnhanced
                title="Financial Distress Index"
                value={fdi != null ? `${(fdi * 100).toFixed(0)}` : '—'}
                unit="%"
                status={getRiskStatus(risk)}
                change={fdiTrend || undefined}
              />
              <KPICardEnhanced
                title="AI Sentiment Score"
                value={Number.isFinite(sentimentScore) ? sentimentScore : '—'}
                unit="%"
                change={sentimentTrend}
                status={sentimentStatus}
              />
              <KPICardEnhanced
                title="Model Confidence"
                value={confidencePercent != null ? confidencePercent : '—'}
                unit="%"
                status={confidenceStatus}
              />
              <KPICardEnhanced
                title="Market Volatility"
                value={Number.isFinite(volatilityScore) ? volatilityScore.toFixed(1) : '—'}
                unit="%"
                change={volatilityTrend}
                status={volatilityStatus}
              />
            </div>

            {/* Chart */}
            <section className="chart-area">
              <MainChart selectedCompany={selectedCompany} />
            </section>

            {/* Input Section */}
            <section className="input-section">
              <div className="section-header">
                <h3>Make a Prediction</h3>
                <p className="section-subtitle">Select a sample or enter features manually</p>
              </div>

              {error && <div style={{ color: '#ff7676', marginBottom: 12, padding: 12, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 6 }}>Error: {error}</div>}

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <label style={{ color: '#9aa6b2', fontSize: 13 }}>
                  Prefill sample:
                  <select
                    value={selectedSample ?? ''}
                    onChange={async (e) => {
                      const v = e.target.value;
                      setSelectedSample(v);
                      if (!v) {
                        setPrefill({});
                        return;
                      }
                      try {
                        // Find the sample to get ticker
                        const sample = samples.find(s => String(s.id) === v);
                        if (sample && sample.ticker) {
                          const companyName = TICKER_TO_COMPANY[sample.ticker] || sample.ticker;
                          setSelectedCompany(companyName);
                        }

                        const res = await fetch('/preprocess', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ sample_id: Number(v) })
                        });
                        if (!res.ok) return;
                        const j = await res.json();
                        if (j && j.features) {
                          setPrefill(j.features);
                        }
                      } catch (err) {
                        // ignore
                      }
                    }}
                    style={{ marginLeft: 8, padding: 6, borderRadius: 6, background: 'transparent', color: '#e6eef3', border: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <option value="">— select sample —</option>
                    {samples.map((s) => (
                      <option key={s.id} value={s.id}>{`${s.id} — ${s.ticker} ${s.year}`}</option>
                    ))}
                  </select>
                </label>
                <button
                  onClick={() => fetchPrediction()}
                  disabled={loading}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: 'transparent',
                    border: '1px solid rgba(79, 209, 197, 0.3)',
                    color: '#4fd1c5',
                    fontSize: 12,
                    marginLeft: 'auto'
                  }}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </section>

            {/* Bottom cards */}
            <div className="bottom-cards-grid">
              <div className="card-placeholder">
                <AssetLiabilityChart selectedCompany={selectedCompany} />
              </div>

              <div className="card-placeholder">
                <RiskComparisonChart />
              </div>
            </div>
          </section>

          <RightPanel selectedCompany={selectedCompany} />
        </main>
      </div>

      <section className="interpretation-section">
        <ModelInterpretation company={selectedCompany} fdi={fdi || 0.28} />
      </section>
      <Footer />
    </div>
  );
}
