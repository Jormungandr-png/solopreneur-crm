"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, ArrowRight, Calendar, Lock, Mail, User, Whistle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<1 | 2>(1);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [niche, setNiche] = useState("fitness");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Step 1 of signup just advances to Step 2
    if (mode === "signup" && step === 1) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              age: Number(age),
              niche,
            },
          },
        });
        if (signUpErr) throw signUpErr;
        if (data.session) {
          router.push("/");
        } else {
          setMessage("Account created! Check your email to confirm, then sign in.");
          setMode("login");
          setStep(1);
        }
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) throw signInErr;
        router.push("/");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.12] to-white/[0.04] p-8 backdrop-blur-2xl shadow-[0_12px_48px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.22)]">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 shadow-lg shadow-indigo-500/30">
            <Whistle className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-4 bg-gradient-to-r from-white via-indigo-100 to-cyan-200 bg-clip-text text-2xl font-extrabold text-transparent">
            CoachPulse AI
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            {mode === "login"
              ? "Sign in to your private coaching dashboard"
              : `Step ${step} of 2 — ${step === 1 ? "Account credentials" : "Your coach profile"}`}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/10 bg-white/[0.05] p-1">
          {(["login", "signup"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setMode(tab);
                setStep(1);
                setError(null);
                setMessage(null);
              }}
              className={`rounded-lg py-2 text-xs font-semibold transition ${
                mode === tab
                  ? "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {tab === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(mode === "login" || step === 1) && (
            <>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="email"
                  placeholder="Coach email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/[0.06] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 outline-none focus:border-cyan-400"
                />
              </div>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="password"
                  minLength={6}
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/[0.06] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 outline-none focus:border-cyan-400"
                />
              </div>
            </>
          )}

          {mode === "signup" && step === 2 && (
            <>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="text"
                  placeholder="Full Name (e.g. Advait Gowari)"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/[0.06] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    type="number"
                    min={16}
                    max={99}
                    placeholder="Age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/[0.06] py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-400 outline-none focus:border-cyan-400"
                  />
                </div>

                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="rounded-xl border border-white/15 bg-[#121a2e] px-3 py-2.5 text-sm text-white outline-none"
                >
                  <option value="fitness">Fitness Coach</option>
                  <option value="gaming">Gaming Coach</option>
                  <option value="creator_training">Creator Trainer</option>
                </select>
              </div>
            </>
          )}

          {error && (
            <p className="rounded-xl border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-xs text-rose-200">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-200">
              {message}
            </p>
          )}

          <div className="flex gap-2">
            {mode === "signup" && step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110 disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Sign In"
                : step === 1
                ? "Next: Profile Info"
                : "Create Account"}
              {mode === "signup" && step === 1 && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}