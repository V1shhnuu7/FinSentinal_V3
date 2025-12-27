# FinSentinal V3 - Financial Distress Early Warning System

A modern web application that predicts financial distress for companies using AI and machine learning, with professional data visualization.

## Features
- 🎯 Financial Distress Index (FDI) prediction for major tech companies
- 📊 Interactive dashboard with KPI cards and charts
- 📈 Real-time prediction history and trend analysis
- 🤖 AI model performance monitoring
- 💼 Multi-company portfolio overview
- 📉 Asset-to-liability ratio visualization
- 🎨 Modern, professional UI with dark theme
- 🔍 **SHAP Explainability** - See which features drive each prediction
- 📡 **Live Data Integration** - Fetch real-time financial metrics from Yahoo Finance
- 💾 **Export to PDF/CSV** - Download reports and history
- 🔔 **Recent Activity Log** - Track latest predictions
- 🔎 **Company Search** - Quick filter for company selection

## Tech Stack
- **Frontend:** React, Chart.js
- **Backend:** Flask (Python)
- **ML Model:** Random Forest / XGBoost
- **Database:** SQLite
- **Styling:** Custom CSS with professional fonts

## Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/V1shhnuu7/FinSentinal_V3.git
cd FinSentinal_V3
```

### 2. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Create virtual environment (Windows)
python -m venv venv
venv\Scripts\activate

# Or on Mac/Linux
# python3 -m venv venv
# source venv/bin/activate

# Install dependencies
pip install flask flask-cors numpy pandas scikit-learn xgboost shap yfinance

# Run the backend server
python app.py
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

Frontend will open on `http://localhost:3000`

## Project Structure
```
FinSentinal_V3/
├── backend/
│   ├── app.py                 # Flask API
│   ├── model_manager.py       # Model training & versioning
│   ├── data/
│   │   ├── FINSENTINAL_FINAL.csv
│   │   └── predictions.db
│   └── models/
│       ├── rf_model.pkl
│       ├── scaler.pkl
│       └── feature_cols.pkl
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── components/       # React components
│   │   └── pages/            # Dashboard, Companies, etc.
│   ├── public/
│   └── package.json
└── README.md
```

## Usage

### Quick Workflow

**Option 1: Use Live Real-Time Data (Recommended)**
1. Select a company from dropdown or search
2. Scroll to "📡 Live Financial Data" section
3. Click "🔄 Fetch Live Data" → Pulls real-time metrics from Yahoo Finance
4. Click "✓ Use for Prediction" → Auto-fills data and makes prediction
5. Click "↻ Explain" in Feature Importance section → See SHAP analysis

**Option 2: Use Sample Data**
1. Select a company
2. Choose a sample from "Prefill sample" dropdown
3. Click "🧮 Predict & Explain" → Gets prediction + SHAP in one click

**Option 3: Manual Prediction**
1. Click "Refresh" to get latest FDI
2. Click "↻ Explain" to see feature importance

### Key Features
- **Live Data Integration:** Real-time financial metrics from Yahoo Finance
- **SHAP Explainability:** Understand which features drive predictions
- **Export Reports:** Download PDF reports or CSV history
- **Recent Activity:** Track last 8 predictions with timestamps
- **Company Search:** Quick filter in navigation bar

## New Features

### 🔍 SHAP Explainability
- Click "Explain" button in Feature Importance section
- See top 5 or all features that influenced the prediction
- Red bars = increases risk, Blue bars = decreases risk
- Understand exactly why the model made its prediction

### 📡 Live Financial Data
- Fetches real-time data from Yahoo Finance
- Shows market data, valuation ratios, liquidity, profitability, and growth metrics
- Color-coded values (green = good, yellow = moderate, red = poor)
- Can be used to inform predictions

### 💾 Export Capabilities
- **PDF Export**: Professional report with company details, FDI, confidence, and risk assessment
- **CSV Export**: Download full prediction history for analysis in Excel
- Reports include executive summary and interpretation guide

## Data Information

### Static/Demo Data Used:
- Asset-to-liability ratios for donut chart
- Default model metrics (if metadata file is missing)
- Sample company financial data in CSV

### Dynamic Data:
- FDI predictions from ML model
- Prediction history from database
- KPI metrics calculated from recent predictions
- Sentiment and volatility scores from history

## Model Management

### Retrain Model
```bash
cd backend
python model_manager.py retrain
```

### List Model Versions
```bash
python model_manager.py list
```

### View Current Model Info
```bash
python model_manager.py info
```

## API Endpoints

### Core Endpoints
- `GET /` - Health check
- `POST /predict` - Get FDI prediction
- `GET /history?limit=100` - Get prediction history
- `GET /features` - Get model feature list
- `GET /samples?limit=20` - Get sample data
- `GET /model-info` - Get model metadata
- `POST /preprocess` - Preprocess sample data

### New Advanced Endpoints
- `POST /explain` - Get SHAP feature importance for a prediction
  - Returns SHAP values showing which features increase/decrease risk
  - Includes top 5 features and full feature list
  
- `POST /fetch-live-data` - Fetch real-time financial data from Yahoo Finance
  - Requires: `{ "company": "Apple Inc." }` in request body
  - Returns: Market data, ratios, profitability metrics, growth indicators
  - Source: Yahoo Finance API via yfinance library

## Deployment Notes

- Backend runs on Flask development server (use Gunicorn for production)
- Frontend builds with `npm run build` for production
- Database is SQLite (consider PostgreSQL for production)
- Model files (.pkl) are included in the repo

## Known Limitations

- Mobile responsiveness not fully implemented
- Some charts use demo/static data for visualization
- Limited to 8 predefined companies

## Troubleshooting

**Backend won't start:**
- Make sure Python virtual environment is activated
- Install all dependencies: `pip install flask flask-cors numpy pandas scikit-learn xgboost`

**Frontend won't start:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Make sure backend is running on port 5000

**Charts not showing:**
- Check browser console for errors
- Ensure backend is running and accessible
- Clear browser cache and refresh

## Contributing
Pull requests are welcome. For major changes, please open an issue first.

## License
MIT

## Contact
For questions or support, please open an issue on GitHub.
