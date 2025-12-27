# Testing Guide - SHAP & Live Data Features

## Issue Fixed: Company-Specific Predictions

### Problem
- All companies showed same static values when clicking "Predict & Explain"
- SHAP explanation was not visible

### Solution
1. Auto-loads company-specific sample data when switching companies
2. Uses prefill data for predictions (not empty payload)
3. Proper error handling and user feedback via toast notifications

---

## How to Test

### 1. Start Servers

**Backend:**
```bash
cd backend
python app.py
```

**Frontend:**
```bash
cd frontend
npm start
```

### 2. Test Company-Specific Data

**Step 1:** Open http://localhost:3000

**Step 2:** Select "Apple Inc." from dropdown
- Watch FDI, Sentiment, Confidence, Volatility values
- Note the specific values

**Step 3:** Switch to "Tesla Inc."
- Values should CHANGE to Tesla-specific metrics
- Different from Apple values

**Step 4:** Switch to "Netflix Inc."
- Again, values should be DIFFERENT
- Each company has unique metrics

### 3. Test Predict & Explain

**Step 1:** Select "Microsoft Corp."

**Step 2:** From "Prefill sample" dropdown, select any Microsoft sample
- Example: "5 — MSFT 2020"
- This loads real financial data for Microsoft

**Step 3:** Click "🧮 Predict & Explain" button
- Watch for loading state
- Should show prediction SPECIFIC to Microsoft data
- After ~1 second, scroll down

**Step 4:** Scroll down to "🔍 Feature Importance (SHAP)"
- Should see green success toast: "✅ Feature importance analysis complete!"
- Should see SHAP bars showing:
  - Red bars = features that INCREASE risk
  - Blue bars = features that DECREASE risk
- Top 5 features displayed with SHAP values

### 4. Test Live Data Workflow

**Step 1:** Select "Apple Inc."

**Step 2:** Scroll to "📡 Live Financial Data" section

**Step 3:** Click "🔄 Fetch Live Data"
- Wait for data to load from Yahoo Finance
- Should see: P/E Ratio, Current Ratio, Profit Margin, etc.

**Step 4:** Click "✓ Use for Prediction"
- Toast notification: "✅ Live data loaded! Prediction updated..."
- FDI should update with real-time prediction
- Values will be DIFFERENT for each company based on live data

**Step 5:** Click "↻ Explain" in SHAP section
- Should show which live financial metrics drove the prediction

### 5. Test SHAP Visibility

**If SHAP is not showing:**

1. Open browser console (F12)
2. Look for errors
3. Check Network tab for `/explain` request
4. Verify response shows feature_importance array

**Common issues:**
- "Please make a prediction first" → Select a sample and predict
- "SHAP not available" → Backend needs SHAP installed
- Empty section → Make sure you clicked "Predict & Explain"

---

## Expected Results

### Different Companies Show Different Values ✓

**Apple Inc.:**
- FDI: ~45%
- Sentiment: ~95%
- Sample data: High profit margins, strong cash position

**Tesla Inc.:**
- FDI: Different % (varies based on sample)
- Sentiment: Different %
- Sample data: High growth, different debt ratios

**Netflix Inc.:**
- FDI: Different % 
- Sentiment: Different %
- Sample data: Different revenue/debt profile

### SHAP Shows Feature Impact ✓

When you click "Explain", you should see:

```
🔍 Feature Importance (SHAP Values)

Base Value: 28.5%
Prediction: 45.2%

Top 5 Most Influential Features:

1. Profit Margin        +0.087  ↑ Increases risk
   Value: 0.23

2. Current Ratio        -0.053  ↓ Decreases risk
   Value: 1.45

3. Debt to Equity       +0.042  ↑ Increases risk
   Value: 2.1

... etc
```

---

## Debugging Checklist

### SHAP Not Showing

- [ ] Backend running? Check terminal for "✅ SHAP explainer initialized"
- [ ] Sample selected? Check dropdown shows sample ID
- [ ] Clicked "Predict & Explain"? Not just "Refresh"
- [ ] Scrolled down? SHAP section is below charts
- [ ] Check console for errors (F12)
- [ ] Check Network tab for 200 response from `/explain`

### Same Values for All Companies

- [ ] Are you selecting different samples? Each sample is company-specific
- [ ] Check dropdown shows correct company ticker (AAPL vs TSLA vs NFLX)
- [ ] After switching company, wait for auto-load (2-3 seconds)
- [ ] Look at Recent Activity log - should show different companies

### Live Data Not Working

- [ ] Internet connection active?
- [ ] Backend shows "✅ yfinance initialized"?
- [ ] Market hours? (Data might be stale outside trading hours)
- [ ] Check console for 200 response from `/fetch-live-data`

---

## Visual Walkthrough

### Where is SHAP Section?

```
[Top Nav - Company Selection]
    ↓
[KPI Cards - FDI, Sentiment, Confidence, Volatility]
    ↓
[Export Buttons - PDF, CSV]
    ↓
[FDI Trend Chart]
    ↓
[Make a Prediction Section]  ← Select sample HERE
    ↓
[Asset-to-Liability Chart] [Risk Comparison Chart]
    ↓
[📊 Recent Activity Log]
    ↓
[🔍 Feature Importance (SHAP)]  ← SHAP SECTION HERE!
    ↓
[📡 Live Financial Data]
```

If you can't see SHAP:
- **Scroll down more**
- **Zoom out** (Ctrl + Mouse Wheel)
- **Maximize browser window**

---

## Success Indicators

✅ **Working Correctly:**
- Each company shows different FDI values
- SHAP section appears after clicking "Predict & Explain"
- Green success toasts appear
- Red/Blue bars show in SHAP section
- Live data shows real-time metrics

❌ **Not Working:**
- All companies show FDI: 45%
- SHAP section stays empty/shows "Click Explain"
- Error toasts appear
- Console shows 500 errors
- No bars in SHAP section

---

## Quick Test Script

Run this in browser console to verify:

```javascript
// Test prediction
fetch('http://localhost:5000/predict', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({company: 'Apple Inc.', current_ratio: 1.5, profit_margin: 0.25})
})
.then(r => r.json())
.then(d => console.log('Prediction:', d));

// Test SHAP
fetch('http://localhost:5000/explain', {
  method: 'POST', 
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({company: 'Apple Inc.', current_ratio: 1.5, profit_margin: 0.25})
})
.then(r => r.json())
.then(d => console.log('SHAP:', d));
```

Expected output:
- Prediction: {fdi_score: 0.45, risk_label: "Moderate Risk", ...}
- SHAP: {base_value: 0.28, prediction: 0.45, feature_importance: [...]}
