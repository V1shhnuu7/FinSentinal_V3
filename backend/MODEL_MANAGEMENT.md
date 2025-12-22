# FinSential Model Management Guide

## Overview
This guide covers model versioning, retraining, and management for the FinSential FDI prediction system.

## Model Structure
- **xgb_model.pkl** - XGBoost classifier for FDI prediction
- **scaler.pkl** - StandardScaler for feature normalization
- **feature_cols.pkl** - List of feature column names
- **model_metadata.json** - Version and performance metrics tracking

## Usage

### 1. Retrain Model
Train a new model using the latest training data:

```bash
cd backend
python model_manager.py retrain
```

With custom CSV:
```bash
python model_manager.py retrain data/FINSENTINAL_FINAL.csv
```

**What happens:**
- Current model is archived with timestamp
- New model trained on XGBoost with hyperparameters
- Features scaled with StandardScaler
- Performance metrics (accuracy, precision, recall, F1) calculated
- Version number incremented automatically
- New model saved as active model

### 2. List Archived Versions
View all previous model versions:

```bash
python model_manager.py list
```

Output example:
```
📦 Archived Model Versions:
   model_v1.0.0_20231219_100000 (trained: 2023-12-19T10:00:00)
   model_v1.0.1_20231219_110000 (trained: 2023-12-19T11:00:00)
```

### 3. Restore Previous Version
Rollback to a previous model version:

```bash
python model_manager.py restore model_v1.0.0_20231219_100000
```

**Note:** Current active model will be archived before restoring.

### 4. View Current Model Info
Get details about the active model:

```bash
python model_manager.py info
```

Output example:
```
📋 Current Model Information:
   Version: v1.0.2
   Training Date: 2023-12-19T12:00:00
   Training Samples: 1500
   Metrics:
      accuracy: 0.8950
      precision: 0.8750
      recall: 0.9100
      f1: 0.8920
      test_samples: 300
      train_samples: 1200
```

## Versioning Scheme
- Versions follow semantic versioning: `MAJOR.MINOR.PATCH`
- PATCH version increments with each successful retrain
- Manual version control available in `model_metadata.json`

## Model Archive Structure
```
backend/models/archive/
├── model_v1.0.0_20231219_100000/
│   ├── xgb_model.pkl
│   ├── scaler.pkl
│   ├── feature_cols.pkl
│   └── metadata.json
├── model_v1.0.1_20231219_110000/
│   └── ...
└── model_v1.0.2_20231219_120000/
    └── ...
```

## Performance Monitoring
Track model performance over time:
1. Check current metrics: `python model_manager.py info`
2. Compare with previous versions in archive
3. Retrain if metrics degrade below acceptable threshold
4. Restore previous version if new model underperforms

## Retraining Best Practices
- ✅ Retrain monthly or when new data is available
- ✅ Monitor metrics (target F1 > 0.85)
- ✅ Keep archive for rollback capability
- ✅ Test model on holdout test set before deploying
- ❌ Don't delete archive directories
- ❌ Don't manually modify model files

## Integration with Backend
The Flask app (`app.py`) automatically loads:
1. Latest `xgb_model.pkl` on startup
2. Feature columns from `feature_cols.pkl`
3. Scaler from `scaler.pkl`

After retraining, restart the Flask server to use new model:
```bash
# Stop current server (Ctrl+C)
python app.py
```

## Troubleshooting

**Model not updating after retrain:**
- Restart Flask server: `python app.py`
- Clear browser cache

**Low F1 score on new model:**
- Check data quality in CSV
- Review feature engineering
- Try different hyperparameters in `model_manager.py`
- Restore previous version: `python model_manager.py restore <version>`

**Missing training data:**
- Ensure `data/FINSENTINAL_FINAL.csv` exists
- Verify CSV has 'fdi' column for labels
