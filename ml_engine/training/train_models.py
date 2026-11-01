"""
AquaGuard AI — Machine Learning Model Training & Evaluation Pipeline
Trains and benchmarks three models:
1. Logistic Regression (Linear baseline)
2. Random Forest Classifier (Ensemble baseline)
3. XGBoost Classifier (Gradient Boosted Decision Trees)

Features evaluated:
- rainfall_intensity_mm_h
- rainfall_cum_3h_mm
- rainfall_cum_24h_mm
- forecast_1h_mm
- elevation_m
- slope_deg
- distance_to_drain_m
- drainage_capacity_m3s
- drainage_status_val
- underpass
- historical_incidents_count
- soil_runoff_coeff

Metrics computed:
- Precision, Recall, F1-Score, ROC-AUC, PR-AUC, Confusion Matrix
- SHAP TreeExplainer & Global Feature Importance
"""

import os
import json
import datetime
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix, accuracy_score
)
from xgboost import XGBClassifier
import shap

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "saved_models")
DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "flood_training_dataset.csv")

FEATURE_COLUMNS = [
    "rainfall_intensity_mm_h",
    "rainfall_cum_3h_mm",
    "rainfall_cum_24h_mm",
    "forecast_1h_mm",
    "elevation_m",
    "slope_deg",
    "distance_to_drain_m",
    "drainage_capacity_m3s",
    "drainage_status_val",
    "underpass",
    "historical_incidents_count",
    "soil_runoff_coeff"
]

def train_and_evaluate():
    os.makedirs(MODELS_DIR, exist_ok=True)
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}. Run generate_dataset.py first.")

    df = pd.read_csv(DATA_PATH)
    X = df[FEATURE_COLUMNS]
    y = df["waterlogged"]

    # Stratified split with fixed seed for reproducibility
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 1. Logistic Regression Baseline
    lr = LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42)
    lr.fit(X_train_scaled, y_train)
    lr_pred = lr.predict(X_test_scaled)
    lr_proba = lr.predict_proba(X_test_scaled)[:, 1]

    # 2. Random Forest
    rf = RandomForestClassifier(n_estimators=100, max_depth=8, class_weight="balanced", random_state=42)
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_proba = rf.predict_proba(X_test)[:, 1]

    # 3. XGBoost
    scale_pos = (len(y_train) - sum(y_train)) / sum(y_train)
    xgb = XGBClassifier(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.08,
        scale_pos_weight=scale_pos,
        eval_metric="logloss",
        random_state=42
    )
    xgb.fit(X_train, y_train)
    xgb_pred = xgb.predict(X_test)
    xgb_proba = xgb.predict_proba(X_test)[:, 1]

    models_eval = {
        "LogisticRegression": {
            "model": lr,
            "pred": lr_pred,
            "proba": lr_proba,
            "scaled": True
        },
        "RandomForest": {
            "model": rf,
            "pred": rf_pred,
            "proba": rf_proba,
            "scaled": False
        },
        "XGBoost": {
            "model": xgb,
            "pred": xgb_pred,
            "proba": xgb_proba,
            "scaled": False
        }
    }

    results = {}
    best_model_name = "XGBoost"
    best_f1 = -1.0

    for name, data in models_eval.items():
        pred = data["pred"]
        proba = data["proba"]
        cm = confusion_matrix(y_test, pred).tolist()
        f1 = float(f1_score(y_test, pred))
        acc = float(accuracy_score(y_test, pred))
        prec = float(precision_score(y_test, pred))
        rec = float(recall_score(y_test, pred))
        roc_auc = float(roc_auc_score(y_test, proba))
        pr_auc = float(average_precision_score(y_test, proba))

        results[name] = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc_auc, 4),
            "pr_auc": round(pr_auc, 4),
            "confusion_matrix": cm,
            "true_negatives": cm[0][0],
            "false_positives": cm[0][1],
            "false_negatives": cm[1][0],
            "true_positives": cm[1][1]
        }

        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name

    print(f"--- Model Benchmark Results ---")
    for name, m in results.items():
        print(f"[{name}] Acc: {m['accuracy']*100:.1f}% | Prec: {m['precision']:.3f} | Rec: {m['recall']:.3f} | F1: {m['f1_score']:.3f} | ROC-AUC: {m['roc_auc']:.3f}")

    # Save Best Model and Scaler
    selected_model = models_eval[best_model_name]["model"]
    joblib.dump(selected_model, os.path.join(MODELS_DIR, "flood_model.joblib"))
    joblib.dump(scaler, os.path.join(MODELS_DIR, "scaler.joblib"))
    joblib.dump(rf, os.path.join(MODELS_DIR, "rf_model.joblib"))
    joblib.dump(lr, os.path.join(MODELS_DIR, "lr_model.joblib"))

    # Compute Feature Importance using Tree SHAP
    try:
        explainer = shap.TreeExplainer(xgb)
        # Sample for SHAP background
        sample_X = X_test.iloc[:100]
        shap_values = explainer.shap_values(sample_X)
        mean_abs_shap = np.abs(shap_values).mean(axis=0).tolist()
        shap_dict = {col: round(float(val), 4) for col, val in zip(FEATURE_COLUMNS, mean_abs_shap)}
    except Exception as e:
        print(f"SHAP TreeExplainer calculation fallback: {e}")
        importances = xgb.feature_importances_.tolist()
        shap_dict = {col: round(float(val), 4) for col, val in zip(FEATURE_COLUMNS, importances)}

    # Sort feature importance descending
    sorted_shap = dict(sorted(shap_dict.items(), key=lambda item: item[1], reverse=True))

    metadata = {
        "active_model": best_model_name,
        "features": FEATURE_COLUMNS,
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "evaluated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "benchmark_comparison": results,
        "global_feature_importance": sorted_shap,
        "data_readiness": "Synthetic hydrological simulation benchmark - not validated against observed flood incidents",
        "dataset_attribution": "Generated synthetic scenarios using rule-based hydrological formulas; not an observed Jaipur incident dataset",
        "validation_warning": "Reported metrics measure performance on a held-out split of synthetic generated data only. They are not real-world flood prediction accuracy."
    }

    with open(os.path.join(MODELS_DIR, "metrics.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nSaved best model ({best_model_name}) and evaluation metrics to {MODELS_DIR}")
    return metadata

if __name__ == "__main__":
    train_and_evaluate()
