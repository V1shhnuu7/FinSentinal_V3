import React, { useState } from 'react';

export default function TopNav({ selectedCompany = 'Apple Inc.', onCompanyChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const companies = [
    'Apple Inc.', 'Microsoft Corp.', 'NVIDIA Corp.', 'Meta Platforms',
    'Amazon.com Inc.', 'Tesla Inc.', 'Google (Alphabet)', 'Netflix Inc.'
  ];
  
  const filteredCompanies = companies.filter(c => 
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <nav className="top-nav">
      <div className="top-nav-left">
        <h1 className="app-title" style={{letterSpacing:'1px', color:'#4fd1c5'}}>FinSentinal <span style={{color:'#fff', fontWeight:400, fontSize:'0.7em'}}>FDEWS</span></h1>
      </div>

      <div className="top-nav-center">
        <div className="nav-control-group">
          <label className="nav-label">Search Company</label>
          <input
            type="text"
            placeholder="Type to search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="nav-search"
          />
        </div>
        <div className="nav-control-group">
          <label className="nav-label">Select</label>
          <select
            value={selectedCompany}
            onChange={(e) => onCompanyChange && onCompanyChange(e.target.value)}
            className="nav-select"
          >
            {filteredCompanies.map(company => (
              <option key={company}>{company}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="top-nav-right" />
    </nav>
  );
}
