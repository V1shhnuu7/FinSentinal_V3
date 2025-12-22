import React, { useEffect, useMemo, useState } from 'react';

export default function ModelInterpretation({ company = 'Apple Inc.', fdi = 0.28, interpretation = null }) {
  const [modelInfo, setModelInfo] = useState({ version: '', metrics: {}, training_date: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/model-info');
        if (!res.ok) return;
        const j = await res.json();
        setModelInfo(j);
      } catch {}
    })();
  }, []);

  const accuracy = modelInfo.metrics?.accuracy;
  const precision = modelInfo.metrics?.precision;
  const recall = modelInfo.metrics?.recall;
  const f1 = modelInfo.metrics?.f1;

  const formatPercent = (value) => {
    if (typeof value !== 'number') return '—';
    return `${(value * 100).toFixed(1)}%`;
  };

  const reliabilityScore = useMemo(() => {
    const numeric = [accuracy, precision, recall, f1].filter((v) => typeof v === 'number');
    if (!numeric.length) return null;
    return (numeric.reduce((sum, v) => sum + v, 0) / numeric.length) * 100;
  }, [accuracy, precision, recall, f1]);

  const metricBlocks = [
    { label: 'Accuracy', value: formatPercent(accuracy) },
    { label: 'Precision', value: formatPercent(precision) },
    { label: 'Recall', value: formatPercent(recall) },
    { label: 'F1 Score', value: formatPercent(f1) },
    { label: 'Reliability', value: reliabilityScore != null ? `${reliabilityScore.toFixed(1)}%` : '—', hint: 'Avg. of core metrics' },
  ];

  const defaultInterpretation = `${company} currently has a Financial Distress Index of ${(fdi * 100).toFixed(1)}%.\n\nModel Performance:\n- Accuracy: ${accuracy !== undefined ? (accuracy * 100).toFixed(2) + '%' : 'N/A'}\n- Precision: ${precision !== undefined ? (precision * 100).toFixed(2) + '%' : 'N/A'}\n- Recall: ${recall !== undefined ? (recall * 100).toFixed(2) + '%' : 'N/A'}\n- F1 Score: ${f1 !== undefined ? (f1 * 100).toFixed(2) + '%' : 'N/A'}\n\nThe AI model evaluates key financial ratios, trends, and market sentiment to assess risk. All metrics are based on the latest retrained model.`;

  return (
    <div className="model-interpretation-card">
      <div className="card-header">
        <h4>AI Model Interpretation</h4>
      </div>
      <pre className="interpretation-text" style={{whiteSpace:'pre-wrap', fontFamily:'inherit'}}>{interpretation || defaultInterpretation}</pre>
      <div className="model-performance-grid">
        {metricBlocks.map((metric) => (
          <div key={metric.label} className="model-performance-metric">
            <span className="metric-label">{metric.label}</span>
            <strong className="metric-value">{metric.value}</strong>
            {metric.hint && <span className="metric-hint">{metric.hint}</span>}
          </div>
        ))}
      </div>
      <div className="interpretation-metadata">
        <span>Model: RF v{modelInfo.version || '1.0'}</span>
        <span>Trained: {modelInfo.training_date ? new Date(modelInfo.training_date).toLocaleString() : 'Unknown'}</span>
        <span>Samples: {modelInfo.metrics?.train_samples || '-'} train, {modelInfo.metrics?.test_samples || '-'} test</span>
      </div>
    </div>
  );
}
