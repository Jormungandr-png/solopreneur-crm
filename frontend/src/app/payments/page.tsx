"use client";

import { useEffect, useState } from "react";
import {
  ClientItem,
  PaymentItem,
  PaymentsSummary,
  createPayment,
  fetchClients,
  fetchPayments,
  fetchPaymentsSummary,
} from "@/lib/api";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Plus,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const STATUS_BADGE: Record<string, string> = {
  paid: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  pending: "border-cyan-400/40 bg-cyan-500/15 text-cyan-200",
  overdue: "border-rose-400/40 bg-rose-500/15 text-rose-200",
  refunded: "border-slate-400/30 bg-slate-500/20 text-slate-300",
};

const glassCard =
  "relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-white/[0.11] to-white/[0.04] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)]";

const today = new Date().toISOString().split("T")[0];

export default function PaymentsPage() {
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    client_id: 0,
    amount: 99,
    currency: "USD",
    status: "paid",
    due_date: "",
    paid_date: "",
    provider: "stripe_link",
    notes: "",
  });

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setForm((prev) => ({
      ...prev,
      due_date: prev.due_date || today,
      paid_date: prev.paid_date || today,
    }));
  }, []);

  async function loadAll(statusFilter?: string) {
    setLoading(true);
    setError(null);
    try {
      const [sumData, payData, clientData] = await Promise.all([
        fetchPaymentsSummary(),
        fetchPayments(statusFilter || undefined),
        fetchClients(),
      ]);
      setSummary(sumData);
      setPayments(payData);
      setClients(clientData);
      if (clientData.length > 0 && form.client_id === 0) {
        setForm((prev) => ({
          ...prev,
          client_id: clientData[0].id,
          amount: clientData[0].monthly_fee,
        }));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load finances");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll(filter);
  }, [filter]);

  async function handleLogPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createPayment({
        ...form,
        paid_date: form.status === "paid" ? form.paid_date || today : null,
      });
      setShowModal(false);
      await loadAll(filter);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not log payment");
    }
  }

  const pieData = summary
    ? [
        { name: "Paid", value: summary.total_paid, color: "#34d399" },
        { name: "Pending", value: summary.total_pending, color: "#22d3ee" },
        { name: "Overdue", value: summary.total_overdue, color: "#fb7185" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3.5 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
            Cashflow, LTV & Late-Payment Churn Signal
          </div>
          <h2 className="mt-3 bg-gradient-to-r from-white via-indigo-100 to-cyan-200 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            Payments & Finances
          </h2>
          <p className="mt-1.5 text-sm text-slate-300">
            Track invoices across Stripe, Razorpay, and PayPal links—overdue entries automatically update churn risk
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-indigo-500/50"
        >
          <Plus className="h-4 w-4" />
          Log Payment
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* Financial KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className={`${glassCard} p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/40`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Net Collected
              </p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-emerald-300">
              ${summary.net_collected.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Paid total: ${summary.total_paid.toLocaleString()}
            </p>
          </div>

          <div className={`${glassCard} p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Pending Invoices
              </p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500 text-white shadow-lg">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-cyan-200">
              ${summary.total_pending.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-400">Awaiting client renewal</p>
          </div>

          <div className={`${glassCard} p-5 transition-all duration-300 hover:-translate-y-1 hover:border-rose-400/40`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Overdue Amount
              </p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-400 text-white shadow-lg">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-rose-300">
              ${summary.total_overdue.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {summary.overdue_count} overdue invoice(s)
            </p>
          </div>

          <div className={`${glassCard} p-5 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/40`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Est. Avg Client LTV
              </p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-white">
              ${summary.estimated_avg_client_ltv.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-400">Powered by ML churn rates</p>
          </div>
        </div>
      )}

      {/* Donut Chart + Ledger Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Donut Chart */}
        <div className={`${glassCard} p-6`}>
          <h3 className="text-base font-semibold text-white">Revenue Collection Split</h3>
          <p className="text-xs text-slate-300">Paid vs. pending vs. overdue balance</p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
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
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filterable Transactions Ledger */}
        <div className={`${glassCard} p-6 lg:col-span-2`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-cyan-300" />
              <h3 className="text-base font-semibold text-white">Payment Ledger</h3>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {["", "paid", "pending", "overdue", "refunded"].map((st) => (
                <button
                  key={st || "all"}
                  onClick={() => setFilter(st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                    filter === st
                      ? "border border-cyan-400/40 bg-indigo-500/30 text-white"
                      : "border border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.12]"
                  }`}
                >
                  {st || "All"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-slate-400">Loading ledger...</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-2.5">Client</th>
                    <th className="py-2.5">Amount</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Due Date</th>
                    <th className="py-2.5">Provider</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {payments.map((p) => (
                    <tr key={p.id} className="transition hover:bg-white/[0.04]">
                      <td className="py-3 font-medium text-white">{p.client_name}</td>
                      <td className="py-3 font-semibold text-slate-100">
                        ${Number(p.amount).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                            STATUS_BADGE[p.status] || STATUS_BADGE.pending
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-slate-300">{p.due_date}</td>
                      <td className="py-3 text-xs capitalize text-slate-400">
                        {p.provider.replace("_", " ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Log Payment Glass Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className={`${glassCard} w-full max-w-md bg-[#0d1323]/95 p-6`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Log Payment / Invoice</h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleLogPayment} className="mt-4 space-y-3 text-sm">
              <label className="block text-xs text-slate-300">
                Client
                <select
                  value={form.client_id}
                  onChange={(e) => {
                    const cid = Number(e.target.value);
                    const matched = clients.find((c) => c.id === cid);
                    setForm({
                      ...form,
                      client_id: cid,
                      amount: matched ? matched.monthly_fee : form.amount,
                    });
                  }}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#121a2e] px-3 py-2 text-white outline-none"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (${c.monthly_fee}/mo)
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs text-slate-300">
                  Amount ($)
                  <input
                    required
                    type="number"
                    min={1}
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-white outline-none"
                  />
                </label>

                <label className="block text-xs text-slate-300">
                  Status
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#121a2e] px-3 py-2 text-white outline-none"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue (raises churn risk)</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs text-slate-300">
                  Due Date
                  <input
                    required
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-white outline-none"
                  />
                </label>

                <label className="block text-xs text-slate-300">
                  Provider
                  <select
                    value={form.provider}
                    onChange={(e) => setForm({ ...form, provider: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#121a2e] px-3 py-2 text-white outline-none"
                  >
                    <option value="stripe_link">Stripe Link</option>
                    <option value="razorpay_link">Razorpay Link</option>
                    <option value="paypal_link">PayPal Link</option>
                    <option value="manual">Manual / UPI</option>
                  </select>
                </label>
              </div>

              <input
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-white placeholder-slate-400 outline-none"
              />

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
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}