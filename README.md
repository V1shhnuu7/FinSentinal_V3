# FinSentinal V3

Financial Distress Prediction System with AI-powered analysis, real-time data integration, and SHAP explainability.

## Features

- 🎯 **Financial Distress Index (FDI)** - ML-based risk prediction
- 📊 **Interactive Dashboard** - Real-time visualization of financial metrics
- 🤖 **AI Model Interpretation** - SHAP explanations for predictions
- 📈 **Live Data Integration** - yfinance API for real-time company data
- 🏢 **Multi-Company Analysis** - Track Apple, Google, Amazon, Tesla, Netflix, Meta, NVIDIA
- 💾 **Historical Tracking** - Trend analysis and prediction history

## Tech Stack

**Backend:**
- Python 3.14.2
- Flask (REST API)
- scikit-learn (Random Forest)
- XGBoost
- SHAP (explainability)
- yfinance (live data)
- SQLite (predictions database)

**Frontend:**
- React 18
- Chart.js (visualizations)
- Modern CSS with gradients

## Installation

### Backend Setup

```bash
cd backend
python -m venv ../.venv
../.venv/Scripts/activate  # Windows
# source ../.venv/bin/activate  # Linux/Mac

pip install flask flask-cors scikit-learn xgboost shap pandas numpy yfinance
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Start Backend
```bash
cd backend
python app.py
# Runs on http://localhost:5000
```

### Start Frontend
```bash
cd frontend
npm start
# Runs on http://localhost:3000
```

## Project Structure

```
FinSential_V3/
├── backend/
│   ├── app.py                      # Flask API
│   ├── model_manager.py            # Model loading
│   ├── create_demo_samples.py      # Demo data generator
│   ├── data/
│   │   ├── FINSENTINAL_FINAL.csv   # Training data
│   │   └── predictions.db          # SQLite database
│   └── models/
│       ├── rf_model.pkl            # Random Forest model
│       ├── scaler.pkl              # StandardScaler
│       └── feature_cols.pkl        # Feature columns
├── frontend/
│   ├── src/
│   │   ├── components/             # React components
│   │   ├── pages/                  # Dashboard, Companies, etc.
│   │   └── utils/                  # Export utilities
│   └── public/
└── data/                           # ARFF datasets
```

## API Endpoints

- `POST /predict` - Get FDI prediction
- `POST /explain` - Get SHAP explanation
- `GET /history` - Prediction history
- `GET /samples` - Demo samples
- `POST /fetch-live-data` - Fetch live company data

## Model Features (14 total)

1. ROA (Return on Assets)
2. Debt Ratio %
3. Net Worth/Assets
4. Current Ratio
5. Operating Gross Margin
6. Realized Sales Gross Margin
7. Cash Flow Rate
8. Operating Expense Rate
9. Interest-bearing Debt Interest Rate
10. Current Liability to Assets
11. Retained Earnings to Total Assets
12. Total Debt/Total Net Worth
13. Working Capital to Total Assets
14. Current Liability to Current Assets

## Risk Thresholds

- **FDI < 40%** - Healthy (Low Risk)
- **FDI 40-70%** - Moderate Risk
- **FDI > 70%** - Distressed (High Risk)

## Demo Companies

| Company | Ticker | Typical FDI | Risk Level |
|---------|--------|-------------|------------|
| Apple Inc. | AAPL | 9% | Healthy |
| Google (Alphabet) | GOOGL | 10% | Healthy |
| NVIDIA Corp. | NVDA | 8% | Healthy |
| Meta Platforms | META | 10% | Healthy |
| Amazon.com Inc. | AMZN | 18% | Healthy |
| Tesla Inc. | TSLA | 14% | Healthy |
| Netflix Inc. | NFLX | 16% | Healthy |

## Usage

1. **Select a Company** - Choose from dropdown
2. **View Demo Data** - See historical predictions and trends
3. **Use Live Data** - Click "Fetch Live Data" for real-time metrics
4. **Get Explanation** - Click "Predict & Explain" for SHAP analysis
5. **Export Reports** - Download PDF or CSV

## Training the Model

If you need to retrain the model:

```bash
cd backend
python create_demo_samples.py  # Generate demo data
# Then train using your training notebook or script
```

## Contributing

This is an academic/research project. Feel free to fork and improve!

## License

MIT License

## Authors

FinSentinal V3 Team
