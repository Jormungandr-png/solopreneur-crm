import os
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.database import (
    fetch_all_clients,
    fetch_client_by_id,
    fetch_payments,
    insert_client,
    insert_payment,
    update_client_rewards,
)
from app.ml.churn_model import DATA_PATH, predict_client_churn, train_and_save_model
from app.ml.generate_data import generate_training_csv, seed_supabase_demo_data
from app.ml.inbox_scorer import prioritize_messages
from app.models import (
    ChurnFeaturesInput,
    ChurnPrediction,
    ClientCreate,
    ClientOut,
    InboxMessageInput,
    PaymentCreate,
    PaymentOut,
    PrioritizedMessage,
    RewardAction,
)

app = FastAPI(
    title="Solopreneur CRM, Churn Analytics & Finance API",
    version="1.0.0",
)

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event() -> None:
    if not DATA_PATH.exists():
        generate_training_csv(DATA_PATH)
    seed_supabase_demo_data()


def _enrich_client(raw: Dict[str, Any]) -> Dict[str, Any]:
    pred = predict_client_churn(raw)
    enriched = dict(raw)
    if pred["risk_level"] == "High" and enriched["status"] == "active":
        enriched["status"] = "at_risk"
    enriched["churn_prediction"] = pred
    return enriched


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {"status": "ok"}


# 1. Business Analytics Dashboard
@app.get("/api/analytics/overview")
def get_analytics_overview() -> Dict[str, Any]:
    clients = [_enrich_client(c) for c in fetch_all_clients()]
    payments = fetch_payments()

    active_clients = [c for c in clients if c["status"] != "churned"]
    high_risk = [c for c in active_clients if c["churn_prediction"]["risk_level"] == "High"]
    mrr = round(sum(float(c["monthly_fee"]) for c in active_clients), 2)
    at_risk_mrr = round(sum(float(c["monthly_fee"]) for c in high_risk), 2)
    avg_churn_prob = (
        round(sum(c["churn_prediction"]["churn_probability"] for c in active_clients) / len(active_clients), 4)
        if active_clients
        else 0.0
    )

    forecast = []
    baseline_rev = mrr
    retained_rev = mrr
    for month_idx in range(1, 4):
        expected_loss = baseline_rev * (avg_churn_prob * 0.35)
        baseline_rev = round(max(0.0, baseline_rev - expected_loss), 2)
        retained_rev = round(max(0.0, retained_rev - expected_loss * 0.45), 2)
        forecast.append(
            {
                "month": f"Month +{month_idx}",
                "projected_mrr_no_action": baseline_rev,
                "projected_mrr_with_rewards": retained_rev,
            }
        )

    niche_breakdown: Dict[str, Dict[str, Any]] = {}
    for c in active_clients:
        n = c["niche"]
        if n not in niche_breakdown:
            niche_breakdown[n] = {"clients": 0, "mrr": 0.0, "high_risk_count": 0}
        niche_breakdown[n]["clients"] += 1
        niche_breakdown[n]["mrr"] = round(niche_breakdown[n]["mrr"] + float(c["monthly_fee"]), 2)
        if c["churn_prediction"]["risk_level"] == "High":
            niche_breakdown[n]["high_risk_count"] += 1

    collected_total = round(sum(float(p["amount"]) for p in payments if p["status"] == "paid"), 2)
    overdue_total = round(sum(float(p["amount"]) for p in payments if p["status"] == "overdue"), 2)

    return {
        "kpis": {
            "total_active_clients": len(active_clients),
            "high_risk_clients": len(high_risk),
            "mrr": mrr,
            "at_risk_mrr": at_risk_mrr,
            "avg_churn_risk": avg_churn_prob,
            "retention_rate": round(1.0 - avg_churn_prob, 4),
            "collected_revenue": collected_total,
            "overdue_revenue": overdue_total,
        },
        "niche_breakdown": niche_breakdown,
        "revenue_forecast_3m": forecast,
    }


# 2. Clients, Churn Analysis & Rewards
@app.get("/api/clients", response_model=List[ClientOut])
def list_clients(risk_level: Optional[str] = Query(None)) -> List[Dict[str, Any]]:
    clients = [_enrich_client(c) for c in fetch_all_clients()]
    if risk_level:
        clients = [c for c in clients if c["churn_prediction"]["risk_level"] == risk_level]
    clients.sort(key=lambda c: c["churn_prediction"]["churn_probability"], reverse=True)
    return clients


@app.post("/api/clients", response_model=ClientOut, status_code=201)
def create_client(payload: ClientCreate) -> Dict[str, Any]:
    try:
        raw = insert_client(payload.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not create client: {exc}") from exc
    return _enrich_client(raw)


@app.post("/api/clients/{client_id}/rewards/grant", response_model=ClientOut)
def grant_reward_points(client_id: int, action: RewardAction) -> Dict[str, Any]:
    updated = update_client_rewards(client_id, action.points, "retention_bonus", action.reward_name)
    if not updated:
        raise HTTPException(status_code=404, detail="Client not found")
    return _enrich_client(updated)


@app.post("/api/clients/{client_id}/rewards/redeem", response_model=ClientOut)
def redeem_reward_points(client_id: int, action: RewardAction) -> Dict[str, Any]:
    existing = fetch_client_by_id(client_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Client not found")
    if existing["reward_points"] < action.points:
        raise HTTPException(status_code=400, detail="Insufficient reward points")
    updated = update_client_rewards(client_id, -action.points, "redeemed", action.reward_name)
    return _enrich_client(updated)


# 3. Payments & Finances
@app.get("/api/payments", response_model=List[PaymentOut])
def list_payments(status: Optional[str] = Query(None)) -> List[Dict[str, Any]]:
    return fetch_payments(status=status)


@app.post("/api/payments", response_model=PaymentOut, status_code=201)
def log_payment(payload: PaymentCreate) -> Dict[str, Any]:
    if not fetch_client_by_id(payload.client_id):
        raise HTTPException(status_code=404, detail="Client not found")
    return insert_payment(payload.model_dump())


@app.get("/api/payments/summary")
def get_payments_summary() -> Dict[str, Any]:
    payments = fetch_payments()
    clients = [_enrich_client(c) for c in fetch_all_clients()]

    paid = round(sum(float(p["amount"]) for p in payments if p["status"] == "paid"), 2)
    pending = round(sum(float(p["amount"]) for p in payments if p["status"] == "pending"), 2)
    overdue = round(sum(float(p["amount"]) for p in payments if p["status"] == "overdue"), 2)
    refunded = round(sum(float(p["amount"]) for p in payments if p["status"] == "refunded"), 2)

    ltv_values = [
        float(c["monthly_fee"]) / max(0.05, c["churn_prediction"]["churn_probability"] * 0.35)
        for c in clients
    ]
    avg_ltv = round(sum(ltv_values) / len(ltv_values), 2) if ltv_values else 0.0

    return {
        "total_paid": paid,
        "total_pending": pending,
        "total_overdue": overdue,
        "total_refunded": refunded,
        "net_collected": round(paid - refunded, 2),
        "estimated_avg_client_ltv": avg_ltv,
        "overdue_count": sum(1 for p in payments if p["status"] == "overdue"),
    }


# 4. ML & AI Inbox
@app.post("/api/ml/predict-churn", response_model=ChurnPrediction)
def predict_single_churn(features: ChurnFeaturesInput) -> Dict[str, Any]:
    return predict_client_churn(features.model_dump())


@app.post("/api/ml/retrain")
def retrain_churn_model() -> Dict[str, Any]:
    if not DATA_PATH.exists():
        generate_training_csv(DATA_PATH)
    artifact = train_and_save_model(DATA_PATH)
    return {"status": "retrained", "metrics": artifact["metrics"]}


@app.post("/api/inbox/prioritize", response_model=List[PrioritizedMessage])
def prioritize_inbox(messages: List[InboxMessageInput]) -> List[Dict[str, Any]]:
    return prioritize_messages([m.model_dump() for m in messages])