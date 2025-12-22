"""
Model Management & Versioning Script
Handles model versioning, retraining, and artifact management
"""

import os
import shutil
import pickle
import json
from datetime import datetime
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
ARCHIVE_DIR = os.path.join(BASE_DIR, "models", "archive")
DATA_DIR = os.path.join(BASE_DIR, "data")

# Create archive directory if it doesn't exist
os.makedirs(ARCHIVE_DIR, exist_ok=True)


def get_model_version():
    """Get current model version from metadata file"""
    metadata_path = os.path.join(MODEL_DIR, "model_metadata.json")
    if os.path.exists(metadata_path):
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
            return metadata.get('version', '1.0.0')
    return '1.0.0'


def increment_version(version):
    """Increment version number (patch version)"""
    parts = version.split('.')
    parts[-1] = str(int(parts[-1]) + 1)
    return '.'.join(parts)


def save_model_metadata(version, metrics, training_date, data_samples):
    """Save model metadata for tracking"""
    metadata = {
        'version': version,
        'training_date': training_date,
        'data_samples': data_samples,
        'metrics': metrics,
    }
    metadata_path = os.path.join(MODEL_DIR, "model_metadata.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"✅ Model metadata saved: v{version}")


def archive_current_model():
    """Archive the current model before retraining"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    version = get_model_version()
    
    archive_name = f"model_v{version}_{timestamp}"
    archive_path = os.path.join(ARCHIVE_DIR, archive_name)
    os.makedirs(archive_path, exist_ok=True)
    
    # Copy model artifacts
    for artifact in ['xgb_model.pkl', 'scaler.pkl', 'feature_cols.pkl']:
        src = os.path.join(MODEL_DIR, artifact)
        if os.path.exists(src):
            shutil.copy(src, os.path.join(archive_path, artifact))
    
    # Copy metadata
    metadata_path = os.path.join(MODEL_DIR, "model_metadata.json")
    if os.path.exists(metadata_path):
        shutil.copy(metadata_path, os.path.join(archive_path, "metadata.json"))
    
    print(f"📦 Model archived: {archive_name}")
    return archive_path


def load_training_data(csv_path):
    """Load and prepare training data from CSV"""
    df = pd.read_csv(csv_path)
    print(f"📊 Loaded {len(df)} samples from {csv_path}")
    
    # Ensure required columns exist
    if 'fdi' not in df.columns:
        raise ValueError("CSV must contain 'fdi' column")
    
    # Drop rows with missing FDI values
    df = df.dropna(subset=['fdi'])
    
    # Separate features and target
    y = df['fdi'].values
    
    # Use all numeric columns as features (except target)
    feature_cols = [col for col in df.columns if col != 'fdi' and pd.api.types.is_numeric_dtype(df[col])]
    X = df[feature_cols].fillna(0).values
    
    print(f"🔧 Using {len(feature_cols)} features for training")
    return X, y, feature_cols


def retrain_model(csv_path=None):
    """Retrain the XGBoost model"""
    if csv_path is None:
        csv_path = os.path.join(DATA_DIR, 'FINSENTINAL_FINAL.csv')
    
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Training data not found: {csv_path}")
    
    print(f"\n🚀 Starting model retraining from {csv_path}...")
    
    # Archive current model
    archive_current_model()
    
    # Load training data
    X, y, feature_cols = load_training_data(csv_path)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=(y > 0.5)
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Convert continuous FDI to binary classification (>0.5 = distressed)
    y_train_binary = (y_train > 0.5).astype(int)
    y_test_binary = (y_test > 0.5).astype(int)
    
    # Train XGBoost model
    print("🤖 Training XGBoost model...")
    model = XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        random_state=42,
        eval_metric='logloss',
        verbose=0
    )
    model.fit(X_train_scaled, y_train_binary)
    
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
    
    metrics = {
        'accuracy': float(accuracy_score(y_test_binary, y_pred)),
        'precision': float(precision_score(y_test_binary, y_pred)),
        'recall': float(recall_score(y_test_binary, y_pred)),
        'f1': float(f1_score(y_test_binary, y_pred)),
        'test_samples': len(y_test),
        'train_samples': len(y_train),
    }
    
    print(f"\n📈 Model Performance:")
    print(f"   Accuracy:  {metrics['accuracy']:.4f}")
    print(f"   Precision: {metrics['precision']:.4f}")
    print(f"   Recall:    {metrics['recall']:.4f}")
    print(f"   F1 Score:  {metrics['f1']:.4f}")
    
    # Save new model
    version = increment_version(get_model_version())
    
    with open(os.path.join(MODEL_DIR, 'xgb_model.pkl'), 'wb') as f:
        pickle.dump(model, f)
    
    with open(os.path.join(MODEL_DIR, 'scaler.pkl'), 'wb') as f:
        pickle.dump(scaler, f)
    
    with open(os.path.join(MODEL_DIR, 'feature_cols.pkl'), 'wb') as f:
        pickle.dump(feature_cols, f)
    
    # Save metadata
    save_model_metadata(
        version=version,
        metrics=metrics,
        training_date=datetime.now().isoformat(),
        data_samples=len(X)
    )
    
    print(f"\n✅ Model retraining complete!")
    print(f"   New version: v{version}")
    print(f"   Features: {len(feature_cols)}")
    print(f"   Training samples: {metrics['train_samples']}")
    print(f"   Test samples: {metrics['test_samples']}")


def list_model_versions():
    """List all archived model versions"""
    if not os.path.exists(ARCHIVE_DIR):
        print("No archived models found")
        return
    
    versions = sorted(os.listdir(ARCHIVE_DIR))
    if not versions:
        print("No archived models found")
        return
    
    print("\n📦 Archived Model Versions:")
    for v in versions:
        path = os.path.join(ARCHIVE_DIR, v)
        metadata_file = os.path.join(path, 'metadata.json')
        if os.path.exists(metadata_file):
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
                date = metadata.get('training_date', 'Unknown')
                print(f"   {v} (trained: {date})")


def restore_model_version(version_name):
    """Restore a previous model version"""
    archive_path = os.path.join(ARCHIVE_DIR, version_name)
    if not os.path.exists(archive_path):
        raise ValueError(f"Version not found: {version_name}")
    
    # Archive current model
    archive_current_model()
    
    # Restore archived version
    for artifact in ['xgb_model.pkl', 'scaler.pkl', 'feature_cols.pkl']:
        src = os.path.join(archive_path, artifact)
        if os.path.exists(src):
            shutil.copy(src, os.path.join(MODEL_DIR, artifact))
    
    # Restore metadata
    metadata_file = os.path.join(archive_path, 'metadata.json')
    if os.path.exists(metadata_file):
        shutil.copy(metadata_file, os.path.join(MODEL_DIR, 'model_metadata.json'))
    
    print(f"✅ Model restored: {version_name}")


def get_current_model_info():
    """Get info about current model"""
    version = get_model_version()
    metadata_path = os.path.join(MODEL_DIR, "model_metadata.json")
    
    print(f"\n📋 Current Model Information:")
    print(f"   Version: v{version}")
    
    if os.path.exists(metadata_path):
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
            print(f"   Training Date: {metadata.get('training_date', 'Unknown')}")
            print(f"   Training Samples: {metadata.get('data_samples', 'Unknown')}")
            print(f"   Metrics:")
            for key, val in metadata.get('metrics', {}).items():
                if isinstance(val, float):
                    print(f"      {key}: {val:.4f}")
                else:
                    print(f"      {key}: {val}")


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python model_manager.py retrain [csv_path]  - Retrain model")
        print("  python model_manager.py list               - List archived versions")
        print("  python model_manager.py restore <version>  - Restore a version")
        print("  python model_manager.py info               - Show current model info")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'retrain':
        csv_path = sys.argv[2] if len(sys.argv) > 2 else None
        retrain_model(csv_path)
    elif command == 'list':
        list_model_versions()
    elif command == 'restore':
        if len(sys.argv) < 3:
            print("Usage: python model_manager.py restore <version_name>")
            sys.exit(1)
        restore_model_version(sys.argv[2])
    elif command == 'info':
        get_current_model_info()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
