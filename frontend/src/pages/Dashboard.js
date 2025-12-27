import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import KPICardEnhanced from '../components/KPICardEnhanced';
import MainChart from '../components/MainChart';
import RightPanel from '../components/RightPanel';
import ModelInterpretation from '../components/ModelInterpretation';
import RecentActivity from '../components/RecentActivity';
import FeatureImportance from '../components/FeatureImportance';
import LiveDataPanel from '../components/LiveDataPanel';
import Toast from '../components/Toast';
// import InputForm from '../components/InputForm';
import AssetLiabilityChart from '../components/AssetLiabilityChart';
import RiskComparisonChart from '../components/RiskComparisonChart';
import Companies from './Companies';
import Predictions from './Predictions';
import Sentiment from './Sentiment';
import Footer from '../components/Footer';
import { exportDashboardToPDF, exportHistoryToCSV } from '../utils/exportUtils';

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
  
  // SHAP explainability state
  const [shapData, setShapData] = useState(null);
  const [shapLoading, setShapLoading] = useState(false);
  
  // Live data state
  const [liveData, setLiveData] = useState(null);
  
  // Toast notification state
  const [toast, setToast] = useState(null);

  const fetchPrediction = useCallback(async (payload = {}) => {
    setLoading(true);
    setError(null);
    try {
      // If no payload provided, try to use prefill or fetch a sample for the company
      let dataToUse = payload;
      if (Object.keys(payload).length === 0 && Object.keys(prefill).length > 0) {
        dataToUse = prefill;
      }
      
      // Add company info to payload
      const payloadWithCompany = { ...dataToUse, company: selectedCompany };
      
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
      
      // Update prefill with the payload used
      setPrefill(payloadWithCompany);
      
    } catch (err) {
      setError(err.message || 'Failed to fetch');
      setToast({
        message: `⚠️ Error: ${err.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, prefill]);

  // Fetch SHAP explanation for current prediction
  const fetchExplanation = useCallback(async () => {
    if (Object.keys(prefill).length === 0) {
      setToast({
        message: '⚠️ Please select a sample from the dropdown below, then click "Predict & Explain"',
        type: 'info'
      });
      return;
    }
    
    setShapLoading(true);
    try {
      const payload = { ...prefill, company: selectedCompany };
      console.log('Fetching SHAP explanation with payload:', payload);
      
      const res = await fetch('/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.warn('SHAP request failed:', res.status, data);
        
        let errorMsg = 'SHAP explanation not available.';
        if (res.status === 503) {
          errorMsg = '⚠️ SHAP is not installed on the backend. Contact admin.';
        } else if (data.message) {
          errorMsg = `⚠️ ${data.message}`;
        } else if (data.error) {
          errorMsg = `⚠️ ${data.error}`;
        }
        
        setToast({
          message: errorMsg,
          type: 'error'
        });
        setShapData(null);
        return;
      }

      const data = await res.json();
      console.log('SHAP data received:', data);
      setShapData(data);
      
      setToast({
        message: '✅ Feature importance analysis complete! Scroll down to view.',
        type: 'success'
      });
      
      // Auto-scroll to SHAP section after a short delay
      setTimeout(() => {
        const shapSection = document.querySelector('.feature-importance-card');
        if (shapSection) {
          shapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    } catch (err) {
      console.error('Failed to fetch explanation:', err);
      setToast({
        message: `⚠️ Failed to get explanation: ${err.message}`,
        type: 'error'
      });
      setShapData(null);
    } finally {
      setShapLoading(false);
    }
  }, [prefill, selectedCompany]);

  // Handle live data fetched
  const handleLiveDataFetched = useCallback((data) => {
    setLiveData(data);
    console.log('Live data fetched:', data);
  }, []);

  // Handle using live data for prediction
  const handleUseLiveData = useCallback(async (features) => {
    // Merge live features into existing prefill so we keep any required fields the model expects
    const merged = {
      ...prefill,
      ...features,
      ticker: COMPANY_TO_TICKER[selectedCompany] || features.ticker,
      company: selectedCompany,
    };

    setPrefill(merged);

    // Auto-trigger prediction with merged payload
    await fetchPrediction(merged);

    setToast({
      message: '✅ Live data loaded! Prediction and SHAP will use real-time metrics.',
      type: 'success'
    });
  }, [fetchPrediction, prefill, selectedCompany]);

  // When company changes, fetch its latest prediction from history and sample data
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
              // Load the payload to prefill for this company
              if (pred.payload) {
                setPrefill(pred.payload);
              }
            }
            return;
          }
        }
        
        // If no history found, try to load a sample for this company
        const samplesRes = await fetch('/samples?limit=50');
        if (!samplesRes.ok) return;
        const samplesData = await samplesRes.json();
        const companySamples = samplesData.samples || [];
        
        // Find a sample matching the company
        const ticker = COMPANY_TO_TICKER[selectedCompany];
        console.log(`Looking for sample with ticker ${ticker} for company ${selectedCompany}`);
        const matchingSample = companySamples.find(s => s.ticker === ticker);
        
        if (matchingSample && mounted) {
          console.log(`Found matching sample:`, matchingSample);
          // Load this sample
          const preprocessRes = await fetch('/preprocess', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sample_id: matchingSample.id })
          });
          if (preprocessRes.ok) {
            const preprocessData = await preprocessRes.json();
            if (preprocessData.features) {
              setPrefill(preprocessData.features);
              setSelectedSample(String(matchingSample.id));
            }
          }
        }
        
      } catch (err) {
        // ignore
      }
    })();    
    // Auto-load a matching sample for the selected company
    (async () => {
      try {
        const res = await fetch('/samples?limit=100');
        if (!res.ok) return;
        const data = await res.json();
        const samples = data.samples || [];
        
        // Extract ticker from company name (e.g., "Apple Inc." -> "AAPL")
        const companyTicker = selectedCompany.split(' ')[0].toUpperCase();
        const tickerMap = {
          'APPLE': 'AAPL',
          'MICROSOFT': 'MSFT',
          'AMAZON.COM': 'AMZN',
          'GOOGLE': 'GOOGL',
          'TESLA': 'TSLA',
          'NETFLIX': 'NFLX',
          'META': 'META',
          'NVIDIA': 'NVDA'
        };
        
        const ticker = tickerMap[companyTicker] || companyTicker;
        
        // Find first matching sample by ticker
        const matchingSample = samples.find(s => s.ticker === ticker);
        
        if (matchingSample && mounted) {
          setPrefill(matchingSample.payload || {});
          setSelectedSample(matchingSample.id);
          console.log(`Auto-loaded sample for ${selectedCompany}:`, matchingSample.id);
        }
      } catch (err) {
        console.error('Failed to auto-load sample:', err);
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
            {/* Export Actions */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => exportDashboardToPDF(selectedCompany, fdi, risk, confidence)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, rgba(93, 228, 199, 0.15), rgba(93, 228, 199, 0.08))',
                  border: '1px solid rgba(93, 228, 199, 0.3)',
                  color: '#5de4c7',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.background = 'linear-gradient(135deg, rgba(93, 228, 199, 0.25), rgba(93, 228, 199, 0.15))'}
                onMouseOut={(e) => e.target.style.background = 'linear-gradient(135deg, rgba(93, 228, 199, 0.15), rgba(93, 228, 199, 0.08))'}
                title="Export current dashboard as PDF report"
              >
                📊 Export PDF
              </button>
              <button
                onClick={() => exportHistoryToCSV(historySnapshot, selectedCompany)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, rgba(122, 168, 255, 0.15), rgba(122, 168, 255, 0.08))',
                  border: '1px solid rgba(122, 168, 255, 0.3)',
                  color: '#7aa8ff',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.background = 'linear-gradient(135deg, rgba(122, 168, 255, 0.25), rgba(122, 168, 255, 0.15))'}
                onMouseOut={(e) => e.target.style.background = 'linear-gradient(135deg, rgba(122, 168, 255, 0.15), rgba(122, 168, 255, 0.08))'}
                title="Download prediction history as CSV"
              >
                💾 Export CSV
              </button>
            </div>

            {/* KPI Cards Row */}
            <div className="kpi-grid">
              <KPICardEnhanced
                title="Financial Distress Index"
                value={fdi != null ? `${(fdi * 100).toFixed(0)}` : '—'}
                unit="%"
                status={getRiskStatus(risk)}
                change={fdiTrend || undefined}
                tooltip="Probability of financial distress. Higher values indicate greater risk."
              />
              <KPICardEnhanced
                title="AI Sentiment Score"
                value={Number.isFinite(sentimentScore) ? sentimentScore : '—'}
                unit="%"
                change={sentimentTrend}
                status={sentimentStatus}
                tooltip="Aggregated sentiment from recent predictions. Reflects overall financial health."
              />
              <KPICardEnhanced
                title="Model Confidence"
                value={confidencePercent != null ? confidencePercent : '—'}
                unit="%"
                status={confidenceStatus}
                tooltip="How confident the AI model is in its prediction. Higher is better."
              />
              <KPICardEnhanced
                title="Market Volatility"
                value={Number.isFinite(volatilityScore) ? volatilityScore.toFixed(1) : '—'}
                unit="%"
                change={volatilityTrend}
                status={volatilityStatus}
                tooltip="Measure of FDI fluctuations over recent predictions. Lower is more stable."
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
                <button
                  onClick={async () => {
                    // Use prefill data if available
                    const dataToUse = Object.keys(prefill).length > 0 ? prefill : {};
                    if (Object.keys(dataToUse).length === 0) {
                      setToast({
                        message: '⚠️ Please select a sample from "Prefill sample" dropdown below ⬇️',
                        type: 'info'
                      });
                      return;
                    }
                    await fetchPrediction(dataToUse);
                    setTimeout(() => fetchExplanation(), 800);
                  }}
                  disabled={loading || shapLoading}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, rgba(122, 168, 255, 0.15), rgba(122, 168, 255, 0.08))',
                    border: '1px solid rgba(122, 168, 255, 0.3)',
                    color: '#7aa8ff',
                    fontSize: 12,
                    fontWeight: 600
                  }}
                  title="Predict and explain with SHAP"
                >
                  {loading || shapLoading ? '\u23f3 Processing...' : '\ud83e\uddee Predict & Explain'}
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

            {/* Recent Activity Log */}
            <RecentActivity limit={8} />
            
            {/* SHAP Feature Importance */}
            <FeatureImportance 
              featureData={shapData} 
              onRefresh={fetchExplanation}
              loading={shapLoading}
            />
            
            {/* Live Financial Data */}
            <LiveDataPanel 
              selectedCompany={selectedCompany}
              onDataFetched={handleLiveDataFetched}
              onUseLiveData={handleUseLiveData}
            />
          </section>

          <RightPanel selectedCompany={selectedCompany} />
        </main>
      </div>

      <section className="interpretation-section">
        <ModelInterpretation company={selectedCompany} fdi={fdi || 0.28} />
      </section>
      <Footer />
      
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
