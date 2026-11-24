"use client";

import { useEffect, useState } from "react";
import {
  ClientItem,
  createClient,
  deleteClient,
  fetchClients,
  grantClientReward,
  redeemClientReward,
} from "@/lib/api";
import {
  AlertTriangle,
  Award,
  Gift,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

const RISK_STYLES: Record<string, { badge: string; bar: string }> = {
  High: {
    badge: "border-rose-400/40 bg-rose-500/15 text-rose-200",
    bar: "from-rose-500 to-orange-400",
  },
  Medium: {
    badge: "border-amber-400/40 bg-amber-500/15 text-amber-200",
    bar: "from-amber-400 to-yellow-300",
  },
  Low: {
    badge: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
    bar: "from-emerald-400 to-cyan-400",
  },
};

const glassCard =
  "relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-white/[0.11] to-white/[0.04] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)]";

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Add Client form state (niche is overridden by the backend using the logged-in coach's profile)
  const [form, setForm] = useState({
    name: "",
    email: "",
    niche: "fitness",
    plan_tier: "Pro",
    monthly_fee: 99,
    tenure_months: 1,
    sessions_attended_30d: 4,
    sessions_missed_30d: 1,
    days_since_last_checkin: 5,
    avg_reply_hours: 12,
    sentiment_score: 0.2,
    late_payments_90d: 0,
    reward_points: 100,
  });

  async function load(risk?: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClients(risk || undefined);
      setClients(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(filter);
  }, [filter]);

  async function handleGrant(client: ClientItem) {
    setBusyId(client.id);
    try {
      const updated = await grantClientReward(
        client.id,
        100,
        client.churn_prediction.recommended_reward
      );
      setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reward update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRedeem(client: ClientItem) {
    setBusyId(client.id);
    try {
      const updated = await redeemClientReward(client.id, 50, "Loyalty Perk Redeemed");
      setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Insufficient points");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(client: ClientItem) {
    if (!window.confirm(`Remove ${client.name} from your clients? This cannot be undone.`)) {
      return;
    }

    setBusyId(client.id);
    setError(null);
    try {
      await deleteClient(client.id);
      setClients((prev) => prev.filter((c) => c.id !== client.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not remove client");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const created = await createClient(form);
      setClients((prev) => [created, ...prev]);
      setShowModal(false);
      setForm({ ...form, name: "", email: "" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not add client");
    }
  }

  const visibleClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.niche.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3.5 py-1 text-xs font-semibold text-indigo-200 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            Explainable Churn Scoring & Loyalty Engine
          </div>
          <h2 className="mt-3 bg-gradient-to-r from-white via-indigo-100 to-cyan-200 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            Clients, Churn & Rewards
          </h2>
          <p className="mt-1.5 text-sm text-slate-300">
            Spot at-risk coaching clients early and trigger targeted retention rewards
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-indigo-500/50"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {/* Search + Risk Filters */}
      <div className={`${glassCard} flex flex-wrap items-center justify-between gap-4 p-4`}>
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name or email..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.06] py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 outline-none transition focus:border-cyan-400/50 focus:bg-white/[0.1]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {["", "High", "Medium", "Low"].map((level) => (
            <button
              key={level || "All"}
              onClick={() => setFilter(level)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                filter === level
                  ? "border border-cyan-400/40 bg-gradient-to-r from-indigo-500/30 to-cyan-500/25 text-white shadow-md shadow-indigo-500/20"
                  : "border border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.12] hover:text-white"
              }`}
            >
              {level ? `${level} Risk` : "All Clients"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* Clients List or Empty State */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-white/[0.06]" />
          ))}
        </div>
      ) : visibleClients.length === 0 ? (
        <div className={`${glassCard} p-12 text-center`}>
          <h3 className="text-lg font-bold text-white">No clients yet</h3>
          <p className="mt-1 text-sm text-slate-400">
            Add your first coaching client to start tracking churn risk and loyalty rewards.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Add Your First Client
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {visibleClients.map((client) => {
            const pred = client.churn_prediction;
            const style = RISK_STYLES[pred.risk_level] || RISK_STYLES.Low;
            const pct = Math.round(pred.churn_probability * 100);

            return (
              <div
                key={client.id}
                className={`${glassCard} group p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-2xl hover:shadow-indigo-500/10`}
              >
                {/* Top Row */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-lg font-bold text-white">{client.name}</h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}
                      >
                        {pred.risk_level === "High" && <AlertTriangle className="h-3 w-3" />}
                        {pred.risk_level} Risk · {pct}%
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-200">
                        <Award className="h-3 w-3" />
                        {client.reward_tier} · {client.reward_points} pts
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      <span className="capitalize">{client.niche.replace("_", " ")}</span> ·{" "}
                      {client.plan_tier} (${client.monthly_fee}/mo) · {client.tenure_months} mo tenure ·{" "}
                      Last check-in: {client.days_since_last_checkin}d ago
                    </p>
                  </div>

                  {/* Reward Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleGrant(client)}
                      disabled={busyId === client.id}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110 disabled:opacity-50"
                    >
                      <Gift className="h-3.5 w-3.5" />
                      {busyId === client.id ? "Updating..." : "Grant +100 Pts"}
                    </button>
                    <button
                      onClick={() => handleRedeem(client)}
                      disabled={busyId === client.id || client.reward_points < 50}
                      className="rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.14] disabled:opacity-40"
                    >
                      Redeem -50
                    </button>
                    <button
                      onClick={() => handleRemove(client)}
                      disabled={busyId === client.id}
                      aria-label={`Remove ${client.name}`}
                      title="Remove client"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {busyId === client.id ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>

                {/* Churn Probability Bar */}
                <div className="mt-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${style.bar} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Explainable ML Drivers + Recommended Reward */}
                <div className="mt-4 grid grid-cols-1 gap-4 border-t border-white/10 pt-4 md:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Top ML Risk Drivers
                    </p>
                    <ul className="mt-1.5 space-y-1 text-xs text-slate-200">
                      {pred.top_reasons.map((r, i) => (
                        <li key={i}>• {r.reason}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
                      AI Recommended Retention Reward
                    </p>
                    <p className="mt-1 text-xs font-medium text-white">
                      {pred.recommended_reward}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Client Glass Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className={`${glassCard} w-full max-w-lg bg-[#0d1323]/95 p-6`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Add New Coaching Client</h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="mt-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-white placeholder-slate-400 outline-none focus:border-cyan-400"
                />
                <input
                  required
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-white placeholder-slate-400 outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.plan_tier}
                  onChange={(e) => setForm({ ...form, plan_tier: e.target.value })}
                  className="rounded-xl border border-white/15 bg-[#121a2e] px-3 py-2 text-white outline-none"
                >
                  <option value="Starter">Starter</option>
                  <option value="Pro">Pro</option>
                  <option value="VIP">VIP</option>
                </select>
                <input
                  type="number"
                  min={1}
                  value={form.monthly_fee}
                  onChange={(e) => setForm({ ...form, monthly_fee: Number(e.target.value) })}
                  placeholder="Monthly Fee ($)"
                  className="rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="text-xs text-slate-300">
                  Days since check-in
                  <input
                    type="number"
                    min={0}
                    value={form.days_since_last_checkin}
                    onChange={(e) =>
                      setForm({ ...form, days_since_last_checkin: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-1.5 text-white outline-none"
                  />
                </label>
                <label className="text-xs text-slate-300">
                  Sessions missed
                  <input
                    type="number"
                    min={0}
                    value={form.sessions_missed_30d}
                    onChange={(e) =>
                      setForm({ ...form, sessions_missed_30d: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-1.5 text-white outline-none"
                  />
                </label>
                <label className="text-xs text-slate-300">
                  Late payments (90d)
                  <input
                    type="number"
                    min={0}
                    value={form.late_payments_90d}
                    onChange={(e) =>
                      setForm({ ...form, late_payments_90d: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-1.5 text-white outline-none"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30"
                >
                  Save & Score Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}