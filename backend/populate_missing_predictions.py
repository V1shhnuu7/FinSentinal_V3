import sqlite3
import json
import pandas as pd
import os
from datetime import datetime
import joblib

# --- CONFIG ---
DB_PATH = 'data/predictions.db'
CSV_PATH = 'data/FINSENTINAL_FINAL.csv'
MODEL_PATH = 'models/rf_model.pkl'
SCALER_PATH = 'models/scaler.pkl'
FEATURES_PATH = 'models/feature_cols.pkl'

TRACKED_COMPANIES = [
    ('Apple Inc.', 'AAPL'),
    ('Microsoft Corp.', 'MSFT'),
    ('NVIDIA Corp.', 'NVDA'),
    ('Meta Platforms', 'META'),
    ('Amazon.com Inc.', 'AMZN'),
    ('Tesla Inc.', 'TSLA'),
    ('Google (Alphabet)', 'GOOGL'),
    ('Netflix Inc.', 'NFLX'),
]

def get_existing_companies():
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute('SELECT DISTINCT json_extract(payload, "$.company") FROM predictions')
        rows = cur.fetchall()
        conn.close()
        return set(r[0] for r in rows if r[0])
    except sqlite3.OperationalError:
        # Table doesn't exist, return empty set
        return set()

def load_model():
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    with open(FEATURES_PATH, 'rb') as f:
        feature_cols = joblib.load(f)
    return model, scaler, feature_cols

def get_sample_for_company(df, company_name, ticker):
    # Try to find a row for this ticker (since 'company' column does not exist)
    if 'ticker' in df.columns:
        row = df[df['ticker'].str.upper() == ticker.upper()]
        if not row.empty:
            return row.iloc[0]
    # fallback: any row
    return df.iloc[0]

def predict_and_store(company_name, ticker, sample, model, scaler, feature_cols):
    # Ensure columns match by stripping whitespace
    sample = sample.copy()
    sample.index = sample.index.str.strip()
    clean_features = [c.strip() for c in feature_cols]
    X = sample[clean_features].values.reshape(1, -1)
    X_scaled = scaler.transform(X)
    prob = float(model.predict_proba(X_scaled)[0][1])
    if prob >= 0.7:
        risk_label = "Healthy"
    elif prob >= 0.4:
        risk_label = "Moderate"
    else:
        risk_label = "Distressed"
    payload = sample[clean_features].to_dict()
    payload['company'] = company_name
    payload['ticker'] = ticker
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('INSERT INTO predictions (ts, fdi, risk, confidence, payload) VALUES (?,?,?,?,?)', (
        datetime.utcnow().isoformat(), prob, risk_label, prob, json.dumps(payload)
    ))
    conn.commit()
    conn.close()
    print(f"Added prediction for {company_name} ({ticker}): {prob:.2%} ({risk_label})")

def main():
    existing = get_existing_companies()
    df = pd.read_csv(CSV_PATH)
    # Compute roa_trend and price_momentum if missing
    if 'roa_trend' not in df.columns or 'price_momentum' not in df.columns:
        # Clean up column names for easier access
        df.columns = [c.strip() for c in df.columns]
        # Compute roa_trend: 3-year rolling mean of ROA(A) for each ticker
        if 'roa_trend' not in df.columns:
            df['roa_trend'] = df.groupby('ticker')['ROA(A) before interest and % after tax'].transform(lambda x: x.rolling(window=3, min_periods=1).mean())
        # Compute price_momentum: percent change in Close price for each ticker
        if 'price_momentum' not in df.columns:
            df['price_momentum'] = df.groupby('ticker')['Close'].transform(lambda x: x.pct_change().fillna(0))
    model, scaler, feature_cols = load_model()
    for company_name, ticker in TRACKED_COMPANIES:
        if company_name in existing:
            print(f"{company_name} already has data. Skipping.")
            continue
        sample = get_sample_for_company(df, company_name, ticker)
        predict_and_store(company_name, ticker, sample, model, scaler, feature_cols)
    print("\nDone populating missing predictions.")

if __name__ == "__main__":
    main()
