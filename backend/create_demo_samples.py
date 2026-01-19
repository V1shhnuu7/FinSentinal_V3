"""
Create realistic demo samples for each company that match the new 14-feature model
"""
import sqlite3
import json
from datetime import datetime

# Demo data for each company with realistic financial metrics
# Features: 14 total (matching retrained model)
DEMO_DATA = {
    'AAPL': {
        'company': 'Apple Inc.',
        'ticker': 'AAPL',
        ' ROA(A) before interest and % after tax': 28.5,  # Strong ROA
        ' Debt ratio %': 35.2,  # Moderate debt
        ' Net worth/Assets': 0.65,  # Healthy equity
        ' Current Ratio': 1.07,  # Adequate liquidity
        ' Operating Gross Margin': 0.434,  # High margins
        ' Realized Sales Gross Margin': 0.256,  # Strong profitability
        ' Cash flow rate': 0.30,  # Excellent cash flow
        ' Operating Expense Rate': 0.10,  # Efficient operations
        ' Interest-bearing debt interest rate': 0.025,  # Low interest
        ' Current Liability to Assets': 0.38,  # Manageable
        ' Retained Earnings to Total Assets': 0.55,  # Accumulation
        ' Total debt/Total net worth': 0.54,  # Conservative leverage
        ' Working Capital to Total Assets': 0.05,  # Positive working capital
        ' Current Liability to Current Assets': 0.93,  # Good coverage
    },
    'GOOGL': {
        'company': 'Google (Alphabet)',
        'ticker': 'GOOGL',
        ' ROA(A) before interest and % after tax': 24.3,
        ' Debt ratio %': 18.5,
        ' Net worth/Assets': 0.82,
        ' Current Ratio': 2.8,
        ' Operating Gross Margin': 0.567,
        ' Realized Sales Gross Margin': 0.268,
        ' Cash flow rate': 0.35,
        ' Operating Expense Rate': 0.12,
        ' Interest-bearing debt interest rate': 0.018,
        ' Current Liability to Assets': 0.22,
        ' Retained Earnings to Total Assets': 0.68,
        ' Total debt/Total net worth': 0.23,
        ' Working Capital to Total Assets': 0.25,
        ' Current Liability to Current Assets': 0.36,
    },
    'NVDA': {
        'company': 'NVIDIA Corp.',
        'ticker': 'NVDA',
        ' ROA(A) before interest and % after tax': 45.2,  # Very high ROA
        ' Debt ratio %': 22.3,
        ' Net worth/Assets': 0.78,
        ' Current Ratio': 4.3,
        ' Operating Gross Margin': 0.654,  # Exceptional margins
        ' Realized Sales Gross Margin': 0.482,
        ' Cash flow rate': 0.42,
        ' Operating Expense Rate': 0.09,
        ' Interest-bearing debt interest rate': 0.022,
        ' Current Liability to Assets': 0.18,
        ' Retained Earnings to Total Assets': 0.72,
        ' Total debt/Total net worth': 0.29,
        ' Working Capital to Total Assets': 0.32,
        ' Current Liability to Current Assets': 0.23,
    },
    'META': {
        'company': 'Meta Platforms',
        'ticker': 'META',
        ' ROA(A) before interest and % after tax': 26.8,
        ' Debt ratio %': 12.7,
        ' Net worth/Assets': 0.87,
        ' Current Ratio': 2.5,
        ' Operating Gross Margin': 0.801,
        ' Realized Sales Gross Margin': 0.368,
        ' Cash flow rate': 0.38,
        ' Operating Expense Rate': 0.11,
        ' Interest-bearing debt interest rate': 0.020,
        ' Current Liability to Assets': 0.15,
        ' Retained Earnings to Total Assets': 0.75,
        ' Total debt/Total net worth': 0.15,
        ' Working Capital to Total Assets': 0.28,
        ' Current Liability to Current Assets': 0.40,
    },
    'TSLA': {
        'company': 'Tesla Inc.',
        'ticker': 'TSLA',
        ' ROA(A) before interest and % after tax': 12.4,  # Growing but lower
        ' Debt ratio %': 42.5,  # Higher debt
        ' Net worth/Assets': 0.58,
        ' Current Ratio': 1.35,
        ' Operating Gross Margin': 0.188,  # Lower margins
        ' Realized Sales Gross Margin': 0.095,
        ' Cash flow rate': 0.12,
        ' Operating Expense Rate': 0.16,
        ' Interest-bearing debt interest rate': 0.045,
        ' Current Liability to Assets': 0.32,
        ' Retained Earnings to Total Assets': 0.35,
        ' Total debt/Total net worth': 0.73,
        ' Working Capital to Total Assets': 0.08,
        ' Current Liability to Current Assets': 0.74,
    },
    'NFLX': {
        'company': 'Netflix Inc.',
        'ticker': 'NFLX',
        ' ROA(A) before interest and % after tax': 15.2,
        ' Debt ratio %': 48.3,  # Higher debt (content investment)
        ' Net worth/Assets': 0.52,
        ' Current Ratio': 1.15,
        ' Operating Gross Margin': 0.425,
        ' Realized Sales Gross Margin': 0.165,
        ' Cash flow rate': 0.18,
        ' Operating Expense Rate': 0.14,
        ' Interest-bearing debt interest rate': 0.052,
        ' Current Liability to Assets': 0.35,
        ' Retained Earnings to Total Assets': 0.28,
        ' Total debt/Total net worth': 0.93,
        ' Working Capital to Total Assets': 0.02,
        ' Current Liability to Current Assets': 0.87,
    },
    'AMZN': {
        'company': 'Amazon.com Inc.',
        'ticker': 'AMZN',
        ' ROA(A) before interest and % after tax': 8.5,  # Lower ROA due to heavy investments
        ' Debt ratio %': 38.7,  # Moderate debt
        ' Net worth/Assets': 0.61,
        ' Current Ratio': 1.02,  # Tight liquidity (retail/logistics)
        ' Operating Gross Margin': 0.475,
        ' Realized Sales Gross Margin': 0.058,  # Low margins (retail competition)
        ' Cash flow rate': 0.22,
        ' Operating Expense Rate': 0.15,
        ' Interest-bearing debt interest rate': 0.038,
        ' Current Liability to Assets': 0.42,
        ' Retained Earnings to Total Assets': 0.38,
        ' Total debt/Total net worth': 0.63,
        ' Working Capital to Total Assets': 0.01,  # Very tight
        ' Current Liability to Current Assets': 0.98,
    },
}


# Risk labeling (for reference - these are expected FDI ranges and confidence)
EXPECTED_RISK = {
    'AAPL': ('Healthy', 0.09, 0.91),  # FDI 9%, Confidence 91%
    'GOOGL': ('Healthy', 0.10, 0.90),  # FDI 10%, Confidence 90%
    'NVDA': ('Healthy', 0.08, 0.92),   # FDI 8%, Confidence 92%
    'META': ('Healthy', 0.10, 0.90),   # FDI 10%, Confidence 90%
    'TSLA': ('Healthy', 0.14, 0.86),   # FDI 14%, Confidence 86%
    'NFLX': ('Healthy', 0.16, 0.84),   # FDI 16%, Confidence 84%
    'AMZN': ('Healthy', 0.18, 0.82),   # FDI 18%, Confidence 82% (higher risk due to tight margins)
}

def create_demo_predictions():
    """Insert demo predictions into the database with historical trend data"""
    db_path = 'data/predictions.db'
    
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # Clear existing predictions
    cur.execute('DELETE FROM predictions')
    conn.commit()
    
    print("Creating demo predictions with historical trends for each company...\n")
    
    from datetime import timedelta
    
    for ticker, data in DEMO_DATA.items():
        company = data['company']
        expected_risk, base_fdi, base_conf = EXPECTED_RISK.get(ticker, ('Unknown', 0.5, 0.5))
        
        # Create 20 historical predictions for each company to show trend
        for i in range(20):
            # Vary FDI slightly over time to create realistic trend
            variation = (i - 10) * 0.005  # Small variation
            fdi_value = max(0.05, min(0.95, base_fdi + variation))
            conf_value = max(0.80, min(0.95, base_conf - abs(variation)))
            
            # Determine risk based on actual FDI value
            if fdi_value >= 0.7:
                risk_label = "Distressed"
            elif fdi_value >= 0.4:
                risk_label = "Moderate"
            else:
                risk_label = "Healthy"
            
            # Create timestamps going back in time
            timestamp = datetime.now() - timedelta(hours=20-i)
            
            # Insert prediction
            cur.execute('''
                INSERT INTO predictions (ts, fdi, risk, confidence, payload)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                timestamp.isoformat(),
                fdi_value,
                risk_label,
                conf_value,
                json.dumps(data)
            ))
        
        print(f"✅ {company:20} - Created 20 predictions - Latest FDI: {base_fdi*100:5.1f}% ({expected_risk})")
    
    conn.commit()
    conn.close()
    
    print(f"\n✅ Created {len(DEMO_DATA) * 20} total predictions across {len(DEMO_DATA)} companies")
    print("\n🎯 Charts will now display trend lines! Refresh your frontend.")

if __name__ == '__main__':
    create_demo_predictions()
