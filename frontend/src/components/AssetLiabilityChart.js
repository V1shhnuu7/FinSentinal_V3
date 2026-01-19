import React, { useEffect, useMemo, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AssetLiabilityChart({ selectedCompany = 'Apple Inc.', liveData = null }) {
  const [chartData, setChartData] = useState(null);
  const [ratio, setRatio] = useState('0.0');
  const [breakdown, setBreakdown] = useState({ assets: 0, liabilities: 0 });
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Check if live data has assets/liabilities
    if (liveData && liveData.total_assets && liveData.total_liabilities) {
      const assets = liveData.total_assets;
      const liabilities = liveData.total_liabilities;
      const computedRatio = ((assets / (assets + liabilities)) * 100).toFixed(1);

      setChartData({
        labels: ['Assets', 'Liabilities'],
        datasets: [
          {
            data: [assets, liabilities],
            backgroundColor: ['#5de4c7', 'rgba(93, 228, 199, 0.3)'],
            borderColor: ['#0f1419', '#0f1419'],
            borderWidth: 2,
          },
        ],
      });
      setRatio(computedRatio);
      setBreakdown({ assets, liabilities });
      setIsLive(true);
      return;
    }

    // Fallback to mock data for asset-to-liability ratio visualization
    const assetLiabilityData = {
      'Apple Inc.': { assets: 352755, liabilities: 120292 },
      'Microsoft Corp.': { assets: 411975, liabilities: 127510 },
      'NVIDIA Corp.': { assets: 82897, liabilities: 24598 },
      'Meta Platforms': { assets: 170098, liabilities: 47891 },
      'Amazon.com Inc.': { assets: 323331, liabilities: 273670 },
      'Tesla Inc.': { assets: 89497, liabilities: 56037 },
      'Google (Alphabet)': { assets: 402392, liabilities: 107674 },
      'Netflix Inc.': { assets: 57793, liabilities: 17827 },
    };

    const data = assetLiabilityData[selectedCompany] || assetLiabilityData['Apple Inc.'];
    const computedRatio = ((data.assets / (data.assets + data.liabilities)) * 100).toFixed(1);

    setChartData({
      labels: ['Assets', 'Liabilities'],
      datasets: [
        {
          data: [data.assets, data.liabilities],
          backgroundColor: ['#4fd1c5', 'rgba(79, 209, 197, 0.3)'],
          borderColor: ['#0f1419', '#0f1419'],
          borderWidth: 2,
        },
      ],
    });
    setRatio(computedRatio);
    setBreakdown({ assets: data.assets, liabilities: data.liabilities });
    setIsLive(false);
  }, [selectedCompany, liveData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#9aa6b2',
          font: { size: 10 },
          padding: 6,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 20, 25, 0.9)',
        titleColor: '#fff',
        bodyColor: '#e6eef3',
        borderColor: 'rgba(79, 209, 197, 0.3)',
        borderWidth: 1,
        callbacks: {
          label: (ctx) => `${ctx.label}: $${(ctx.parsed / 1000).toFixed(0)}B`,
        },
      },
    },
    layout: {
      padding: 0,
    },
  };

  const formatCompact = useMemo(() => new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }), []);

  return (
    <div className="donut-card">
      <div className="donut-card-header">
        <h4>
          Asset-to-Liability Ratio
          {isLive && <span style={{
            marginLeft: '8px',
            padding: '2px 6px',
            fontSize: '9px',
            fontWeight: 600,
            background: 'rgba(93, 228, 199, 0.2)',
            border: '1px solid rgba(93, 228, 199, 0.4)',
            borderRadius: '4px',
            color: '#5de4c7'
          }}>LIVE</span>}
        </h4>
        <p>{selectedCompany}</p>
      </div>
      {chartData && (
        <div className="donut-wrapper">
          <div className="donut-canvas">
            <Doughnut data={chartData} options={options} />
            <div className="donut-center">
              <strong>{ratio}%</strong>
              <span>Assets share</span>
            </div>
          </div>
          <div className="donut-metrics">
            <div className="donut-metric">
              <span className="donut-metric-label">Assets</span>
              <span className="donut-metric-value">${formatCompact.format(breakdown.assets)}</span>
            </div>
            <div className="donut-metric">
              <span className="donut-metric-label">Liabilities</span>
              <span className="donut-metric-value">${formatCompact.format(breakdown.liabilities)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
