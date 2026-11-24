"use client";

import { useEffect, useState } from "react";
import {
  InboxMessageInput,
  PrioritizedMessage,
  fetchInbox,
  prioritizeInbox,
} from "@/lib/api";
import {
  AlertTriangle,
  Check,
  Copy,
  Inbox,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";

const URGENCY_BADGE: Record<string, string> = {
  urgent: "border-rose-400/40 bg-rose-500/15 text-rose-200",
  medium: "border-amber-400/40 bg-amber-500/15 text-amber-200",
  low: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
};

const SENTIMENT_BADGE: Record<string, string> = {
  negative: "border-rose-400/30 bg-rose-500/10 text-rose-300",
  neutral: "border-slate-400/30 bg-white/10 text-slate-200",
  positive: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
};

const glassCard =
  "relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-white/[0.11] to-white/[0.04] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)]";

export default function InboxPage() {
  const [ranked, setRanked] = useState<PrioritizedMessage[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const [newMsg, setNewMsg] = useState<InboxMessageInput>({
    sender_name: "",
    channel: "instagram_dm",
    body: "",
  });

  useEffect(() => {
    fetchInbox()
      .then(setRanked)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load saved inbox")
      )
      .finally(() => setInitialLoading(false));
  }, []);

  async function handleAddAndScore(e: React.FormEvent) {
    e.preventDefault();
    if (!newMsg.sender_name.trim() || !newMsg.body.trim()) return;
    const payload = { ...newMsg };

    setLoading(true);
    setError(null);
    try {
      const result = await prioritizeInbox([payload]);
      setRanked(result);
      setNewMsg({ sender_name: "", channel: "instagram_dm", body: "" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to score messages");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-3.5 py-1 text-xs font-semibold text-cyan-200 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
          Urgency Triage & Retention Reply Generator
        </div>
        <h2 className="mt-3 bg-gradient-to-r from-white via-indigo-100 to-cyan-200 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
          AI Inbox Prioritizer
        </h2>
        <p className="mt-1.5 text-sm text-slate-300">
          Paste client DMs from Instagram, Discord, WhatsApp, or Email—frustrated or churning clients jump straight to the top
        </p>
      </div>

      {/* Add Message Composer */}
      <form onSubmit={handleAddAndScore} className={`${glassCard} p-5 space-y-3`}>
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Plus className="h-4 w-4 text-cyan-300" />
          Add Incoming Client Message
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            required
            placeholder="Client Name (e.g. Rohan Kulkarni)"
            value={newMsg.sender_name}
            onChange={(e) => setNewMsg({ ...newMsg, sender_name: e.target.value })}
            className="rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-cyan-400"
          />

          <select
            value={newMsg.channel}
            onChange={(e) => setNewMsg({ ...newMsg, channel: e.target.value })}
            className="rounded-xl border border-white/15 bg-[#121a2e] px-3.5 py-2 text-sm text-white outline-none"
          >
            <option value="instagram_dm">Instagram DM</option>
            <option value="discord">Discord</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {loading ? "Scoring..." : "Analyze & Prioritize"}
          </button>
        </div>

        <textarea
          required
          rows={2}
          placeholder="Paste client message here..."
          value={newMsg.body}
          onChange={(e) => setNewMsg({ ...newMsg, body: e.target.value })}
          className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-cyan-400"
        />
      </form>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* Loading, Empty State, or Prioritized Queue */}
      {initialLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-white/[0.06]" />
          ))}
        </div>
      ) : ranked.length === 0 ? (
        <div className={`${glassCard} p-12 text-center`}>
          <Inbox className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-3 text-lg font-bold text-white">No messages yet</h3>
          <p className="mt-1 text-sm text-slate-400">
            Paste a client DM or email above to score its urgency and generate a retention reply.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ranked.map((msg, idx) => (
            <div
              key={msg.id ?? `${msg.sender_name}-${idx}`}
              className={`${glassCard} p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <MessageSquare className="h-4 w-4 text-cyan-300" />
                  <h3 className="text-base font-bold text-white">{msg.sender_name}</h3>
                  <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-[11px] font-medium capitalize text-slate-300">
                    {msg.channel.replace("_", " ")}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${
                      URGENCY_BADGE[msg.urgency]
                    }`}
                  >
                    {msg.urgency === "urgent" && <AlertTriangle className="h-3 w-3" />}
                    {msg.urgency} · {msg.urgency_score}/100
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                      SENTIMENT_BADGE[msg.sentiment]
                    }`}
                  >
                    {msg.sentiment}
                  </span>
                </div>
              </div>

              {msg.created_at && (
                <p className="mt-2 text-xs text-slate-400">
                  Received {new Date(msg.created_at).toLocaleString()}
                </p>
              )}
              <p className="mt-3 text-sm text-slate-200">&ldquo;{msg.body}&rdquo;</p>

              {/* AI Drafted Reply */}
              <div className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-indigo-400/25 bg-indigo-500/10 p-3.5">
                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
                    Suggested Retention Reply
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-white">
                    {msg.suggested_reply}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(msg.suggested_reply, idx)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                  {copiedIdx === idx ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Reply
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}