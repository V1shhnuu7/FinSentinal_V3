#!/usr/bin/env python
"""Quick test to verify data in predictions database"""
import sqlite3
import json

conn = sqlite3.connect('data/predictions.db')
cur = conn.cursor()
cur.execute('SELECT id, fdi, risk, payload FROM predictions ORDER BY id DESC LIMIT 50')
rows = cur.fetchall()

companies = {}
for row_id, fdi, risk, payload in rows:
    try:
        data = json.loads(payload)
        company = data.get('company', 'Unknown')
        if company not in companies:
            companies[company] = {'fdi': fdi * 100, 'risk': risk}
    except:
        pass

print("\n📊 Companies in Prediction Database:")
for company in sorted(companies.keys()):
    fdi = companies[company]['fdi']
    risk = companies[company]['risk']
    print(f"  {company}: {fdi:.1f}% ({risk})")

print(f"\n✅ Total unique companies: {len(companies)}")
