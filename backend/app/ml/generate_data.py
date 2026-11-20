from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

from app.database import fetch_all_clients, insert_client, insert_payment
from app.ml.churn_model import DATA_PATH, train_and_save_model


def generate_training_csv(csv_path: Path = DATA_PATH, n_samples: int = 800) -> Path:
    rng = np.random.default_rng(42)

    tenure_months = rng.integers(1, 25, size=n_samples)
    sessions_attended_30d = rng.integers(0, 13, size=n_samples)
    sessions_missed_30d = rng.integers(0, 6, size=n_samples)
    days_since_last_checkin = rng.integers(0, 28, size=n_samples)
    avg_reply_hours = np.round(rng.uniform(0.5, 72.0, size=n_samples), 1)
    sentiment_score = np.round(rng.uniform(-0.9, 0.95, size=n_samples), 2)
    late_payments_90d = rng.choice([0, 1, 2, 3], size=n_samples, p=[0.68, 0.18, 0.10, 0.04])
    monthly_fee = rng.choice([49.0, 99.0, 199.0, 299.0], size=n_samples, p=[0.25, 0.40, 0.25, 0.10])
    reward_points = rng.integers(0, 1200, size=n_samples)

    logit = (
        -1.2
        + 0.14 * days_since_last_checkin
        + 0.55 * sessions_missed_30d
        + 0.90 * late_payments_90d
        + 0.025 * avg_reply_hours
        - 1.65 * sentiment_score
        - 0.28 * sessions_attended_30d
        - 0.08 * tenure_months
        - 0.0012 * reward_points
        + 0.002 * monthly_fee
        + rng.normal(0, 0.45, size=n_samples)
    )
    prob = 1.0 / (1.0 + np.exp(-logit))
    churned = (rng.uniform(0, 1, size=n_samples) < prob).astype(int)

    df = pd.DataFrame(
        {
            "tenure_months": tenure_months,
            "sessions_attended_30d": sessions_attended_30d,
            "sessions_missed_30d": sessions_missed_30d,
            "days_since_last_checkin": days_since_last_checkin,
            "avg_reply_hours": avg_reply_hours,
            "sentiment_score": sentiment_score,
            "late_payments_90d": late_payments_90d,
            "monthly_fee": monthly_fee,
            "reward_points": reward_points,
            "churned": churned,
        }
    )
    df.to_csv(csv_path, index=False)
    return csv_path


def seed_supabase_demo_data() -> int:
    existing = fetch_all_clients()
    if existing:
        return len(existing)

    sample_clients = [
        ("Aarav Mehta", "aarav@example.com", "fitness", "VIP", 199.0, 8, 9, 0, 1, 3.2, 0.82, 0, 820),
        ("Maya Lin", "maya@example.com", "fitness", "Pro", 99.0, 2, 2, 3, 15, 42.0, -0.45, 1, 110),
        ("Jordan Vega", "jordan@example.com", "gaming", "Pro", 99.0, 5, 7, 1, 3, 6.5, 0.55, 0, 480),
        ("Priya Nair", "priya@example.com", "creator_training", "VIP", 299.0, 3, 1, 4, 19, 58.0, -0.60, 2, 90),
        ("Liam Brooks", "liam@example.com", "gaming", "Starter", 49.0, 11, 8, 0, 2, 4.0, 0.74, 0, 1050),
        ("Sofia Reyes", "sofia@example.com", "fitness", "Pro", 99.0, 4, 4, 2, 10, 26.0, -0.10, 1, 260),
        ("Rohan Kulkarni", "rohan@example.com", "gaming", "VIP", 199.0, 6, 10, 0, 1, 2.5, 0.88, 0, 940),
        ("Chloe Bennett", "chloe@example.com", "creator_training", "Pro", 99.0, 1, 2, 3, 14, 38.0, -0.30, 0, 75),
        ("Devon Carter", "devon@example.com", "fitness", "Starter", 49.0, 9, 6, 1, 4, 9.0, 0.42, 0, 560),
        ("Ananya Sharma", "ananya@example.com", "creator_training", "VIP", 299.0, 12, 11, 0, 1, 1.8, 0.91, 0, 1240),
    ]

    today = date.today()
    for idx, c in enumerate(sample_clients):
        current_status = "overdue" if c[11] >= 1 else ("pending" if idx % 4 == 0 else "paid")
        initial_late = max(0, c[11] - 1) if current_status == "overdue" else c[11]

        client = insert_client(
            {
                "name": c[0],
                "email": c[1],
                "niche": c[2],
                "plan_tier": c[3],
                "monthly_fee": c[4],
                "status": "active",
                "tenure_months": c[5],
                "sessions_attended_30d": c[6],
                "sessions_missed_30d": c[7],
                "days_since_last_checkin": c[8],
                "avg_reply_hours": c[9],
                "sentiment_score": c[10],
                "late_payments_90d": initial_late,
                "reward_points": c[12],
                "payment_link": f"https://pay.example.com/client-{idx + 1}",
            }
        )
        insert_payment(
            {
                "client_id": client["id"],
                "amount": client["monthly_fee"],
                "currency": "USD",
                "status": "paid",
                "due_date": (today - timedelta(days=35)).isoformat(),
                "paid_date": (today - timedelta(days=34)).isoformat(),
                "provider": "stripe_link",
                "notes": "Previous monthly renewal",
            }
        )
        insert_payment(
            {
                "client_id": client["id"],
                "amount": client["monthly_fee"],
                "currency": "USD",
                "status": current_status,
                "due_date": (today - timedelta(days=5 if current_status == "overdue" else -3)).isoformat(),
                "paid_date": today.isoformat() if current_status == "paid" else None,
                "provider": "razorpay_link" if idx % 2 == 0 else "stripe_link",
                "notes": "Current billing cycle",
            }
        )

    return len(sample_clients)


if __name__ == "__main__":
    csv_file = generate_training_csv()
    artifact = train_and_save_model(csv_file)
    seeded = seed_supabase_demo_data()
    print(f"Generated dataset: {csv_file}")
    print(f"Trained model metrics: {artifact['metrics']}")
    print(f"Seeded Supabase clients: {seeded}")