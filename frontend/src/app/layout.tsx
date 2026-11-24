import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "CoachPulse AI — Solopreneur CRM & Churn Analytics",
  description: "Client retention, churn prediction, rewards, and finance tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#070b14] text-slate-100 antialiased selection:bg-indigo-500/30">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/4 h-[28rem] w-[28rem] rounded-full bg-indigo-600/25 blur-[120px]" />
          <div className="absolute top-1/3 right-0 h-[26rem] w-[26rem] rounded-full bg-cyan-500/20 blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-emerald-500/15 blur-[120px]" />
        </div>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}