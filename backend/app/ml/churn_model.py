import json
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_PATH = BASE_DIR / "coaching_churn_dataset.csv"
MODEL_PATH = BASE_DIR / "churn_model_weights.json"

FEATURE_COLUMNS = [
    "tenure_months",
    "sessions_attended_30d",
    "sessions_missed_30d",
    "days_since_last_checkin",
    "avg_reply_hours",
    "sentiment_score",
    "late_payments_90d",
    "monthly_fee",
    "reward_points",
]


def _sigmoid(z: float) -> float:
    z = float(np.clip(z, -30.0, 30.0))
    return float(1.0 / (1.0 + np.exp(-z)))


def train_and_save_model(csv_path: Path = DATA_PATH) -> Dict[str, Any]:
    df = pd.read_csv(csv_path)
    X = df[FEATURE_COLUMNS].astype(float).values
    y = df["churned"].astype(int).values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    clf = LogisticRegression(max_iter=1000, C=1.0)
    clf.fit(X_train_s, y_train)

    probs = clf.predict_proba(X_test_s)[:, 1]
    acc = float(accuracy_score(y_test, (probs >= 0.5).astype(int)))
    auc = float(roc_auc_score(y_test, probs))

    artifact = {
        "features": FEATURE_COLUMNS,
        "mean": scaler.mean_.tolist(),
        "std": scaler.scale_.tolist(),
        "weights": clf.coef_[0].tolist(),
        "bias": float(clf.intercept_[0]),
        "metrics": {
            "accuracy": round(acc, 4),
            "roc_auc": round(auc, 4),
            "train_samples": int(len(X_train)),
            "test_samples": int(len(X_test)),
        },
    }
    MODEL_PATH.write_text(json.dumps(artifact, indent=2), encoding="utf-8")
    return artifact


def _load_model() -> Dict[str, Any]:
    if not MODEL_PATH.exists():
        if not DATA_PATH.exists():
            from app.ml.generate_data import generate_training_csv
            generate_training_csv(DATA_PATH)
        return train_and_save_model(DATA_PATH)
    return json.loads(MODEL_PATH.read_text(encoding="utf-8"))


def _human_reason(feature: str, value: float) -> str:
    if feature == "days_since_last_checkin":
        return f"No check-in logged for {int(value)} days"
    if feature == "sessions_missed_30d":
        return f"Missed {int(value)} coaching sessions in the last 30 days"
    if feature == "late_payments_90d":
        return f"{int(value)} late or overdue payment(s) in the last 90 days"
    if feature == "sentiment_score":
        return f"Recent message sentiment is low ({value:.2f})"
    if feature == "avg_reply_hours":
        return f"Slow reply time averaging {value:.1f} hours"
    if feature == "sessions_attended_30d":
        return f"Low attendance ({int(value)} sessions in 30 days)"
    if feature == "reward_points":
        return f"Low reward engagement ({int(value)} points)"
    if feature == "tenure_months":
        return f"Early-stage client ({int(value)} month(s) tenure)"
    return f"Plan fee sensitivity (${value:.0f}/mo)"


def _recommend_reward(prob: float, top_features: List[str]) -> str:
    if prob >= 0.70:
        if "late_payments_90d" in top_features:
            return "Offer 15% renewal discount + flexible split-payment option"
        return "Grant 200 bonus points + free 1-on-1 strategy reset call"
    if prob >= 0.40:
        return "Send 100 streak-recovery points + personalized progress recap"
    return "Award 50 loyalty points to reinforce active streak"


def predict_client_churn(features: Dict[str, Any]) -> Dict[str, Any]:
    model = _load_model()
    x = np.array([float(features[f]) for f in FEATURE_COLUMNS], dtype=float)
    mean = np.array(model["mean"], dtype=float)
    std = np.array(model["std"], dtype=float)
    weights = np.array(model["weights"], dtype=float)
    bias = float(model["bias"])

    z = (x - mean) / std
    contributions = z * weights
    logit = float(np.sum(contributions) + bias)
    prob = _sigmoid(logit)

    if prob >= 0.65:
        risk_level = "High"
    elif prob >= 0.35:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    indexed = sorted(
        zip(FEATURE_COLUMNS, contributions, x),
        key=lambda item: item[1],
        reverse=True,
    )
    top_reasons = [
        {
            "feature": feat,
            "impact": round(float(imp), 3),
            "reason": _human_reason(feat, val),
        }
        for feat, imp, val in indexed[:3]
        if imp > 0
    ]
    if not top_reasons:
        top_reasons = [
            {
                "feature": "sessions_attended_30d",
                "impact": 0.0,
                "reason": "Healthy engagement across sessions, check-ins, and payments",
            }
        ]

    return {
        "churn_probability": round(prob, 4),
        "risk_level": risk_level,
        "top_reasons": top_reasons,
        "recommended_reward": _recommend_reward(prob, [r["feature"] for r in top_reasons]),
    }