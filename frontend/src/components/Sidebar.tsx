"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Users, CreditCard, Inbox, Sparkles } from "lucide-react";

const navItems = [
  { href: "/", label: "Analytics", icon: BarChart3 },
  { href: "/clients", label: "Clients & Churn", icon: Users },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/inbox", label: "AI Inbox", icon: Inbox },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)]">
      {/* Brand */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 shadow-lg shadow-indigo-500/30">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white">
            CoachPulse AI
          </h1>
          <p className="text-[11px] font-medium text-slate-400">
            Solopreneur Retention CRM
          </p>
        </div>
      </div>

      {/* Navigation */}
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

      {/* Live Status Pill */}
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-300 backdrop-blur-md">
        <div className="flex items-center gap-2 font-medium text-emerald-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          ML Engine Online
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Connected to FastAPI & Supabase
        </p>
      </div>
    </aside>
  );
}