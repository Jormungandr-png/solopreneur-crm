import os
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SECRET_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_KEY in backend/.env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def compute_reward_tier(points: int) -> str:
    if points >= 1000:
        return "Platinum"
    if points >= 500:
        return "Gold"
    if points >= 200:
        return "Silver"
    return "Bronze"


def fetch_all_clients() -> List[Dict[str, Any]]:
    res = supabase.table("clients").select("*").order("id").execute()
    return res.data or []


def fetch_client_by_id(client_id: int) -> Optional[Dict[str, Any]]:
    res = supabase.table("clients").select("*").eq("id", client_id).limit(1).execute()
    return res.data[0] if res.data else None


def insert_client(data: Dict[str, Any]) -> Dict[str, Any]:
    payload = dict(data)
    payload["reward_tier"] = compute_reward_tier(payload.get("reward_points", 0))
    res = supabase.table("clients").insert(payload).execute()
    return res.data[0]


def update_client_rewards(
    client_id: int, delta: int, event_type: str, reward_name: str
) -> Optional[Dict[str, Any]]:
    existing = fetch_client_by_id(client_id)
    if not existing:
        return None

    new_points = max(0, int(existing["reward_points"]) + delta)
    new_tier = compute_reward_tier(new_points)

    updated = (
        supabase.table("clients")
        .update({"reward_points": new_points, "reward_tier": new_tier})
        .eq("id", client_id)
        .execute()
    )
    supabase.table("reward_events").insert(
        {
            "client_id": client_id,
            "event_type": event_type,
            "points_delta": delta,
            "reward_name": reward_name,
        }
    ).execute()
    return updated.data[0]


def fetch_payments(status: Optional[str] = None) -> List[Dict[str, Any]]:
    query = supabase.table("payments").select("*, clients(name)").order("due_date", desc=True)
    if status:
        query = query.eq("status", status)
    res = query.execute()

    rows = []
    for r in res.data or []:
        client_info = r.pop("clients", None) or {}
        r["client_name"] = client_info.get("name", "Unknown")
        rows.append(r)
    return rows


def insert_payment(data: Dict[str, Any]) -> Dict[str, Any]:
    res = supabase.table("payments").insert(data).execute()
    created = res.data[0]

    if data["status"] == "overdue":
        client = fetch_client_by_id(data["client_id"])
        if client:
            supabase.table("clients").update(
                {"late_payments_90d": int(client["late_payments_90d"]) + 1}
            ).eq("id", data["client_id"]).execute()

    client = fetch_client_by_id(created["client_id"])
    created["client_name"] = client["name"] if client else "Unknown"
    return created