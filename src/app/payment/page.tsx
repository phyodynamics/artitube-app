"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { CoolThemeToggle } from "@/components/CoolThemeToggle";
import { AnimatedCopyButton } from "@/components/AnimatedCopyButton";
import { SlideToConfirm } from "@/components/SlideToConfirm";
import { supabase } from "@/lib/supabase";
import { CiWallet, CiFileOn, CiFolderOn, CiVideoOn } from "react-icons/ci";

export default function PaymentPage() {
  const { user, profile, loading, isAdmin, updateProfileStatus, signOut } = useAuth();
  const router = useRouter();
  const [selectedWallet, setSelectedWallet] = useState<"kpay" | "wave" | "uab">("kpay");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Redirect logic
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
      } else if (isAdmin || profile?.status === "active") {
        router.push("/app");
      } else if (profile?.status === "pending" && profile?.payment_screenshot_url) {
        // If they already submitted payment and are pending, redirect to pending page
        router.push("/pending");
      }
    }
  }, [user, profile, loading, isAdmin, router]);

  const walletDetails = {
    kpay: {
      name: "KBZPay",
      logo: "/KpayLogo.png",
      qr: "/kpay.jpeg",
      accountName: "PHYO ZIN KO",
    },
    wave: {
      name: "WaveMoney",
      logo: "/WaveLogo.png",
      qr: "/wave.jpg",
      accountName: "PHYO ZIN KO",
    },
    uab: {
      name: "uabpay",
      logo: "/uablogo.jpg",
      qr: "/uab.jpg",
      accountName: "PHYO ZIN KO",
    },
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setScreenshotError(null);

    if (file) {
      // 5 MB limit
      if (file.size > 5 * 1024 * 1024) {
        setScreenshotError("Screenshot size exceeds 5MB limit. Please upload a smaller file.");
        setScreenshot(null);
        setPreviewUrl(null);
        return;
      }
      setScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleConfirmPayment = async () => {
    if (!screenshot) {
      setScreenshotError("Please upload a payment screenshot first.");
      throw new Error("No screenshot uploaded");
    }

    try {
      let finalScreenshotUrl = "https://kfvwtxyjqvkfgtoyigbv.supabase.co/storage/v1/object/public/screenshots/mock-payment.png";

      // Try uploading to Supabase Storage screenshots bucket
      try {
        const fileExt = screenshot.name.split('.').pop();
        const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from("payment-screenshots")
          .upload(fileName, screenshot, { cacheControl: "3600", upsert: true });

        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage
            .from("payment-screenshots")
            .getPublicUrl(fileName);
          finalScreenshotUrl = publicUrl;
        } else {
          console.warn("Storage upload failed or bucket doesn't exist, falling back to database column update:", error);
        }
      } catch (uploadErr) {
        console.warn("Upload exception caught. Using placeholder screenshot URL:", uploadErr);
      }

      // Update profile status to pending and save screenshot URL
      await updateProfileStatus("pending", finalScreenshotUrl);
      
      // Delay slightly for smooth page transition
      await new Promise(resolve => setTimeout(resolve, 800));
      router.push("/pending");
    } catch (err) {
      console.error("Confirmation error:", err);
      setScreenshotError("Something went wrong. Please check your network and try again.");
      throw err;
    }
  };

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-[70vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  const activeWallet = walletDetails[selectedWallet];

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl flex-grow flex flex-col justify-center">
      {/* Header */}
      <div className="flex items-center justify-between pb-8 border-b mb-8">
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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column - Pricing & Wallets */}
        <div className="md:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-primary/80 uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-full dark:bg-slate-800 dark:text-slate-300">
              Subscription Activation
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">Unlock Unlimited AI Analysis</h1>
            <p className="text-muted-foreground text-sm font-light">
              Make a one-time payment of <strong>30,000 MMK</strong> to activate lifetime access to Arti Tube.
            </p>
          </div>

          {/* Pricing Info box */}
          <div className="border rounded-2xl p-5 bg-card flex items-center gap-4 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <CiWallet size={28} className="text-foreground/80" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Price</div>
              <div className="text-2xl font-black text-foreground">30,000 MMK</div>
              <div className="text-[10px] text-muted-foreground">One-time payment • Lifetime updates</div>
            </div>
          </div>

          {/* Select payment method */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Select Wallet
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(walletDetails) as Array<keyof typeof walletDetails>).map((key) => {
                const w = walletDetails[key];
                const isSelected = selectedWallet === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedWallet(key)}
                    className={`border rounded-xl p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? "border-foreground bg-foreground/5 shadow-md scale-[1.02]"
                        : "bg-background hover:bg-muted/30 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={w.logo}
                      alt={w.name}
                      className="h-7 object-contain rounded-md"
                    />
                    <span className="text-[11px] font-semibold">{w.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payee Info card */}
          <div className="border rounded-2xl p-5 space-y-4 bg-muted/20">
            <div className="flex justify-between items-center text-sm border-b pb-2.5">
              <span className="text-muted-foreground font-light">Transfer To:</span>
              <span className="font-bold">{activeWallet.accountName}</span>
            </div>

            <div className="flex justify-between items-center text-sm border-b pb-2.5">
              <span className="text-muted-foreground font-light">Phone Number:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold tracking-wider text-base">09699120345</span>
                <AnimatedCopyButton textToCopy="09699120345" size="sm" />
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 text-[11px] rounded-lg p-3 text-amber-600 dark:text-amber-400 font-light leading-relaxed text-left">
              Please transfer exactly 30,000 MMK to the number above using {activeWallet.name}, download the payment transaction screenshot, and upload it on the right to complete activation.
            </div>
          </div>
        </div>

        {/* Right Column - QR Code & Upload Screen */}
        <div className="md:col-span-5 space-y-6">
          {/* QR Code container */}
          <div className="border rounded-2xl p-6 bg-card flex flex-col items-center justify-center text-center shadow-lg">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Scan QR to Pay
            </span>
            <div className="relative border rounded-xl overflow-hidden bg-white p-2 w-48 h-48 flex items-center justify-center shadow-inner">
              <img
                src={activeWallet.qr}
                alt={`${activeWallet.name} QR Code`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <span className="text-[11px] font-bold text-foreground mt-3 uppercase tracking-wider">
              {activeWallet.name} Payee QR
            </span>
          </div>

          {/* Screenshot Upload Field */}
          <div className="border rounded-2xl p-6 bg-card space-y-4 shadow-sm text-left">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Payment Verification
            </span>

            {/* Custom file upload card */}
            <div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-muted/10 transition-colors relative cursor-pointer min-h-[140px]">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {previewUrl ? (
                <div className="space-y-2 w-full flex flex-col items-center">
                  <img
                    src={previewUrl}
                    alt="Screenshot preview"
                    className="max-h-24 object-contain rounded-md shadow-sm"
                  />
                  <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
                    {screenshot?.name}
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5 flex flex-col items-center text-muted-foreground">
                  <CiFolderOn size={32} className="opacity-60" />
                  <div className="text-xs font-medium">Click or Drag Screenshot Here</div>
                  <div className="text-[10px] opacity-70">PNG, JPG, or JPEG (Max 5MB)</div>
                </div>
              )}
            </div>

            {screenshotError && (
              <div className="text-[11px] text-red-500 font-medium text-left">
                {screenshotError}
              </div>
            )}

            {/* Confirm via Slide to Confirm slider */}
            <div className="flex justify-center pt-2">
              <SlideToConfirm
                text="Slide to confirm payment"
                successText="Screenshot submitted"
                onConfirm={handleConfirmPayment}
                width={280}
                height={50}
                className={!screenshot ? "opacity-50 pointer-events-none" : ""}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
