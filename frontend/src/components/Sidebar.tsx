"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Users, CreditCard, Inbox, Sparkles, LogOut, Whistle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export interface CoachProfile {
  email: string;
  fullName: string;
  age?: number;
  niche?: string;
}

const navItems = [
  { href: "/", label: "Analytics", icon: BarChart3 },
  { href: "/clients", label: "Clients & Churn", icon: Users },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/inbox", label: "AI Inbox", icon: Inbox },
];

export default function Sidebar({ profile }: { profile: CoachProfile }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const initial = profile.fullName.charAt(0).toUpperCase() || "C";

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)]">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 shadow-lg shadow-indigo-500/30">
          <Whistle className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white">CoachPulse AI</h1>
          <p className="text-[11px] font-medium text-slate-400">Solopreneur Retention CRM</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "border border-indigo-400/30 bg-gradient-to-r from-indigo-500/25 via-violet-500/20 to-cyan-500/15 text-white shadow-lg shadow-indigo-500/15"
                  : "border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <Icon
                className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${
                  active ? "text-cyan-300" : "text-slate-400 group-hover:text-white"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logged-in Coach Account Card */}
      <div className="space-y-3">
        <div className="rounded-xl border border-white/15 bg-white/[0.06] p-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 font-bold text-white">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">{profile.fullName}</p>
              <p className="truncate text-[11px] text-slate-400">{profile.email}</p>
            </div>
          </div>

          {(profile.age || profile.niche) && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {profile.age && (
                <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] text-slate-200">
                  Age {profile.age}
                </span>
              )}
              {profile.niche && (
                <span className="rounded-full border border-cyan-400/30 bg-cyan-500/15 px-2 py-0.5 text-[10px] capitalize text-cyan-200">
                  {profile.niche.replace("_", " ")}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-200"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}