from typing import List, Optional
from pydantic import BaseModel, Field


class RiskFactor(BaseModel):
    feature: str
    impact: float
    reason: str


class ChurnPrediction(BaseModel):
    churn_probability: float = Field(..., ge=0.0, le=1.0)
    risk_level: str  # Low, Medium, High
    top_reasons: List[RiskFactor]
    recommended_reward: str


class ClientCreate(BaseModel):
    name: str
    email: str
    niche: str = Field("fitness", pattern="^(fitness|gaming|creator_training)$")
    plan_tier: str = Field("Pro", pattern="^(Starter|Pro|VIP)$")
    monthly_fee: float = Field(99.0, gt=0)
    tenure_months: int = Field(1, ge=0)
    sessions_attended_30d: int = Field(4, ge=0)
    sessions_missed_30d: int = Field(0, ge=0)
    days_since_last_checkin: int = Field(2, ge=0)
    avg_reply_hours: float = Field(8.0, ge=0)
    sentiment_score: float = Field(0.4, ge=-1.0, le=1.0)
    late_payments_90d: int = Field(0, ge=0)
    reward_points: int = Field(100, ge=0)
    payment_link: str = ""


class ClientOut(BaseModel):
    id: int
    name: str
    email: str
    niche: str
    plan_tier: str
    monthly_fee: float
    status: str
    tenure_months: int
    sessions_attended_30d: int
    sessions_missed_30d: int
    days_since_last_checkin: int
    avg_reply_hours: float
    sentiment_score: float
    late_payments_90d: int
    reward_points: int
    reward_tier: str
    payment_link: str
    churn_prediction: ChurnPrediction


class RewardAction(BaseModel):
    points: int = Field(..., gt=0)
    reward_name: str


class PaymentCreate(BaseModel):
    client_id: int
    amount: float = Field(..., gt=0)
    currency: str = "USD"
    status: str = Field("paid", pattern="^(paid|pending|overdue|refunded)$")
    due_date: str  # YYYY-MM-DD
    paid_date: Optional[str] = None
    provider: str = Field("stripe_link", pattern="^(manual|stripe_link|razorpay_link|paypal_link)$")
    notes: str = ""


class PaymentOut(BaseModel):
    id: int
    client_id: int
    client_name: str
    amount: float
    currency: str
    status: str
    due_date: str
    paid_date: Optional[str]
    provider: str
    notes: str


class ChurnFeaturesInput(BaseModel):
    tenure_months: int = Field(..., ge=0)
    sessions_attended_30d: int = Field(..., ge=0)
    sessions_missed_30d: int = Field(..., ge=0)
    days_since_last_checkin: int = Field(..., ge=0)
    avg_reply_hours: float = Field(..., ge=0)
    sentiment_score: float = Field(..., ge=-1.0, le=1.0)
    late_payments_90d: int = Field(..., ge=0)
    monthly_fee: float = Field(99.0, gt=0)
    reward_points: int = Field(0, ge=0)


class InboxMessageInput(BaseModel):
    sender_name: str
    channel: str = "instagram_dm"
    body: str


class PrioritizedMessage(BaseModel):
    sender_name: str
    channel: str
    body: str
    urgency: str
    urgency_score: int
    sentiment: str
    suggested_reply: str