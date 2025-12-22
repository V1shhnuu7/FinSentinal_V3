// NOTE: Sentiment scores are currently static and for demo only. Connect to real sentiment analysis for production.
import React, { useEffect, useState } from 'react';

export default function Sentiment() {
  const [sentimentData] = useState([
    { company: 'Apple Inc.', ticker: 'AAPL', sentiment: 75, trend: '+8%', sources: 234 },
    { company: 'Microsoft Corp.', ticker: 'MSFT', sentiment: 68, trend: '+5%', sources: 189 },
    { company: 'NVIDIA Corp.', ticker: 'NVDA', sentiment: 72, trend: '+12%', sources: 312 },
    { company: 'Meta Platforms', ticker: 'META', sentiment: 54, trend: '-3%', sources: 278 },
    { company: 'Amazon.com Inc.', ticker: 'AMZN', sentiment: 66, trend: '+2%', sources: 245 },
    { company: 'Tesla Inc.', ticker: 'TSLA', sentiment: 48, trend: '-8%', sources: 421 },
    { company: 'Google (Alphabet)', ticker: 'GOOGL', sentiment: 71, trend: '+6%', sources: 198 },
    { company: 'Netflix Inc.', ticker: 'NFLX', sentiment: 63, trend: '+1%', sources: 167 },
  ]);

  const getSentimentColor = (score) => {
    if (score >= 70) return '#4fd1c5';
    if (score >= 50) return '#fbbf24';
    return '#ef4444';
  };

  const getTrendColor = (trend) => {
    return trend.startsWith('+') ? '#4fd1c5' : '#ef4444';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Market Sentiment</h1>
        <p>
          AI-powered sentiment analysis from news and social media{' '}
          <span style={{ color: '#fbbf24', fontSize: 12 }}>(demo data)</span>
        </p>
      </div>

      <div className="sentiment-grid">
        {sentimentData.map((item, idx) => (
          <div key={idx} className="sentiment-card">
            <div className="sentiment-header">
              <div className="sentiment-company">
                <h3>{item.ticker}</h3>
                <p>{item.company}</p>
              </div>
              <div className="sentiment-trend" style={{ color: getTrendColor(item.trend) }}>
                {item.trend}
              </div>
            </div>

            <div className="sentiment-score-display">
              <div className="sentiment-circle" style={{ backgroundColor: getSentimentColor(item.sentiment) }}>
                <span className="sentiment-number">{item.sentiment}</span>
              </div>
              <div className="sentiment-label">Sentiment</div>
            </div>

            <div className="sentiment-bar">
              <div
                className="sentiment-bar-fill"
                style={{
                  width: `${item.sentiment}%`,
                  backgroundColor: getSentimentColor(item.sentiment),
                }}
              />
            </div>
            <div className="sentiment-sources">{item.sources} sources</div>
          </div>
        ))}
      </div>
    </div>
  );
}
