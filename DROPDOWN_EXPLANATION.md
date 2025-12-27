# Understanding the Two Dropdowns

## 🎯 Company Selection Dropdown (Top Navigation)

**Location:** Top navigation bar, next to the FinSential logo

**Purpose:** Selects which **company** you want to view/analyze

**What it does:**
- Changes which company's historical data is displayed in the charts
- Filters the KPI cards (FDI, Sentiment, Confidence, Volatility) to show aggregate data for that company
- Updates the Recent Activity log to show predictions for that company
- **Does NOT** directly load specific financial features for prediction

**Companies Available:**
- Apple Inc.
- Microsoft Corp.
- Amazon.com Inc.
- Google LLC
- Tesla Inc.
- Netflix Inc.
- Meta Platforms Inc.
- NVIDIA Corp.

**Example:**
```
Select "Apple Inc." → Dashboard shows Apple's historical performance
Select "Tesla Inc." → Dashboard shows Tesla's historical performance
```

---

## 📊 Prefill Sample Dropdown (Prediction Section)

**Location:** In the "Make a Prediction" section, below the main charts

**Purpose:** Selects a **specific historical record** with actual financial metrics to use for prediction

**What it does:**
- Loads specific financial data from a real company record (from your CSV data)
- Fills in ALL the feature values needed for prediction (Current Ratio, Profit Margin, Debt-to-Equity, etc.)
- Provides the data payload that will be sent to the ML model
- **This is what actually gets predicted**

**Sample Format:**
```
"5 — AAPL 2020"
 ↑    ↑    ↑
 ID   Ticker Year

ID: Sample number in database
Ticker: Company stock symbol (AAPL = Apple, TSLA = Tesla, etc.)
Year: Year of the financial data
```

**Example:**
```
Select "10 — TSLA 2021" → Loads Tesla's actual 2021 financial data:
  - Current Ratio: 1.45
  - Profit Margin: 0.18
  - Debt to Equity: 2.3
  - ... (all other features)
```

---

## 🔍 Key Difference

| Aspect | Company Dropdown | Prefill Sample Dropdown |
|--------|-----------------|-------------------------|
| **What it controls** | Which company's charts/history to view | Which specific data to predict |
| **Changes** | Visual display only | Actual prediction input |
| **Affects prediction?** | No (just for viewing) | Yes (provides the data) |
| **Granularity** | Company level | Specific record/year level |
| **Required for prediction?** | No | Yes |

---

## 📝 Complete Workflow Example

### Scenario: I want to predict Apple's financial distress using their 2020 data

**Step 1:** Select Company (for viewing context)
```
Company Dropdown → Select "Apple Inc."
```
- Dashboard now shows Apple's historical trends
- You can see how Apple performed over time
- This is just for context/visualization

**Step 2:** Select Specific Sample (for prediction)
```
Prefill Sample Dropdown → Select "5 — AAPL 2020"
```
- This loads Apple's actual 2020 financial metrics:
  - Current Ratio: 1.36
  - Profit Margin: 0.21
  - Total Debt to Total Assets: 0.31
  - Working Capital to Total Assets: 0.15
  - ... (64+ features)
- These values are now ready to be predicted

**Step 3:** Click "🧮 Predict & Explain"
- System sends the 2020 Apple data to the ML model
- Model returns FDI score (e.g., 32% risk)
- SHAP explains which features drove that score
- Page auto-scrolls to show explanation

---

## ⚙️ How They Work Together

### Option A: Same Company (Recommended)

```
Company Dropdown: "Apple Inc."
Prefill Sample: "5 — AAPL 2020"
```
✅ **Good:** You're viewing Apple's dashboard AND predicting Apple's data - makes sense!

### Option B: Different Companies (Possible but Confusing)

```
Company Dropdown: "Tesla Inc."
Prefill Sample: "5 — AAPL 2020"
```
⚠️ **Confusing:** You're viewing Tesla's dashboard but predicting Apple's 2020 data. This works technically, but the charts won't match the prediction.

**Best Practice:** Select the same company in both dropdowns to keep everything aligned.

---

## 🎬 Step-by-Step Guide

### To Make a Prediction:

1. **Select Company (Top):** Choose "Microsoft Corp."
   - This shows Microsoft's historical dashboard

2. **Select Sample (Prediction section):** Choose "12 — MSFT 2019"
   - This loads Microsoft's 2019 financial data

3. **Click "🧮 Predict & Explain"**
   - Predicts using MSFT 2019 data
   - Shows SHAP explanation

4. **View Results:**
   - FDI score updates (e.g., 45%)
   - Risk label shown (e.g., "Moderate Risk")
   - Page auto-scrolls to SHAP section
   - See which features increased/decreased risk

---

## 🔄 Auto-Loading Behavior

**NEW Feature:** When you select a company from the top dropdown, the system **automatically** tries to load a matching sample.

**Example:**
```
You select: "Netflix Inc."
↓
System automatically finds: "15 — NFLX 2020"
↓
Prefill dropdown auto-selects this sample
↓
You can immediately click "Predict & Explain"
```

This saves you from manually finding matching samples!

---

## 📡 Live Data Alternative

Instead of using historical samples, you can fetch **real-time** data:

1. **Select Company:** "Apple Inc."
2. **Scroll to "📡 Live Financial Data"**
3. **Click "🔄 Fetch Live Data"**
   - Pulls current data from Yahoo Finance
4. **Click "✓ Use for Prediction"**
   - Uses live data instead of historical sample
5. **Click "Predict & Explain"**
   - Predicts using today's real metrics

---

## ❓ Common Questions

### Q: Why do I need two dropdowns?

**A:** One is for **viewing** (Company Dropdown), the other is for **predicting** (Prefill Sample). They serve different purposes:
- Company Dropdown = "Show me this company's dashboard"
- Prefill Sample = "Predict this specific data"

### Q: Can I select different companies in each dropdown?

**A:** Yes, technically you can. But it's confusing:
- Company Dropdown: Tesla
- Prefill Sample: Apple 2020
- Result: You see Tesla's charts but predict Apple's data

**Recommendation:** Keep them aligned (both Tesla or both Apple).

### Q: What happens if I only select Company but no Sample?

**A:** You'll see the dashboard/charts, but you **cannot make a prediction** until you select a sample (or fetch live data).

### Q: What's the difference between a sample and live data?

**A:**
- **Sample:** Historical data from your CSV (e.g., Apple 2020)
- **Live Data:** Real-time data fetched from Yahoo Finance (e.g., Apple today)

Both can be used for predictions!

---

## 🎯 Summary

**Company Dropdown (Top):**
- Viewing only
- Shows which company's dashboard
- Affects: Charts, KPIs, Activity Log
- Does NOT affect: Prediction input

**Prefill Sample Dropdown (Prediction Section):**
- Prediction input
- Loads specific financial metrics
- Affects: What gets predicted
- Does NOT affect: Dashboard display

**Best Practice:** Select the same company in both dropdowns to keep everything aligned and avoid confusion.

**Auto-Loading:** System now auto-loads matching samples when you switch companies, making the workflow smoother!
