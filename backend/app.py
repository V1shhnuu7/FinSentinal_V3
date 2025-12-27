from flask import Flask, request, jsonify
try:
    from flask_cors import CORS
except Exception:
    CORS = None
import pickle
import numpy as np
import os
import sqlite3
import json
import csv
from datetime import datetime

# SHAP for model explainability
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    print("⚠️ SHAP not installed. Install with: pip install shap")

# yfinance for real-time financial data
try:
    import yfinance as yf
    YFINANCE_AVAILABLE = True
except ImportError:
    YFINANCE_AVAILABLE = False
    print("⚠️ yfinance not installed. Install with: pip install yfinance")

app = Flask(__name__)
if CORS:
    CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
MODEL_META_PATH = os.path.join(MODEL_DIR, "model_metadata.json")

# -----------------------------
# Load model and assets
# -----------------------------
with open(os.path.join(MODEL_DIR, "rf_model.pkl"), "rb") as f:
    model = pickle.load(f)

with open(os.path.join(MODEL_DIR, "scaler.pkl"), "rb") as f:
    scaler = pickle.load(f)

with open(os.path.join(MODEL_DIR, "feature_cols.pkl"), "rb") as f:
    feature_cols = pickle.load(f)

print("✅ Model, scaler, and features loaded successfully.")

# Initialize SHAP explainer for feature importance
shap_explainer = None
if SHAP_AVAILABLE:
    try:
        # Use TreeExplainer for tree-based models (RandomForest, XGBoost)
        shap_explainer = shap.TreeExplainer(model)
        print("✅ SHAP explainer initialized successfully.")
    except Exception as e:
        print(f"⚠️ Could not initialize SHAP explainer: {e}")


def _load_model_metadata():
    fallback = {
        "version": "1.0",
        "training_date": None,
        "metrics": {
            "accuracy": 0.91,
            "precision": 0.88,
            "recall": 0.93,
            "f1": 0.90,
            "train_samples": 1200,
            "test_samples": 300,
        },
        "notes": "Metadata file missing; returning defaults.",
    }
    try:
        if os.path.exists(MODEL_META_PATH):
            with open(MODEL_META_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                fallback.update({
                    "version": data.get("version") or fallback["version"],
                    "training_date": data.get("training_date"),
                    "metrics": data.get("metrics", {}),
                })
        return fallback
    except Exception:
        return fallback

# -----------------------------
# DB (predictions history)
# -----------------------------
DB_PATH = os.path.join(BASE_DIR, 'data', 'predictions.db')
os.makedirs(os.path.join(BASE_DIR, 'data'), exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('''
    CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT,
        fdi REAL,
        risk TEXT,
        confidence REAL,
        payload TEXT
    )
    ''')
    conn.commit()
    conn.close()

init_db()

# -----------------------------
# Health check
# -----------------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "FinSentinal Flask API is running"})


@app.route("/model-info", methods=["GET"])
def model_info():
    info = _load_model_metadata()
    # include basic artifact flags so frontend can show context
    info["artifacts"] = {
        "model": os.path.exists(os.path.join(MODEL_DIR, "rf_model.pkl")) or os.path.exists(os.path.join(MODEL_DIR, "xgb_model.pkl")),
        "scaler": os.path.exists(os.path.join(MODEL_DIR, "scaler.pkl")),
        "features": os.path.exists(os.path.join(MODEL_DIR, "feature_cols.pkl")),
    }
    return jsonify(info)


# -----------------------------
# Prediction endpoint
# -----------------------------
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        # Ensure all features are present
        features = [data.get(col, 0) for col in feature_cols]

        X = np.array(features).reshape(1, -1)
        X_scaled = scaler.transform(X)

        # We treat the predicted probability as FINANCIAL DISTRESS likelihood (higher = more risk)
        prob = model.predict_proba(X_scaled)[0][1]
        if prob >= 0.7:
            risk_label = "Distressed"
        elif prob >= 0.4:
            risk_label = "Moderate"
        else:
            risk_label = "Healthy"

        # persist prediction to DB
        try:
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute('INSERT INTO predictions (ts, fdi, risk, confidence, payload) VALUES (?,?,?,?,?)', (
                datetime.utcnow().isoformat(), float(prob), risk_label, float(prob), json.dumps(data)
            ))
            conn.commit()
        except Exception:
            pass
        finally:
            try:
                conn.close()
            except Exception:
                pass

        return jsonify({
            "fdi": float(prob),
            "risk": risk_label
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/features", methods=["GET"])
def features():
    try:
        # return the list of feature column names so frontend can build a form
        return jsonify({"features": list(feature_cols)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/samples', methods=['GET'])
def samples():
    try:
        limit = int(request.args.get('limit', 50))
        csv_path = os.path.join(BASE_DIR, 'data', 'FINSENTINAL_FINAL.csv')
        items = []
        if not os.path.exists(csv_path):
            return jsonify({'samples': items})
        with open(csv_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                if i >= limit:
                    break
                items.append({
                    'id': i,
                    'ticker': row.get('ticker'),
                    'year': row.get('year'),
                    'Close': row.get('Close'),
                    'fdi': row.get('fdi')
                })

        return jsonify({'samples': items})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def _get_csv_row(idx):
    csv_path = os.path.join(BASE_DIR, 'data', 'FINSENTINAL_FINAL.csv')
    if not os.path.exists(csv_path):
        return None
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i == idx:
                return row
    return None


@app.route('/preprocess', methods=['POST'])
def preprocess():
    """Return a canonical feature mapping and scaled vector for a given sample or record.

    Accepts JSON: {"sample_id": int} OR {"record": {..raw fields..}}
    """
    try:
        data = request.get_json() or {}

        if 'sample_id' in data:
            idx = int(data.get('sample_id'))
            row = _get_csv_row(idx)
            if row is None:
                return jsonify({'error': 'sample_id not found'}), 404
        elif 'record' in data:
            row = data.get('record') or {}
        else:
            return jsonify({'error': 'provide sample_id or record'}), 400

        # build feature map according to feature_cols
        feature_map = {}
        for col in feature_cols:
            v = None
            # try row as dict-like
            try:
                v = row.get(col)
            except Exception:
                v = None
            if v is None or v == '':
                feature_map[col] = 0.0
            else:
                try:
                    feature_map[col] = float(v)
                except Exception:
                    # fallback: strip and try
                    try:
                        feature_map[col] = float(str(v).strip())
                    except Exception:
                        feature_map[col] = 0.0

        X = np.array([feature_map[c] for c in feature_cols]).reshape(1, -1)
        X_scaled = scaler.transform(X).tolist()[0]

        return jsonify({
            'feature_order': list(feature_cols),
            'features': feature_map,
            'scaled': X_scaled
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/history', methods=['GET'])
def history():
    try:
        limit = int(request.args.get('limit', 50))
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute('SELECT ts,fdi,risk,confidence,payload FROM predictions ORDER BY id DESC LIMIT ?', (limit,))
        rows = cur.fetchall()
        conn.close()
        items = []
        for ts, fdi, risk, confidence, payload in rows[::-1]:
            try:
                pl = json.loads(payload) if payload else {}
            except Exception:
                pl = {}
            items.append({
                'ts': ts,
                'fdi': fdi,
                'risk': risk,
                'confidence': confidence,
                'payload': pl
            })
        return jsonify({'history': items})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# -----------------------------
# SHAP Explainability Endpoint
# -----------------------------
@app.route('/explain', methods=['POST'])
def explain_prediction():
    """
    Returns SHAP values showing feature importance for a prediction.
    Expects same input as /predict endpoint.
    """
    if not SHAP_AVAILABLE or shap_explainer is None:
        return jsonify({
            'error': 'SHAP not available',
            'message': 'Install SHAP with: pip install shap'
        }), 503
    
    try:
        payload = request.get_json() or {}
        
        # Build feature vector (same as predict endpoint)
        feature_map = {}
        for col in feature_cols:
            val = payload.get(col)
            if val is None or val == '':
                feature_map[col] = 0.0
            else:
                try:
                    feature_map[col] = float(val)
                except Exception:
                    feature_map[col] = 0.0
        
        X = np.array([feature_map[c] for c in feature_cols]).reshape(1, -1)
        X_scaled = scaler.transform(X)
        
        # Calculate SHAP values with defensive flattening
        shap_values_raw = shap_explainer.shap_values(X_scaled)

        # For binary classification, shap_values might be a list [class0, class1]; pick positive class when present
        if isinstance(shap_values_raw, list):
            shap_array = np.array(shap_values_raw[1] if len(shap_values_raw) > 1 else shap_values_raw[0])
        else:
            shap_array = np.array(shap_values_raw)

        # Ensure we have the first sample and a 1-D vector of length n_features
        if shap_array.ndim == 0:
            shap_vals_flat = np.array([float(shap_array)])
        elif shap_array.ndim == 1:
            shap_vals_flat = shap_array
        elif shap_array.ndim >= 2:
            shap_vals_flat = shap_array[0]
        else:
            shap_vals_flat = shap_array.ravel()

        shap_vals_flat = np.ravel(shap_vals_flat)

        # Get base value (expected value)
        base_value_raw = shap_explainer.expected_value
        base_array = np.array(base_value_raw)
        if base_array.ndim == 0:
            base_value = float(base_array)
        else:
            base_value = float(base_array[1] if base_array.size > 1 else base_array.flat[0])

        # Get prediction probability
        pred_proba = float(model.predict_proba(X_scaled)[0][1])

        # Create feature importance data
        importance_data = []
        for i, col in enumerate(feature_cols):
            shap_val = float(np.ravel(shap_vals_flat)[i])
            importance_data.append({
                'feature': col,
                'value': float(X_scaled[0][i]),
                'original_value': float(feature_map[col]),
                'shap_value': shap_val,
                'impact': 'positive' if shap_val > 0 else 'negative'
            })
        
        # Sort by absolute SHAP value (most important first)
        importance_data.sort(key=lambda x: abs(x['shap_value']), reverse=True)
        
        return jsonify({
            'base_value': base_value,
            'prediction': float(pred_proba),
            'feature_importance': importance_data[:15],  # Top 15 features
            'top_features': importance_data[:5],  # Top 5 for quick display
            'total_features': len(feature_cols)
        })
        
    except Exception as e:
        import traceback
        print("SHAP Error:", str(e))
        print("Shapes -> shap_values_raw:", 'list' if 'shap_values_raw' in locals() and isinstance(shap_values_raw, list) else (np.array(shap_values_raw).shape if 'shap_values_raw' in locals() else None))
        print("Shapes -> shap_array:", 'list' if 'shap_array' in locals() and isinstance(shap_array, list) else (shap_array.shape if 'shap_array' in locals() and hasattr(shap_array, 'shape') else None))
        print("Shapes -> shap_vals_flat:", shap_vals_flat.shape if 'shap_vals_flat' in locals() else None)
        print(traceback.format_exc())
        return jsonify({'error': str(e), 'details': traceback.format_exc()}), 500


# -----------------------------
# Real-time Financial Data Endpoint
# -----------------------------
TICKER_MAP = {
    'Apple Inc.': 'AAPL',
    'Microsoft Corp.': 'MSFT',
    'NVIDIA Corp.': 'NVDA',
    'Meta Platforms': 'META',
    'Amazon.com Inc.': 'AMZN',
    'Tesla Inc.': 'TSLA',
    'Google (Alphabet)': 'GOOGL',
    'Netflix Inc.': 'NFLX',
}

@app.route('/fetch-live-data', methods=['POST'])
def fetch_live_data():
    """
    Fetches real-time financial data from Yahoo Finance.
    Returns key metrics that can be used for prediction.
    """
    if not YFINANCE_AVAILABLE:
        return jsonify({
            'error': 'yfinance not available',
            'message': 'Install yfinance with: pip install yfinance'
        }), 503
    
    try:
        payload = request.get_json() or {}
        company = payload.get('company', 'Apple Inc.')
        ticker_symbol = TICKER_MAP.get(company, 'AAPL')
        
        # Fetch stock data
        ticker = yf.Ticker(ticker_symbol)
        info = ticker.info
        
        # Get financial ratios and metrics
        live_data = {
            'ticker': ticker_symbol,
            'company': company,
            'current_price': info.get('currentPrice', 0),
            'market_cap': info.get('marketCap', 0),
            'pe_ratio': info.get('trailingPE', 0),
            'pb_ratio': info.get('priceToBook', 0),
            'debt_to_equity': info.get('debtToEquity', 0),
            'current_ratio': info.get('currentRatio', 0),
            'quick_ratio': info.get('quickRatio', 0),
            'profit_margin': info.get('profitMargins', 0),
            'operating_margin': info.get('operatingMargins', 0),
            'roe': info.get('returnOnEquity', 0),
            'roa': info.get('returnOnAssets', 0),
            'revenue_growth': info.get('revenueGrowth', 0),
            'earnings_growth': info.get('earningsGrowth', 0),
            'total_cash': info.get('totalCash', 0),
            'total_debt': info.get('totalDebt', 0),
            'total_revenue': info.get('totalRevenue', 0),
            'ebitda': info.get('ebitda', 0),
            'free_cash_flow': info.get('freeCashflow', 0),
            'beta': info.get('beta', 1.0),
            'fifty_two_week_high': info.get('fiftyTwoWeekHigh', 0),
            'fifty_two_week_low': info.get('fiftyTwoWeekLow', 0),
            'last_updated': datetime.now().isoformat(),
            'data_source': 'Yahoo Finance'
        }
        
        # Calculate additional ratios
        if live_data['total_revenue'] and live_data['total_revenue'] > 0:
            live_data['debt_to_revenue'] = live_data['total_debt'] / live_data['total_revenue']
            live_data['cash_to_revenue'] = live_data['total_cash'] / live_data['total_revenue']
        
        return jsonify({
            'success': True,
            'data': live_data,
            'message': f'Live data fetched for {company} ({ticker_symbol})'
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False,
            'message': 'Failed to fetch live data. Check ticker symbol or internet connection.'
        }), 500


print("🚀 Starting FinSentinal Flask server...")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

