import React, { useEffect, useState } from 'react';

export default function FeatureImportance({ featureData, onRefresh, loading }) {
  if (!featureData || !featureData.feature_importance) {
    return (
      <div className="feature-importance-card">
        <div className="card-header">
          <h4>🔍 Feature Importance (SHAP)</h4>
          {onRefresh && (
            <button onClick={onRefresh} className="refresh-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner" style={{ width: '14px', height: '14px', marginRight: '6px' }}></span>
                  Analyzing...
                </>
              ) : (
                '↻ Explain'
              )}
            </button>
          )}
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
          {loading ? (
            <div>
              <div className="loading-spinner" style={{ width: '32px', height: '32px', margin: '0 auto 12px' }}></div>
              <p>Analyzing feature importance...</p>
            </div>
          ) : (
            <>
              <p>Click "Explain" to see which features drive predictions</p>
              <p style={{ fontSize: '11px', marginTop: '8px', color: '#6b7280' }}>
                Tip: Make a prediction first, then click Explain
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  const { base_value, prediction, feature_importance, top_features } = featureData;
  const topFeats = top_features || feature_importance.slice(0, 5);

  // Calculate max absolute SHAP value for scaling
  const maxShap = Math.max(...feature_importance.map(f => Math.abs(f.shap_value)));

  return (
    <div className="feature-importance-card">
      <div className="card-header">
        <div>
          <h4>🔍 Feature Importance (SHAP Values)</h4>
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
            Shows which features increase (red) or decrease (blue) predicted risk
          </p>
        </div>
        {onRefresh && (
          <button onClick={onRefresh} className="refresh-btn">
            ↻ Refresh
          </button>
        )}
      </div>

      <div className="shap-summary">
        <div className="shap-metric">
          <span className="shap-label">Base Value</span>
          <span className="shap-value">{(base_value * 100).toFixed(1)}%</span>
        </div>
        <div className="shap-metric">
          <span className="shap-label">Prediction</span>
          <span className="shap-value">{(prediction * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div className="shap-features">
        <h5 style={{ fontSize: '13px', marginBottom: '12px', color: 'var(--text)' }}>
          Top {topFeats.length} Most Influential Features
        </h5>
        
        {topFeats.map((feat, idx) => {
          const barWidth = Math.abs(feat.shap_value) / maxShap * 100;
          const isPositive = feat.shap_value > 0;
          const barColor = isPositive ? '#ef4444' : '#5de4c7';
          
          return (
            <div key={idx} className="shap-feature-item">
              <div className="shap-feature-header">
                <span className="shap-feature-name" title={feat.feature}>
                  {idx + 1}. {formatFeatureName(feat.feature)}
                </span>
                <span className="shap-feature-value" style={{ color: barColor }}>
                  {feat.shap_value > 0 ? '+' : ''}{feat.shap_value.toFixed(3)}
                </span>
              </div>
              <div className="shap-bar-container">
                <div 
                  className="shap-bar" 
                  style={{ 
                    width: `${barWidth}%`,
                    backgroundColor: barColor,
                    opacity: 0.8
                  }}
                />
              </div>
              <div className="shap-feature-meta">
                <span style={{ fontSize: '11px', color: '#6b7280' }}>
                  Value: {feat.original_value.toFixed(2)}
                </span>
                <span style={{ fontSize: '11px', color: barColor }}>
                  {isPositive ? '↑ Increases' : '↓ Decreases'} risk
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {feature_importance.length > 5 && (
        <details className="shap-details">
          <summary style={{ cursor: 'pointer', color: 'var(--accent)', fontSize: '12px', marginTop: '12px' }}>
            Show all {feature_importance.length} features
          </summary>
          <div style={{ marginTop: '12px' }}>
            {feature_importance.slice(5).map((feat, idx) => (
              <div key={idx + 5} style={{ 
                padding: '6px 8px', 
                fontSize: '11px', 
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>{idx + 6}. {formatFeatureName(feat.feature)}</span>
                <span style={{ color: feat.shap_value > 0 ? '#ef4444' : '#5de4c7' }}>
                  {feat.shap_value.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function formatFeatureName(name) {
  // Convert snake_case or abbreviations to readable names
  return name
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .substring(0, 35);
}
