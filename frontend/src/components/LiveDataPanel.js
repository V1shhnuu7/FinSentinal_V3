import React, { useState } from 'react';

export default function LiveDataPanel({ selectedCompany, onDataFetched, onUseLiveData }) {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLiveData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/fetch-live-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: selectedCompany })
      });

      const data = await res.json();
      
      if (data.success) {
        setLiveData(data.data);
        if (onDataFetched) {
          onDataFetched(data.data);
        }
      } else {
        setError(data.message || 'Failed to fetch live data');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const mapLiveDataToFeatures = () => {
    if (!liveData || !onUseLiveData) return;
    
    // Map to the NEW model's 14 features (after retraining)
    // Model expects specific financial ratios from training data
    
    // Convert API decimals to proper format
    const roaPercent = (liveData.roa || 0.05) * 100; // API decimal to percentage
    const debtRatio = (liveData.debt_to_equity || 0.5) * 100; // Convert to percentage
    const operatingMargin = liveData.operating_margin || 0.15;
    const profitMargin = liveData.profit_margin || 0.10;
    
    // Calculate derived metrics from balance sheet
    const totalAssets = liveData.total_assets || 1000000000;
    const totalLiabilities = liveData.total_liabilities || 500000000;
    const currentLiabilities = totalLiabilities * 0.4; // Estimate
    const retainedEarnings = (totalAssets - totalLiabilities) * 0.6; // Estimate
    const workingCapital = (liveData.current_ratio || 1.5) * currentLiabilities - currentLiabilities;
    
    const netWorthToAssets = (totalAssets - totalLiabilities) / totalAssets;
    const cashFlowRate = liveData.free_cash_flow && liveData.total_revenue && liveData.total_revenue > 0
      ? liveData.free_cash_flow / liveData.total_revenue
      : 0.10;
    
    const features = {
      // NEW model's 14 features (exact names with spaces)
      ' ROA(A) before interest and % after tax': roaPercent,
      ' Debt ratio %': debtRatio,
      ' Net worth/Assets': netWorthToAssets,
      ' Current Ratio': liveData.current_ratio || 1.5,
      ' Operating Gross Margin': operatingMargin,
      ' Realized Sales Gross Margin': profitMargin,
      ' Cash flow rate': cashFlowRate,
      ' Operating Expense Rate': 1 - operatingMargin, // Inverse of margin
      ' Interest-bearing debt interest rate': 0.05, // Default 5%
      ' Current Liability to Assets': currentLiabilities / totalAssets,
      ' Retained Earnings to Total Assets': retainedEarnings / totalAssets,
      ' Total debt/Total net worth': totalLiabilities / (totalAssets - totalLiabilities),
      ' Working Capital to Total Assets': workingCapital / totalAssets,
      ' Current Liability to Current Assets': currentLiabilities / (currentLiabilities * (liveData.current_ratio || 1.5)),
      
      // Metadata
      'ticker': liveData.ticker,
      'company': liveData.company,
    };
    
    console.log('Live data mapped to NEW 14 features:', features);
    onUseLiveData(features);
  };

  const formatValue = (value, type = 'number') => {
    if (value === null || value === undefined || value === 0) return 'N/A';
    
    if (type === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(value);
    }
    
    if (type === 'percentage') {
      return `${(value * 100).toFixed(2)}%`;
    }
    
    if (type === 'ratio') {
      return value.toFixed(2);
    }
    
    return value.toLocaleString();
  };

  const getStatusColor = (label, value) => {
    // Color coding based on financial health indicators
    if (label.includes('Ratio') && value) {
      if (value > 2) return '#5de4c7'; // Good
      if (value > 1) return '#fbbf24'; // Moderate
      return '#ef4444'; // Poor
    }
    if (label.includes('Margin') && value) {
      if (value > 0.15) return '#5de4c7';
      if (value > 0.05) return '#fbbf24';
      return '#ef4444';
    }
    return 'var(--text)';
  };

  return (
    <div className="live-data-panel">
      <div className="panel-header">
        <div>
          <h4>📡 Live Financial Data</h4>
          <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
            {liveData ? `Last updated: ${new Date(liveData.last_updated).toLocaleTimeString()}` : 'Real-time data from Yahoo Finance'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {liveData && onUseLiveData && (
            <button 
              onClick={mapLiveDataToFeatures}
              className="refresh-btn"
              style={{ 
                background: 'linear-gradient(135deg, rgba(122, 168, 255, 0.15), rgba(122, 168, 255, 0.08))',
                borderColor: 'rgba(122, 168, 255, 0.3)',
                color: '#7aa8ff'
              }}
              title="Use this live data for prediction"
            >
              ✓ Use for Prediction
            </button>
          )}
          <button 
            onClick={fetchLiveData} 
            disabled={loading}
            className="refresh-btn"
            title="Fetch latest financial data"
          >
            {loading ? (
              <>
                <span className="loading-spinner" style={{ width: '14px', height: '14px', marginRight: '6px' }}></span>
                Fetching...
              </>
            ) : (
              <>🔄 Fetch Live Data</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{
          padding: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#ef4444',
          fontSize: '12px',
          marginTop: '12px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {!liveData && !loading && !error && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
          Click "Fetch Live Data" to load real-time financial metrics
        </div>
      )}

      {liveData && (
        <div className="live-data-grid">
          <div className="data-section">
            <h5 className="section-title">Market Data</h5>
            <div className="data-row">
              <span className="data-label">Current Price</span>
              <span className="data-value">{formatValue(liveData.current_price, 'currency')}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Market Cap</span>
              <span className="data-value">{formatValue(liveData.market_cap, 'currency')}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Beta (Volatility)</span>
              <span className="data-value">{formatValue(liveData.beta, 'ratio')}</span>
            </div>
            <div className="data-row">
              <span className="data-label">52W High</span>
              <span className="data-value">{formatValue(liveData.fifty_two_week_high, 'currency')}</span>
            </div>
            <div className="data-row">
              <span className="data-label">52W Low</span>
              <span className="data-value">{formatValue(liveData.fifty_two_week_low, 'currency')}</span>
            </div>
          </div>

          <div className="data-section">
            <h5 className="section-title">Valuation Ratios</h5>
            <div className="data-row">
              <span className="data-label">P/E Ratio</span>
              <span className="data-value">{formatValue(liveData.pe_ratio, 'ratio')}</span>
            </div>
            <div className="data-row">
              <span className="data-label">P/B Ratio</span>
              <span className="data-value">{formatValue(liveData.pb_ratio, 'ratio')}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Debt to Equity</span>
              <span className="data-value" style={{ color: getStatusColor('Debt', liveData.debt_to_equity) }}>
                {formatValue(liveData.debt_to_equity, 'ratio')}
              </span>
            </div>
          </div>

          <div className="data-section">
            <h5 className="section-title">Liquidity</h5>
            <div className="data-row">
              <span className="data-label">Current Ratio</span>
              <span className="data-value" style={{ color: getStatusColor('Current Ratio', liveData.current_ratio) }}>
                {formatValue(liveData.current_ratio, 'ratio')}
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">Quick Ratio</span>
              <span className="data-value" style={{ color: getStatusColor('Quick Ratio', liveData.quick_ratio) }}>
                {formatValue(liveData.quick_ratio, 'ratio')}
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">Total Cash</span>
              <span className="data-value">{formatValue(liveData.total_cash, 'currency')}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Total Debt</span>
              <span className="data-value">{formatValue(liveData.total_debt, 'currency')}</span>
            </div>
          </div>

          <div className="data-section">
            <h5 className="section-title">Profitability</h5>
            <div className="data-row">
              <span className="data-label">Profit Margin</span>
              <span className="data-value" style={{ color: getStatusColor('Profit Margin', liveData.profit_margin) }}>
                {formatValue(liveData.profit_margin, 'percentage')}
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">Operating Margin</span>
              <span className="data-value" style={{ color: getStatusColor('Operating Margin', liveData.operating_margin) }}>
                {formatValue(liveData.operating_margin, 'percentage')}
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">ROE</span>
              <span className="data-value">{formatValue(liveData.roe, 'percentage')}</span>
            </div>
            <div className="data-row">
              <span className="data-label">ROA</span>
              <span className="data-value">{formatValue(liveData.roa, 'percentage')}</span>
            </div>
          </div>

          <div className="data-section">
            <h5 className="section-title">Growth</h5>
            <div className="data-row">
              <span className="data-label">Revenue Growth</span>
              <span className="data-value">{formatValue(liveData.revenue_growth, 'percentage')}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Earnings Growth</span>
              <span className="data-value">{formatValue(liveData.earnings_growth, 'percentage')}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Total Revenue</span>
              <span className="data-value">{formatValue(liveData.total_revenue, 'currency')}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Free Cash Flow</span>
              <span className="data-value">{formatValue(liveData.free_cash_flow, 'currency')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
