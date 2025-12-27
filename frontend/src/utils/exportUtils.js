// Export Dashboard to PDF without external dependencies
// Uses browser's built-in print functionality

export const exportDashboardToPDF = (selectedCompany, fdi, risk, confidence) => {
  // Create a new window with formatted content
  const printWindow = window.open('', '', 'width=800,height=600');
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const fdiValue = fdi ? (fdi * 100).toFixed(0) : 'N/A';
  const confValue = confidence ? (confidence * 100).toFixed(0) : 'N/A';
  const riskLabel = typeof risk === 'string' ? risk : 'Unknown';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>FinSentinal Report - ${selectedCompany}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Arial', sans-serif;
          padding: 40px;
          background: white;
          color: #1a1a1a;
        }
        .header {
          border-bottom: 3px solid #5de4c7;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          font-size: 28px;
          color: #1a1a1a;
          margin-bottom: 8px;
        }
        .header .subtitle {
          font-size: 14px;
          color: #666;
        }
        .meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 8px;
        }
        .meta-item {
          font-size: 13px;
        }
        .meta-label {
          color: #666;
          margin-bottom: 4px;
        }
        .meta-value {
          font-weight: bold;
          color: #1a1a1a;
        }
        .metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .metric-card {
          border: 1px solid #ddd;
          padding: 20px;
          border-radius: 8px;
          background: #fafafa;
        }
        .metric-title {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 10px;
          letter-spacing: 0.5px;
        }
        .metric-value {
          font-size: 32px;
          font-weight: bold;
          color: #1a1a1a;
        }
        .metric-unit {
          font-size: 18px;
          color: #666;
        }
        .metric-status {
          margin-top: 8px;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          display: inline-block;
        }
        .status-low { background: #d1fae5; color: #065f46; }
        .status-moderate { background: #fef3c7; color: #92400e; }
        .status-high { background: #fee2e2; color: #991b1b; }
        .summary {
          margin-top: 30px;
          padding: 20px;
          background: #f9fafb;
          border-left: 4px solid #5de4c7;
          border-radius: 4px;
        }
        .summary h3 {
          margin-bottom: 12px;
          color: #1a1a1a;
        }
        .summary p {
          color: #4b5563;
          line-height: 1.6;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          color: #999;
          font-size: 11px;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>FinSentinal Financial Distress Report</h1>
        <div class="subtitle">Financial Distress Early Warning System</div>
      </div>

      <div class="meta">
        <div class="meta-item">
          <div class="meta-label">Company</div>
          <div class="meta-value">${selectedCompany}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Report Date</div>
          <div class="meta-value">${currentDate}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Report Type</div>
          <div class="meta-value">FDI Assessment</div>
        </div>
      </div>

      <div class="metrics">
        <div class="metric-card">
          <div class="metric-title">Financial Distress Index</div>
          <div class="metric-value">${fdiValue}<span class="metric-unit">%</span></div>
          <div class="metric-status ${getRiskClass(riskLabel)}">${riskLabel}</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Model Confidence</div>
          <div class="metric-value">${confValue}<span class="metric-unit">%</span></div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Risk Assessment</div>
          <div class="metric-value" style="font-size: 20px; padding-top: 8px;">${riskLabel}</div>
        </div>
      </div>

      <div class="summary">
        <h3>Executive Summary</h3>
        <p>
          Based on our AI-powered financial distress prediction model, <strong>${selectedCompany}</strong> 
          shows a Financial Distress Index of <strong>${fdiValue}%</strong> with a model confidence 
          of <strong>${confValue}%</strong>. The current risk classification is <strong>${riskLabel}</strong>.
        </p>
        <p style="margin-top: 12px;">
          This assessment is based on comprehensive analysis of financial ratios, market indicators, 
          and historical patterns using advanced machine learning algorithms (Random Forest and XGBoost models).
        </p>
      </div>

      <div class="summary" style="margin-top: 20px; border-left-color: #7aa8ff;">
        <h3>Interpretation Guide</h3>
        <p><strong>Low Risk (0-40%):</strong> Strong financial health, low probability of distress</p>
        <p><strong>Moderate Risk (40-70%):</strong> Requires monitoring, some financial pressure indicators</p>
        <p><strong>High Risk (70-100%):</strong> Significant financial distress signals, immediate attention needed</p>
      </div>

      <div class="footer">
        <p>This report was generated by FinSentinal FDEWS (Financial Distress Early Warning System)</p>
        <p>For informational purposes only. Not financial advice.</p>
      </div>

      <div class="no-print" style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()" style="
          padding: 12px 32px;
          background: #5de4c7;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          margin-right: 10px;
        ">Print / Save as PDF</button>
        <button onclick="window.close()" style="
          padding: 12px 32px;
          background: #e5e7eb;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        ">Close</button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

function getRiskClass(riskLabel) {
  if (!riskLabel) return 'status-moderate';
  const lower = riskLabel.toLowerCase();
  if (lower.includes('low')) return 'status-low';
  if (lower.includes('high')) return 'status-high';
  return 'status-moderate';
}

// Export history data to CSV
export const exportHistoryToCSV = (historyData, selectedCompany) => {
  if (!historyData || !historyData.length) {
    alert('No history data to export');
    return;
  }

  const headers = ['Timestamp', 'Company', 'Ticker', 'FDI Score', 'Risk Label', 'Confidence'];
  const rows = historyData.map(record => {
    const company = record.payload?.company || selectedCompany;
    const ticker = record.payload?.ticker || '';
    const fdi = record.fdi ? (record.fdi * 100).toFixed(2) : 'N/A';
    const confidence = record.confidence ? (record.confidence * 100).toFixed(2) : 'N/A';
    
    return [
      record.ts || '',
      company,
      ticker,
      fdi,
      record.risk || 'Unknown',
      confidence
    ].map(val => `"${val}"`).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `finsentinal_history_${selectedCompany.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
