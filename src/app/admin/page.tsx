"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { CoolThemeToggle } from "@/components/CoolThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { getAdminData, approveProfileAdmin, rejectProfileAdmin } from "./actions";
import { 
  CiVideoOn, 
  CiLogout, 
  CiCircleCheck, 
  CiCircleAlert, 
  CiCalendar, 
  CiMail, 
  CiUser, 
  CiImageOn 
} from "react-icons/ci";

interface Profile {
  id: string;
  email: string;
  status: "pending" | "active";
  payment_screenshot_url?: string;
  gemini_api_key?: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  // Admin Data State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, active: 0 });
  const [dataLoading, setDataLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter state
  const [filter, setFilter] = useState<"pending" | "active" | "all">("pending");

  // Selected screenshot for lightbox modal
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Status transitions tracking
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Verify auth session and fetch data
  const loadDashboardData = async () => {
    setDataLoading(true);
    setErrorMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setErrorMessage("Authentication session token missing. Please sign in again.");
        setDataLoading(false);
        return;
      }

      const res = await getAdminData(token);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setProfiles(res.profiles as Profile[]);
        setStats(res.stats);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to load admin dashboard data.");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isAdmin) {
        router.push("/");
      } else {
        loadDashboardData();
      }
    }
  }, [user, isAdmin, authLoading, router]);

  const handleApprove = async (profileId: string) => {
    setProcessingId(profileId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setErrorMessage("Authentication token missing.");
        return;
      }

      const res = await approveProfileAdmin(token, profileId);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage("User account activated successfully.");
        await loadDashboardData();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to approve user.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (profileId: string) => {
    if (!confirm("Are you sure you want to reject this payment screenshot? This will clear the screenshot so they can re-upload.")) {
      return;
    }

    setProcessingId(profileId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setErrorMessage("Authentication token missing.");
        return;
      }

      const res = await rejectProfileAdmin(token, profileId);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage("User screenshot rejected. User has been prompted to re-upload.");
        await loadDashboardData();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reject user screenshot.");
    } finally {
      setProcessingId(null);
    }
  };

  // Filter profiles based on selected view
  const filteredProfiles = profiles.filter((p) => {
    if (filter === "pending") {
      return p.status === "pending" && p.payment_screenshot_url;
    }
    if (filter === "active") {
      return p.status === "active";
    }
    return true; // "all"
  });

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="flex-grow flex items-center justify-center bg-background min-h-[70vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
            <img src="/ArtitubeNoBg.png" alt="Arti Tube Logo" className="h-9 w-9 object-contain" />
            <span className="font-bold text-lg">Arti Tube Administration</span>
          </div>

          <div className="flex items-center gap-4">
            <CoolThemeToggle size="sm" />
            <button
              onClick={() => router.push("/app")}
              className="px-4 py-1.5 text-xs font-semibold border rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              App Dashboard
            </button>
            <button
              onClick={signOut}
              className="p-2 border hover:bg-muted text-red-500 rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
            >
              <CiLogout size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow container mx-auto px-6 py-8 space-y-8">
        
        {/* Page Title & Status Alerts */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Overview Dashboard</h1>
            <p className="text-muted-foreground text-sm font-light mt-1">
              Verify payments, approve subscription requests, and check system statistics.
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-foreground text-background text-xs font-bold rounded-lg hover:bg-foreground/90 transition-all cursor-pointer"
          >
            Refresh Data
          </button>
        </div>

        {/* Feedback Messages */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl flex items-center gap-2"
            >
              <CiCircleAlert size={18} className="shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 text-xs rounded-xl flex items-center gap-2"
            >
              <CiCircleCheck size={18} className="shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="border rounded-2xl p-5 bg-card shadow-sm text-left">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Registered</div>
            <div className="text-3xl font-black text-foreground mt-1">{stats.total}</div>
            <div className="text-[10px] text-muted-foreground mt-1">Users inside database</div>
          </div>
          <div className="border rounded-2xl p-5 bg-card shadow-sm text-left border-amber-500/20 bg-amber-500/5">
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending Review</div>
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</div>
            <div className="text-[10px] text-amber-500 mt-1">Require action</div>
          </div>
          <div className="border rounded-2xl p-5 bg-card shadow-sm text-left border-green-500/20 bg-green-500/5">
            <div className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Active Subscribers</div>
            <div className="text-3xl font-black text-green-600 dark:text-green-400 mt-1">{stats.active}</div>
            <div className="text-[10px] text-green-500 mt-1">Unlimited access</div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-muted">
          {(["pending", "active", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`py-3 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                filter === t
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "pending" && "Pending Approval"}
              {t === "active" && "Active Users"}
              {t === "all" && "All Profiles"}
            </button>
          ))}
        </div>

        {/* Profiles Table / Grid */}
        {dataLoading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
            <p className="text-xs text-muted-foreground mt-3 font-light">Loading database profiles...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="border border-dashed rounded-2xl p-12 text-center text-muted-foreground bg-muted/5">
            <CiUser size={40} className="mx-auto opacity-50 mb-2" />
            <h3 className="font-bold text-foreground">No accounts found</h3>
            <p className="text-xs max-w-xs mx-auto mt-1 font-light">
              There are no user profiles that match the selected filter category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((p) => (
              <div
                key={p.id}
                className="border rounded-2xl p-5 bg-card shadow-sm flex flex-col justify-between gap-5 text-left transition-all hover:shadow-md"
              >
                <div className="space-y-3">
                  {/* Card Header (Email + Status) */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-foreground font-semibold text-sm truncate" title={p.email}>
                        <CiMail size={16} className="shrink-0" />
                        <span className="truncate">{p.email}</span>
                      </div>
                      <span className="text-[9px] text-muted-foreground font-mono block mt-0.5 truncate">ID: {p.id}</span>
                    </div>
                    <span
                      className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                        p.status === "active"
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  {/* Joined Date */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-light">
                    <CiCalendar size={15} />
                    <span>Registered: {new Date(p.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Payment Screenshot Display */}
                  {p.payment_screenshot_url ? (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Payment Proof
                      </span>
                      <div 
                        onClick={() => setLightboxUrl(p.payment_screenshot_url || null)}
                        className="relative border rounded-xl overflow-hidden aspect-[4/3] bg-muted/40 cursor-zoom-in hover:brightness-95 transition-all group"
                      >
                        <img
                          src={p.payment_screenshot_url}
                          alt="Payment screenshot proof"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity duration-300">
                          <CiImageOn size={20} className="mr-1" /> View Image
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed rounded-xl p-4 bg-muted/5 text-center text-muted-foreground text-xs font-light">
                      No screenshot uploaded.
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <button
                    onClick={() => handleApprove(p.id)}
                    disabled={processingId === p.id || p.status === "active"}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800/10 disabled:text-green-800/40 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {processingId === p.id ? (
                      <span className="inline-block animate-spin border-2 border-current border-t-transparent rounded-full h-3.5 w-3.5" />
                    ) : (
                      <CiCircleCheck size={16} />
                    )}
                    Approve
                  </button>

                  <button
                    onClick={() => handleReject(p.id)}
                    disabled={processingId === p.id || !p.payment_screenshot_url}
                    className="py-2 px-4 border border-red-500/20 text-red-500 hover:bg-red-500/5 disabled:border-muted/20 disabled:text-muted-foreground/30 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {processingId === p.id ? (
                      <span className="inline-block animate-spin border-2 border-current border-t-transparent rounded-full h-3.5 w-3.5" />
                    ) : (
                      <CiCircleAlert size={16} />
                    )}
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Screenshot Modal */}
      <AnimatePresence>
        {lightboxUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxUrl(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            {/* Content Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-card border shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center p-4 border-b">
                <span className="text-xs font-semibold text-muted-foreground">Payment Proof Verification</span>
                <button
                  onClick={() => setLightboxUrl(null)}
                  className="px-3 py-1 border text-xs font-semibold rounded-lg hover:bg-muted cursor-pointer"
                >
                  Close
                </button>
              </div>
              <div className="p-4 bg-muted/10 overflow-y-auto flex items-center justify-center">
                <img
                  src={lightboxUrl}
                  alt="High resolution payment screenshot"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
