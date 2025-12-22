import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <span className="footer-title">FinSentinal &mdash; FDEWS</span>
        <p className="footer-desc">
          FinSentinal (Financial Distress Early Warning System) leverages AI and financial data to provide early detection of financial distress in companies. This platform empowers users with actionable insights for risk management and strategic decision-making.
        </p>
      </div>
    </footer>
  );
}
