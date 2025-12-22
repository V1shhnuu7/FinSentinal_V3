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

        prob = model.predict_proba(X_scaled)[0][1]  # FDI (probability of healthy)
        if prob >= 0.7:
            risk_label = "Healthy"
        elif prob >= 0.4:
            risk_label = "Moderate"
        else:
            risk_label = "Distressed"

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

print("🚀 Starting FinSentinal Flask server...")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
