import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function RiskComparisonChart() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/history?limit=200');
        if (!res.ok) return;
        const data = await res.json();
        const history = data.history || [];

        // Group by company and get latest FDI for each
        const companyFdiMap = {};
        history.forEach((h) => {
          const company = h.payload?.company || 'Unknown';
          if (!companyFdiMap[company]) {
            companyFdiMap[company] = h.fdi * 100; // Convert to percentage
          }
        });

        // Sort by company name
        const companies = Object.keys(companyFdiMap).sort();
        const fdiScores = companies.map(c => companyFdiMap[c]);

        if (mounted && companies.length > 0) {
          setChartData({
            labels: companies.map(c => c.replace(' Inc.', '').replace(' Corp.', '').replace(' Platforms', '')),
            datasets: [
              {
                label: 'FDI Score (%)',
                data: fdiScores,
                backgroundColor: fdiScores.map((score) => {
                  if (score < 40) return 'rgba(79,209,197,0.85)'; // Healthy (cyan)
                  if (score < 70) return 'rgba(251,191,36,0.85)'; // Moderate (yellow)
                  return 'rgba(239,68,68,0.85)'; // Distressed (red)
                }),
                borderRadius: 12,
                borderSkipped: false,
              },
            ],
          });
        }
      } catch (e) {
        console.error('Failed to fetch FDI data:', e);
      }
    })();
    return () => (mounted = false);
  }, []);

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 20, 25, 0.9)',
        titleColor: '#fff',
        bodyColor: '#e6eef3',
        borderColor: 'rgba(79, 209, 197, 0.3)',
        borderWidth: 1,
        callbacks: {
          label: (ctx) => `${ctx.parsed.x}%`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#8b94a1',
          font: { size: 9 },
          callback: (value) => `${value}%`,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.04)',
          drawBorder: false,
        },
      },
      y: {
        ticks: {
          color: '#9aa6b2',
          font: { size: 9 },
        },
        grid: {
          display: false,
          drawBorder: false,
        },
      },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minHeight: 0 }}>
      <div style={{ flexShrink: 0 }}>
        <h4 style={{ margin: '0 0 2px 0', fontSize: 11, fontWeight: 600, color: '#fff' }}>Company Risk Comparison</h4>
        <p style={{ margin: 0, fontSize: 10, color: '#8b94a1' }}>FDI scores across portfolio</p>
      </div>
      {chartData && (
        <div style={{ flex: 1, minHeight: 0 }}>
          <Bar data={chartData} options={options} />
        </div>
      )}
    </div>
  );
}
