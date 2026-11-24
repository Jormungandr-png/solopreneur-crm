"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar, { CoachProfile } from "@/components/Sidebar";
import type { Session } from "@supabase/supabase-js";

function extractProfile(session: Session | null): CoachProfile | null {
  if (!session?.user) return null;
  const meta = session.user.user_metadata || {};
  return {
    email: session.user.email || "",
    fullName: meta.full_name || "Coach",
    age: meta.age ? Number(meta.age) : undefined,
    niche: meta.niche || undefined,
  };
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<CoachProfile | null>(null);

  const isAuthPage = pathname === "/login";

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const p = extractProfile(data.session);
      setProfile(p);
      setChecking(false);

      if (!p && !isAuthPage) {
        router.replace("/login");
      } else if (p && isAuthPage) {
        router.replace("/");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const p = extractProfile(session);
      setProfile(p);
      if (!p && pathname !== "/login") {
        router.replace("/login");
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [isAuthPage, pathname, router]);

  if (isAuthPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  if (checking || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
        Verifying session...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} />
      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}