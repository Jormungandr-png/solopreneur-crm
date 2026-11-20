"use client";

import { useEffect, useState } from "react";
import { AnalyticsOverview, fetchAnalyticsOverview } from "@/lib/api";
import {
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Wallet,
  Sparkles,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsOverview()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200 backdrop-blur-xl">
        Error connecting to backend: {error}. Make sure FastAPI is running on port 8000.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 rounded-xl bg-white/10" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-white/[0.06]" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-80 rounded-2xl bg-white/[0.06]" />
          <div className="h-80 rounded-2xl bg-white/[0.06]" />
        </div>
      </div>
    );
  }

  const { kpis, niche_breakdown, revenue_forecast_3m } = data;

  const forecastChartData = [
    { month: "Current", "No Action": kpis.mrr, "With Rewards": kpis.mrr },
    ...revenue_forecast_3m.map((row) => ({
      month: row.month,
      "No Action": row.projected_mrr_no_action,
      "With Rewards": row.projected_mrr_with_rewards,
    })),
  ];

  const nicheChartData = Object.entries(niche_breakdown).map(([niche, stats]) => ({
    niche: niche
      .replace("_", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    MRR: stats.mrr,
    Clients: stats.clients,
    HighRisk: stats.high_risk_count,
  }));

  const kpiCards = [
    {
      label: "Monthly Recurring Revenue",
      value: `$${kpis.mrr.toLocaleString()}`,
      sub: `${kpis.total_active_clients} active clients`,
      icon: TrendingUp,
      iconBg: "from-indigo-500 to-cyan-400",
      valueColor: "text-white",
      glow: "hover:border-indigo-400/40 hover:shadow-indigo-500/20",
    },
    {
      label: "At-Risk Revenue",
      value: `$${kpis.at_risk_mrr.toLocaleString()}`,
      sub: `${kpis.high_risk_clients} high-risk clients`,
      icon: AlertTriangle,
      iconBg: "from-rose-500 to-orange-400",
      valueColor: "text-rose-300",
      glow: "hover:border-rose-400/40 hover:shadow-rose-500/20",
    },
    {
      label: "Predicted Retention",
      value: `${(kpis.retention_rate * 100).toFixed(1)}%`,
      sub: `Avg churn risk: ${(kpis.avg_churn_risk * 100).toFixed(1)}%`,
      icon: ShieldCheck,
      iconBg: "from-emerald-500 to-teal-400",
      valueColor: "text-emerald-300",
      glow: "hover:border-emerald-400/40 hover:shadow-emerald-500/20",
    },
    {
      label: "Overdue Invoices",
      value: `$${kpis.overdue_revenue.toLocaleString()}`,
      sub: `Collected: $${kpis.collected_revenue.toLocaleString()}`,
      icon: Wallet,
      iconBg: "from-amber-500 to-yellow-400",
      valueColor: "text-amber-300",
      glow: "hover:border-amber-400/40 hover:shadow-amber-500/20",
    },
  ];

  const glassCard =
    "relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-white/[0.11] to-white/[0.04] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)]";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1 text-xs font-semibold text-cyan-200 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
          Live ML Retention Telemetry
        </div>
        <h2 className="mt-3 bg-gradient-to-r from-white via-indigo-100 to-cyan-200 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
          Business Analytics
        </h2>
        <p className="mt-1.5 text-sm text-slate-300">
          Real-time MRR health, churn exposure, and 3-month retention impact
        </p>
      </div>

      {/* Glossy KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`${glassCard} ${card.glow} group p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {card.label}
                </p>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.iconBg} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className={`mt-4 text-3xl font-bold tracking-tight ${card.valueColor}`}>
                {card.value}
              </p>
              <p className="mt-1.5 text-xs font-medium text-slate-400">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Area Chart */}
        <div className={`${glassCard} p-6 transition-all duration-300 hover:border-white/25`}>
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-white">3-Month MRR Forecast</h3>
            <p className="text-xs text-slate-300">
              Projected recurring revenue with retention rewards vs. no intervention
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRewards" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradNoAction" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#cbd5e1" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: "#cbd5e1" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, ""]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.18)",
                    backgroundColor: "rgba(15,23,42,0.92)",
                    color: "#f8fafc",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#e2e8f0" }} />
                <Area
                  type="monotone"
                  dataKey="With Rewards"
                  stroke="#34d399"
                  strokeWidth={2.5}
                  fill="url(#gradRewards)"
                />
                <Area
                  type="monotone"
                  dataKey="No Action"
                  stroke="#fb7185"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="url(#gradNoAction)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className={`${glassCard} p-6 transition-all duration-300 hover:border-white/25`}>
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-white">Revenue by Coaching Niche</h3>
            <p className="text-xs text-slate-300">
              Monthly recurring revenue split across your active coaching segments
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nicheChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="niche" tick={{ fontSize: 12, fill: "#cbd5e1" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: "#cbd5e1" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, "MRR"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.18)",
                    backgroundColor: "rgba(15,23,42,0.92)",
                    color: "#f8fafc",
                  }}
                />
                <Bar dataKey="MRR" fill="url(#barGrad)" radius={[10, 10, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Niche Summary Glossy Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {nicheChartData.map((item) => (
          <div
            key={item.niche}
            className={`${glassCard} group p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/35 hover:shadow-xl hover:shadow-cyan-500/10`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{item.niche}</p>
              <Users className="h-4 w-4 text-slate-400 transition-colors group-hover:text-cyan-300" />
            </div>
            <p className="mt-2.5 text-2xl font-bold text-white">
              ${item.MRR.toLocaleString()}
              <span className="text-xs font-normal text-slate-400"> / mo</span>
            </p>
            <div className="mt-3 flex items-center gap-2.5 text-xs">
              <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-slate-200">
                {item.Clients} clients
              </span>
              <span className="rounded-full border border-rose-400/30 bg-rose-500/15 px-2.5 py-0.5 font-medium text-rose-200">
                {item.HighRisk} high-risk
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}