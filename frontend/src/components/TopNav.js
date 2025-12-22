import React from 'react';

export default function TopNav({ selectedCompany = 'Apple Inc.', onCompanyChange }) {
  return (
    <nav className="top-nav">
      <div className="top-nav-left">
        <h1 className="app-title" style={{letterSpacing:'1px', color:'#4fd1c5'}}>FinSentinal <span style={{color:'#fff', fontWeight:400, fontSize:'0.7em'}}>FDEWS</span></h1>
      </div>

      <div className="top-nav-center">
        <div className="nav-control-group">
          <label className="nav-label">Company</label>
          <select
            value={selectedCompany}
            onChange={(e) => onCompanyChange && onCompanyChange(e.target.value)}
            className="nav-select"
          >
            <option>Apple Inc.</option>
            <option>Microsoft Corp.</option>
            <option>NVIDIA Corp.</option>
            <option>Meta Platforms</option>
            <option>Amazon.com Inc.</option>
            <option>Tesla Inc.</option>
            <option>Google (Alphabet)</option>
            <option>Netflix Inc.</option>
          </select>
        </div>
      </div>

      <div className="top-nav-right" />
    </nav>
  );
}
