"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { CoolThemeToggle } from "@/components/CoolThemeToggle";
import { BlurReveal } from "@/components/ui/blur-reveal";
import { SocialProofAvatars } from "@/components/ui/social-proof-avatars";
import { Marquee } from "@/components/ui/marquee";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CiVideoOn, 
  CiChat1, 
  CiBookmark, 
  CiLock, 
  CiPlay1, 
  CiSearch,
  CiHeart,
  CiStar,
  CiCircleCheck
} from "react-icons/ci";

export default function LandingPage() {
  const { user, profile, isAdmin, signInWithGoogle, signOut } = useAuth();
  const router = useRouter();
  const [demoStep, setDemoStep] = useState(0);

  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-play the simulated app demo
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle redirect if logged in
  const handleStartRedirect = () => {
    if (!user) {
      // Prompt sign in
      document.getElementById("auth-section")?.scrollIntoView({ behavior: "smooth" });
    } else {
      if (isAdmin || profile?.status === "active") {
        router.push("/app");
      } else if (profile?.status === "pending") {
        router.push("/pending");
      } else {
        router.push("/payment");
      }
    }
  };

  const reviews = [
    { name: "Min Hein", role: "Computer Science Student", comment: "Arti Tube helped me pass my data structures exam. Summarizing 2-hour lectures into simple notes is a lifesaver!" },
    { name: "Aye Myat", role: "Product Designer", comment: "The design is gorgeous! I watch UI tutorials, chat with the agent to understand parts, and jump directly to timestamps." },
    { name: "Kyaw Zeya", role: "Software Developer", comment: "Being able to keep learning notes right next to the YouTube player while discussing logic with AI is incredibly useful." },
    { name: "Phyu Phyu", role: "Digital Marketer", comment: "No more scrolling through long videos. I just paste the link and get immediate insights. Paid version is worth every kyat." },
  ];

  const avatars = [
    { src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80", alt: "User 1" },
    { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80", alt: "User 2" },
    { src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80", alt: "User 3" },
    { src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80", alt: "User 4" },
    { src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80", alt: "User 5" },
  ];

  // Motion video mockup camera pan/zoom animations based on current step
  const cameraConfig = [
    { scale: 1, x: 0, y: 0, desc: "Paste YouTube link in search bar" },
    { scale: 1.15, x: 80, y: 50, desc: "Theater player mounts instantly" },
    { scale: 1.2, x: -100, y: -40, desc: "AI fetches video data and opens chat" },
    { scale: 1.35, x: -120, y: -100, desc: "Converse with AI, generate timestamps" },
    { scale: 1.25, x: -100, y: 100, desc: "Save markdown learning notes to history" }
  ];

  const currentCam = cameraConfig[demoStep];

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
            <img src="/ArtitubeNoBg.png" alt="Arti Tube Logo" className="h-10 w-10 object-contain" />
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Arti Tube
            </span>
          </div>

          <div className="flex items-center gap-4">
            <CoolThemeToggle size="md" />
            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button
                    onClick={() => router.push("/admin")}
                    className="px-4 py-2 text-sm font-semibold text-amber-500 border border-amber-500/20 rounded-full hover:bg-amber-500/10 transition-colors cursor-pointer"
                  >
                    Admin Panel
                  </button>
                )}
                <button
                  onClick={handleStartRedirect}
                  className="px-4 py-2 text-sm font-medium border rounded-full hover:bg-muted transition-colors cursor-pointer"
                >
                  Dashboard
                </button>
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-full hover:bg-foreground/90 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => document.getElementById("auth-section")?.scrollIntoView({ behavior: "smooth" })}
                className="px-5 py-2 text-sm font-medium bg-foreground text-background rounded-full hover:bg-foreground/90 transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-16 pb-24 text-center max-w-4xl">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-muted/40 text-sm font-medium text-muted-foreground mb-4">
            <CiStar size={16} className="text-amber-500" />
            <span>AI-Powered YouTube Learning Companion</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            <BlurReveal delay={0.1}>Learn from YouTube</BlurReveal>{" "}
            <br />
            <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-slate-100 dark:via-slate-300 dark:to-slate-500 bg-clip-text text-transparent">
              <BlurReveal delay={0.25}>Interactive Chat & Notes</BlurReveal>
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            <BlurReveal delay={0.4}>
              Paste any YouTube link, watch it in Theater Mode, and chat with an intelligent AI agent to generate summaries, highlight key moments, and write notes in real time.
            </BlurReveal>
          </p>

          <div className="pt-6 flex justify-center gap-4">
            <button
              onClick={handleStartRedirect}
              className="px-8 py-4 bg-foreground text-background rounded-full text-base font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center gap-2 cursor-pointer"
            >
              <CiPlay1 size={18} className="stroke-[2]" />
              Start Learning Now
            </button>
          </div>

          {/* Social Proof */}
          <div className="pt-10">
            <SocialProofAvatars avatars={avatars} extraCount={142} stars={true}>
              <p className="text-sm text-muted-foreground mt-2 font-light">
                Trusted by 500+ students and developers in Myanmar
              </p>
            </SocialProofAvatars>
          </div>
        </div>
      </section>

      {/* Animated Motion Video Simulator */}
      <section className="bg-muted/30 border-y py-20 flex flex-col items-center">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Experience the Application</h2>
            <p className="text-muted-foreground max-w-md mx-auto text-sm font-light">
              See how Arti Tube dynamically fetches, summarizes, and chats about any YouTube video.
            </p>
          </div>

          {/* Device Frame */}
          <div className="relative border rounded-2xl bg-background shadow-2xl overflow-hidden aspect-[16/9] w-full max-w-4xl mx-auto">
            {/* Window controls */}
            <div className="h-10 border-b bg-muted/20 flex items-center px-4 gap-2 justify-between">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-400/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-400/80 inline-block" />
              </div>
              <div className="text-xs text-muted-foreground font-light flex items-center gap-1.5 bg-muted/60 px-3 py-1 rounded-md max-w-xs overflow-hidden">
                <CiLock size={12} />
                <span>artitube.com/app</span>
              </div>
              <div className="w-12" />
            </div>

            {/* Application Screen Mockup with Pan/Zoom motion wrapper */}
            <div className="w-full h-[calc(100%-40px)] relative overflow-hidden bg-background">
              <motion.div
                animate={{
                  scale: currentCam.scale,
                  x: currentCam.x,
                  y: currentCam.y,
                }}
                transition={{ type: "spring", stiffness: 90, damping: 20, mass: 0.8 }}
                className="w-full h-full p-4 flex gap-4 select-none origin-center"
              >
                {/* Main app panel */}
                <div className="flex-1 flex flex-col gap-3 h-full">
                  {/* YouTube url input bar */}
                  <div className="flex gap-2">
                    <div className="flex-1 border bg-muted/20 rounded-lg px-3 py-2 flex items-center gap-2 text-xs">
                      <CiSearch size={14} className="text-muted-foreground" />
                      <div className="text-foreground overflow-hidden whitespace-nowrap text-left flex-1 font-mono">
                        {demoStep === 0 ? (
                          <motion.span
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2 }}
                            className="inline-block overflow-hidden"
                          >
                            https://youtube.com/watch?v=XYeYmTH-2b8
                          </motion.span>
                        ) : (
                          "https://youtube.com/watch?v=XYeYmTH-2b8"
                        )}
                      </div>
                    </div>
                    <button className="px-3 bg-foreground text-background text-xs rounded-lg font-medium flex items-center gap-1">
                      Fetch
                    </button>
                  </div>

                  {/* Theater Player mock */}
                  <div className="flex-1 border bg-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center">
                    {demoStep === 0 ? (
                      <div className="flex flex-col items-center gap-3 text-white/50 text-xs">
                        <CiVideoOn size={36} />
                        <span>Enter link to start theater video</span>
                      </div>
                    ) : (
                      <div className="w-full h-full relative">
                        <iframe
                          src="https://www.youtube.com/embed/XYeYmTH-2b8?autoplay=1&mute=1&controls=0&loop=1&playlist=XYeYmTH-2b8"
                          className="w-full h-full border-none pointer-events-none"
                          allow="autoplay; encrypted-media"
                        />
                        {/* Video Controls overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-[10px] text-white/80">
                          <span>01:45 / 09:20</span>
                          <div className="w-1/2 h-1 bg-white/20 rounded-full overflow-hidden">
                            <div className="w-1/5 h-full bg-red-500" />
                          </div>
                          <span>Theater Mode</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar chat & notes */}
                <div className="w-72 border rounded-xl flex flex-col overflow-hidden bg-background">
                  {/* Tabs */}
                  <div className="flex border-b text-[10px] font-medium bg-muted/20 relative">
                    <button
                      onClick={() => {
                        setDemoStep(2);
                        setIsPlaying(false);
                      }}
                      className={`flex-1 py-2 text-center relative transition-colors duration-200 cursor-pointer ${
                        demoStep === 2 || demoStep === 3 ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      AI Chat
                      {(demoStep === 2 || demoStep === 3) && (
                        <motion.div layoutId="mockTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setDemoStep(1);
                        setIsPlaying(false);
                      }}
                      className={`flex-1 py-2 text-center relative transition-colors duration-200 cursor-pointer ${
                        demoStep === 1 ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Insights
                      {demoStep === 1 && (
                        <motion.div layoutId="mockTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setDemoStep(4);
                        setIsPlaying(false);
                      }}
                      className={`flex-1 py-2 text-center relative transition-colors duration-200 cursor-pointer ${
                        demoStep === 4 ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Notes
                      {demoStep === 4 && (
                        <motion.div layoutId="mockTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                      )}
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="flex-1 p-3 overflow-hidden text-[10px] flex flex-col justify-between">
                    <AnimatePresence mode="wait">
                      {demoStep === 0 && (
                        <motion.div
                          key="step-0"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.25 }}
                          className="flex-grow flex items-center justify-center text-muted-foreground h-full"
                        >
                          Enter video link to start
                        </motion.div>
                      )}

                      {demoStep === 1 && (
                        <motion.div
                          key="step-1"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-2 text-left h-full"
                        >
                          <div className="font-semibold text-xs border-b pb-1 text-slate-800 dark:text-slate-200">Video Summary</div>
                          <p className="text-muted-foreground leading-relaxed">This video outlines the roadmap to building scalable web applications, highlighting database architectures and AI models.</p>
                          <div className="font-semibold pt-2 text-xs border-b pb-1 text-slate-800 dark:text-slate-200">Key Takeaways</div>
                          <div className="space-y-1.5">
                            <div className="flex gap-1.5 items-start">
                              <span className="text-blue-500 font-mono font-semibold underline shrink-0 cursor-pointer">00:25</span>
                              <span className="text-muted-foreground">Intro to system models.</span>
                            </div>
                            <div className="flex gap-1.5 items-start">
                              <span className="text-blue-500 font-mono font-semibold underline shrink-0 cursor-pointer">01:45</span>
                              <span className="text-muted-foreground">Setup details in Supabase database.</span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {(demoStep === 2 || demoStep === 3) && (
                        <motion.div
                          key="step-2-3"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.25 }}
                          className="flex-grow flex flex-col justify-between h-full text-left"
                        >
                          <div className="space-y-2.5 overflow-y-auto pr-1 flex-grow">
                            <div className="bg-muted p-2 rounded-lg rounded-tl-none self-start max-w-[85%]">
                              How can I help you learn from this video?
                            </div>
                            <AnimatePresence>
                              {demoStep >= 2 && (
                                <motion.div
                                  key="chat-user-msg"
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-primary/5 text-primary-foreground border bg-foreground/5 p-2 rounded-lg rounded-tr-none self-end ml-auto max-w-[85%] font-light"
                                >
                                  summarize the setup part at 01:45
                                </motion.div>
                              )}
                              {demoStep >= 3 && (
                                <motion.div
                                  key="chat-ai-msg"
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-muted p-2 rounded-lg rounded-tl-none self-start max-w-[85%] leading-relaxed mt-2"
                                >
                                  At <span className="text-blue-500 underline font-semibold font-mono">01:45</span>, the video introduces table schemas and setting up Row Level Security. Would you like me to save a note of this?
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <div className="border-t pt-2 mt-2 flex gap-1.5 shrink-0">
                            <input disabled placeholder="Ask the AI agent..." className="w-full border bg-muted/10 rounded px-2 py-1 text-[9px]" />
                          </div>
                        </motion.div>
                      )}

                      {demoStep === 4 && (
                        <motion.div
                          key="step-4"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.25 }}
                          className="flex-grow flex flex-col text-left h-full"
                        >
                          <div className="font-semibold text-xs border-b pb-1 text-slate-800 dark:text-slate-200">My Study Notes</div>
                          <div className="flex-grow font-mono text-[9px] text-muted-foreground pt-2 whitespace-pre-wrap leading-normal">
                            {`# Lecture Notes\n\n* Database Setup: Use Supabase Auth + profiles table.\n* Key Concept: Clicking timestamp links auto-seeks the YouTube video.\n* Note taking: Saved locally to my dashboard.`}
                          </div>
                          <button className="w-full mt-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-[9px] font-medium flex items-center justify-center gap-1 cursor-pointer">
                            <CiCircleCheck size={12} /> Notes Saved
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Current animation details card overlay */}
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-[11px] font-light flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span>{currentCam.desc}</span>
            </div>
          </div>

          {/* Pagination Step Controls */}
          <div className="flex justify-center items-center gap-3 mt-6">
            {cameraConfig.map((config, index) => (
              <button
                key={`step-dot-${index}`}
                onClick={() => {
                  setDemoStep(index);
                  setIsPlaying(false);
                }}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  demoStep === index
                    ? "w-8 bg-foreground"
                    : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                title={config.desc}
              />
            ))}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="ml-2 p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title={isPlaying ? "Pause Demo Autoplay" : "Play Demo Autoplay"}
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Pricing / Auth Section */}
      <section id="auth-section" className="container mx-auto px-6 py-24 max-w-md">
        <div className="border rounded-2xl p-8 bg-card shadow-xl text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Lifetime Access</h3>
            <p className="text-muted-foreground text-sm font-light">
              Get full AI learning tools, notes saving, and timeline highlights.
            </p>
          </div>

          <div className="py-4 border-y">
            <div className="text-4xl font-extrabold">30,000 MMK</div>
            <p className="text-xs text-muted-foreground mt-1">One-time payment. Unlimited analysis.</p>
          </div>

          <div className="space-y-3 pt-2">
            {user ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Logged in as {user.email}</p>
                <button
                  onClick={handleStartRedirect}
                  className="w-full py-3 bg-foreground text-background font-semibold rounded-full hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Google Only Login Button */}
                <button
                  onClick={signInWithGoogle}
                  className="w-full py-3.5 border hover:bg-muted font-semibold rounded-full transition-all flex items-center justify-center gap-2.5 cursor-pointer bg-background hover:scale-[1.01] active:scale-[0.99] shadow-sm hover:shadow"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.13h3.92c2.3-2.12 3.63-5.24 3.63-8.75z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.92-3.13c-1.1.73-2.5 1.17-4.04 1.17-3.11 0-5.74-2.1-6.68-4.92H1.31v3.23A12 12 0 0 0 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.32 14.21A7.16 7.16 0 0 1 5 12c0-.77.13-1.52.32-2.21V6.56H1.31A12 12 0 0 0 0 12c0 2.05.52 4 1.31 5.74l4.01-3.53z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.31 6.56l4.01 3.53c.94-2.82 3.57-4.92 6.68-4.92z"
                    />
                  </svg>
                  Sign In with Google
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonial Marquee Section */}
      <section className="bg-muted/10 border-t py-16 overflow-hidden">
        <div className="container mx-auto px-6 text-center max-w-4xl mb-8">
          <h3 className="text-xl sm:text-2xl font-bold mb-2">What Learners Say</h3>
          <p className="text-sm text-muted-foreground font-light">Arti Tube helps developers and students study smarter, not longer.</p>
        </div>

        <Marquee repeat={3} duration={40} className="py-4">
          {reviews.map((r, i) => (
            <div key={`review-card-${i}`} className="w-80 p-5 rounded-xl border bg-card shadow-sm shrink-0 flex flex-col justify-between gap-4 text-left mx-2">
              <p className="text-sm text-muted-foreground italic font-light">"{r.comment}"</p>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold">
                  {r.name[0]}
                </div>
                <div>
                  <div className="text-xs font-bold">{r.name}</div>
                  <div className="text-[10px] text-muted-foreground">{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </Marquee>
      </section>
    </div>
  );
}
