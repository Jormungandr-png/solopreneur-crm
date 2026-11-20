const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export interface RiskFactor {
  feature: string;
  impact: number;
  reason: string;
}

export interface ChurnPrediction {
  churn_probability: number;
  risk_level: "Low" | "Medium" | "High";
  top_reasons: RiskFactor[];
  recommended_reward: string;
}

export interface ClientItem {
  id: number;
  name: string;
  email: string;
  niche: string;
  plan_tier: string;
  monthly_fee: number;
  status: string;
  tenure_months: number;
  sessions_attended_30d: number;
  sessions_missed_30d: number;
  days_since_last_checkin: number;
  reward_points: number;
  reward_tier: string;
  payment_link: string;
  churn_prediction: ChurnPrediction;
}

export interface AnalyticsOverview {
  kpis: {
    total_active_clients: number;
    high_risk_clients: number;
    mrr: number;
    at_risk_mrr: number;
    avg_churn_risk: number;
    retention_rate: number;
    collected_revenue: number;
    overdue_revenue: number;
  };
  niche_breakdown: Record<
    string,
    { clients: number; mrr: number; high_risk_count: number }
  >;
  revenue_forecast_3m: {
    month: string;
    projected_mrr_no_action: number;
    projected_mrr_with_rewards: number;
  }[];
}

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverview> {
  const res = await fetch(`${API_BASE}/api/analytics/overview`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load analytics overview");
  return res.json();
}

export async function fetchClients(riskLevel?: string): Promise<ClientItem[]> {
  const url = riskLevel
    ? `${API_BASE}/api/clients?risk_level=${riskLevel}`
    : `${API_BASE}/api/clients`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load clients");
  return res.json();
}

export async function grantClientReward(
  clientId: number,
  points: number,
  rewardName: string
): Promise<ClientItem> {
  const res = await fetch(`${API_BASE}/api/clients/${clientId}/rewards/grant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ points, reward_name: rewardName }),
  });
  if (!res.ok) throw new Error("Failed to grant reward");
  return res.json();
}

export async function createClient(payload: {
  name: string;
  email: string;
  niche: string;
  plan_tier: string;
  monthly_fee: number;
  tenure_months: number;
  sessions_attended_30d: number;
  sessions_missed_30d: number;
  days_since_last_checkin: number;
  avg_reply_hours: number;
  sentiment_score: number;
  late_payments_90d: number;
  reward_points: number;
}): Promise<ClientItem> {
  const res = await fetch(`${API_BASE}/api/clients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create client");
  return res.json();
}

export async function redeemClientReward(
  clientId: number,
  points: number,
  rewardName: string
): Promise<ClientItem> {
  const res = await fetch(`${API_BASE}/api/clients/${clientId}/rewards/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ points, reward_name: rewardName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to redeem reward");
  }
  return res.json();
}

export interface PaymentItem {
  id: number;
  client_id: number;
  client_name: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "overdue" | "refunded";
  due_date: string;
  paid_date?: string | null;
  provider: string;
  notes: string;
}

export interface PaymentsSummary {
  total_paid: number;
  total_pending: number;
  total_overdue: number;
  total_refunded: number;
  net_collected: number;
  estimated_avg_client_ltv: number;
  overdue_count: number;
}

export async function fetchPayments(status?: string): Promise<PaymentItem[]> {
  const url = status
    ? `${API_BASE}/api/payments?status=${status}`
    : `${API_BASE}/api/payments`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load payments");
  return res.json();
}

export async function fetchPaymentsSummary(): Promise<PaymentsSummary> {
  const res = await fetch(`${API_BASE}/api/payments/summary`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load payment summary");
  return res.json();
}

export async function createPayment(payload: {
  client_id: number;
  amount: number;
  currency: string;
  status: string;
  due_date: string;
  paid_date?: string | null;
  provider: string;
  notes: string;
}): Promise<PaymentItem> {
  const res = await fetch(`${API_BASE}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to log payment");
  return res.json();
}


export interface InboxMessageInput {
  sender_name: string;
  channel: string;
  body: string;
}

export interface PrioritizedMessage {
  sender_name: string;
  channel: string;
  body: string;
  urgency: "urgent" | "medium" | "low";
  urgency_score: number;
  sentiment: "negative" | "neutral" | "positive";
  suggested_reply: string;
}

export async function prioritizeInbox(
  messages: InboxMessageInput[]
): Promise<PrioritizedMessage[]> {
  const res = await fetch(`${API_BASE}/api/inbox/prioritize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });
  if (!res.ok) throw new Error("Failed to prioritize inbox");
  return res.json();
}