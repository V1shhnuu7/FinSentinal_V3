import React, { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend);

export default function MainChart({ selectedCompany }) {
  const [history, setHistory] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const mountedRef = useRef(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/history?limit=100');
      if (!res.ok) return;
      const j = await res.json();
      if (Array.isArray(j.history)) {
        setHistory(j.history);
        setLastUpdated(new Date());
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchHistory();
    const id = setInterval(() => {
      if (mountedRef.current) fetchHistory();
    }, 5000);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, []);

  // Filter by selected company if provided
  const filtered = selectedCompany
    ? history.filter(h => {
        const name = h.payload?.company || '';
        const ticker = h.payload?.ticker || '';
        return (
          name.toLowerCase().includes(selectedCompany.toLowerCase()) ||
          selectedCompany.toLowerCase().includes(ticker.toLowerCase())
        );
      })
    : history;

  const labels = filtered.map((_, i) => `#${i+1}`);
  const data = {
    labels,
    datasets: [
      {
        label: 'FDI',
        data: filtered.map((h) => h.fdi),
        fill: true,
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260);
          gradient.addColorStop(0, 'rgba(79,209,197,0.35)');
          gradient.addColorStop(1, 'rgba(79,209,197,0.01)');
          return gradient;
        },
        borderColor: 'rgba(79,209,197,0.98)',
        borderWidth: 3.5,
        tension: 0.5,
        pointRadius: 2.5,
        pointBackgroundColor: '#4fd1c5',
        pointBorderColor: '#fff',
        pointHoverRadius: 7,
        shadowOffsetX: 0,
        shadowOffsetY: 2,
        shadowBlur: 10,
        shadowColor: 'rgba(79,209,197,0.18)',
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    scales: {
      x: {
        display: false,
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'FDI Score',
          color: '#8b94a1',
          font: { size: 12, weight: 'bold' },
        },
        ticks: { color: '#9aa6b2', font: { size: 10 }, callback: v => `${Math.round(v * 100)}%` },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
    },
    plugins: {
      legend: { display: true, labels: { color: '#4fd1c5', font: { size: 12 } } },
      tooltip: {
        backgroundColor: 'rgba(15, 20, 25, 0.95)',
        titleColor: '#fff',
        bodyColor: '#e6eef3',
        borderColor: 'rgba(79, 209, 197, 0.3)',
        borderWidth: 1,
        callbacks: {
          label: (ctx) => `FDI: ${(ctx.parsed.y * 100).toFixed(1)}%`,
        },
      },
    },
    animation: { duration: 1200, easing: 'easeInOutCubic' },
  };

  return (
    <div className="chart-card" style={{ height: 320, background: 'rgba(26,34,54,0.96)', borderRadius: 16, boxShadow: '0 2px 16px rgba(79,209,197,0.07)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 style={{ margin: 0, color: '#4fd1c5', fontWeight: 700, letterSpacing: 1 }}>FDI Trend</h3>
      </div>
      <div style={{ height: 260 }}>
        {filtered.length === 0 ? (
          <div style={{ color: '#8f9aa1', padding: 24 }}>No data for this company yet — make a prediction to populate the chart.</div>
        ) : (
          <Line data={data} options={options} />
        )}
      </div>
    </div>
  );
}
