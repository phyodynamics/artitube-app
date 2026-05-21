"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { CoolThemeToggle } from "@/components/CoolThemeToggle";
import { motion } from "framer-motion";
import { CiClock2, CiVideoOn } from "react-icons/ci";

export default function PendingPage() {
  const { user, profile, loading, isAdmin, refreshProfile, signOut } = useAuth();
  const router = useRouter();

  // Poll profile status every 4 seconds to check if approved
  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/");
      return;
    }

    if (isAdmin || profile?.status === "active") {
      router.push("/app");
      return;
    }

    // Set up polling interval
    const interval = setInterval(async () => {
      await refreshProfile();
    }, 4000);

    return () => clearInterval(interval);
  }, [user, profile, loading, isAdmin, router, refreshProfile]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-[70vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-md flex-grow flex flex-col justify-center text-center">
      {/* Header */}
      <div className="flex items-center justify-between pb-8 border-b mb-12">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
          <img src="/ArtitubeNoBg.png" alt="Arti Tube Logo" className="h-9 w-9 object-contain" />
          <span className="font-bold text-lg">Arti Tube</span>
        </div>
        <div className="flex items-center gap-4">
          <CoolThemeToggle size="sm" />
          <button
            onClick={signOut}
            className="px-4 py-1.5 text-xs font-medium border text-red-500 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="border rounded-2xl p-8 bg-card shadow-xl space-y-6 relative overflow-hidden">
        {/* Animated Background rings */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/5 rounded-full blur-3xl z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center space-y-4">
          {/* Pulsing clock icon */}
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="h-16 w-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20"
          >
            <CiClock2 size={36} className="stroke-[1.5]" />
          </motion.div>

          <h1 className="text-2xl font-bold tracking-tight">Payment Verification Pending</h1>
          <p className="text-muted-foreground text-sm font-light leading-relaxed">
            Your screenshot has been submitted and is currently being verified by an admin. Verification usually takes <strong>5-10 minutes</strong>.
          </p>
        </div>

        {/* Status display */}
        <div className="bg-muted/40 rounded-xl p-4 flex items-center justify-between text-left text-xs border relative z-10">
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200">Account status</div>
            <div className="text-muted-foreground font-light mt-0.5">Waiting for administrator review</div>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold animate-pulse">
            Pending
          </div>
        </div>

        {/* Live helper tip */}
        <p className="text-[11px] text-muted-foreground font-light italic relative z-10">
          Tip: You do not need to refresh this page. It will automatically redirect you once your payment is approved.
        </p>
      </div>
    </div>
  );
}
