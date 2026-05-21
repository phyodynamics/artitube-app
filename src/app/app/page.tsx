"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { CoolThemeToggle } from "@/components/CoolThemeToggle";
import { YouTubeTheaterPlayer } from "@/components/YouTubeTheaterPlayer";
import { validateGeminiKey, summarizeYouTubeVideo, chatWithGeminiAgent } from "@/lib/gemini";
import { getVideoDetailsAndTranscript } from "@/app/actions/youtube";

import { supabase, Video, Note, ChatMessage } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CiVideoOn, 
  CiSettings, 
  CiSearch, 
  CiChat1, 
  CiBookmark, 
  CiCircleCheck, 
  CiLogout, 
  CiCircleList,
  CiPaperplane,
  CiCalendar,
  CiTrash
} from "react-icons/ci";

export default function Dashboard() {
  const { user, profile, loading, isAdmin, saveGeminiKey, signOut } = useAuth();
  const router = useRouter();

  // Video State
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Layout Tab State
  const [activeTab, setActiveTab] = useState<"chat" | "summary" | "notes">("chat");
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [seekTime, setSeekTime] = useState<number | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Notes State
  const [notesContent, setNotesContent] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesStatus, setNotesStatus] = useState<"Saved" | "Saving" | "Error">("Saved");

  // History Sidebar
  const [historyList, setHistoryList] = useState<Video[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // API Key Modal State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [keyValidationStatus, setKeyValidationStatus] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
  const [keyValidationError, setKeyValidationError] = useState<string | null>(null);

  // Check auth & profile status
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
      } else if (isAdmin) {
        // Admin always gets access
        const hasKey = profile?.gemini_api_key || localStorage.getItem("artitube_gemini_api_key");
        if (!hasKey) {
          setIsKeyModalOpen(true);
        } else {
          setApiKeyInput(hasKey);
        }
        fetchHistory();
      } else if (profile?.status === "pending" && profile?.payment_screenshot_url) {
        router.push("/pending");
      } else if (profile?.status !== "active") {
        router.push("/payment");
      } else {
        // If user is active, check if API key is present
        const hasKey = profile?.gemini_api_key || localStorage.getItem("artitube_gemini_api_key");
        if (!hasKey) {
          setIsKeyModalOpen(true);
        } else {
          setApiKeyInput(hasKey);
        }
        // Load user's analysis history
        fetchHistory();
      }
    }
  }, [user, profile, loading, isAdmin, router]);

  // Load history list
  const fetchHistory = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setHistoryList(data as Video[]);
      }
    } catch (err) {
      console.error("Error fetching video history:", err);
    }
  };

  // Load notes for the active video
  const fetchVideoNotes = async (videoId: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("video_id", videoId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setNotesContent(data.content);
      } else {
        setNotesContent("");
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
    }
  };

  // Load chats for the active video
  const fetchVideoChats = async (videoId: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .eq("video_id", videoId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setMessages(data.messages as ChatMessage[]);
      } else {
        setMessages([
          {
            role: "model",
            content: "မင်္ဂလာပါဗျာ! ကျွန်တော်ကတော့ Arti Tube ရဲ့ AI video learning assistant ဖြစ်ပါတယ်။ ဒီဗီဒီယိုရဲ့ အကြောင်းအရာတွေကို သိချင်တာရှိရင် မေးမြန်းနိုင်သလို၊ လိုအပ်တဲ့ မှတ်စုတွေကိုလည်း 'မှတ်သားပေးပါ' လို့ ပြောပြီး မှတ်သားခိုင်းနိုင်ပါတယ်ဗျာ။",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
    }
  };

  // Select video from history
  const handleSelectVideo = async (video: Video) => {
    setActiveVideo(video);
    setYoutubeUrl(video.youtube_url);
    setIsHistoryOpen(false);
    await fetchVideoNotes(video.id);
    await fetchVideoChats(video.id);
  };

  // Delete video from history
  const handleDeleteVideo = async (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this video analysis and all linked notes/chats?")) return;
    try {
      await supabase.from("videos").delete().eq("id", videoId);
      if (activeVideo?.id === videoId) {
        setActiveVideo(null);
        setMessages([]);
        setNotesContent("");
      }
      fetchHistory();
    } catch (err) {
      console.error("Failed to delete video:", err);
    }
  };

  // Extract YT Video ID
  const getYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Analyze new YouTube Link
  const handleAnalyzeVideo = async () => {
    setAnalysisError(null);
    const videoId = getYouTubeId(youtubeUrl);
    
    if (!videoId) {
      setAnalysisError("Invalid YouTube URL. Please enter a valid link.");
      return;
    }

    // Check key
    const key = profile?.gemini_api_key || localStorage.getItem("artitube_gemini_api_key");
    if (!key) {
      setIsKeyModalOpen(true);
      return;
    }

    setAnalysisLoading(true);
    try {
      // 1. Fetch details and transcript from the YouTube Watch page / scraper server action
      const details = await getVideoDetailsAndTranscript(youtubeUrl);

      // 2. Request Gemini API to fetch summaries using the parsed metadata and transcript
      const summaryResult = await summarizeYouTubeVideo(
        key,
        videoId,
        details.transcriptText,
        details.title,
        details.description
      );

      // 3. Save to database using the real title
      const newVideo: Partial<Video> = {
        user_id: user?.id,
        youtube_url: youtubeUrl,
        youtube_id: videoId,
        title: details.title || `YouTube Video (${videoId})`,
        summary: summaryResult,
      };

      const { data, error } = await supabase
        .from("videos")
        .insert(newVideo)
        .select()
        .single();

      if (error) throw error;

      const savedVideo = data as Video;
      setActiveVideo(savedVideo);
      await fetchHistory();
      await fetchVideoNotes(savedVideo.id);
      await fetchVideoChats(savedVideo.id);
    } catch (err: any) {
      console.error("Error analyzing video:", err);
      setAnalysisError(err.message || "Failed to analyze video. Please verify your Gemini API key.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Validate and Save API Key
  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setKeyValidationError("API key cannot be empty.");
      return;
    }

    setKeyValidationStatus("validating");
    setKeyValidationError(null);

    const isValid = await validateGeminiKey(apiKeyInput.trim());

    if (isValid) {
      setKeyValidationStatus("valid");
      localStorage.setItem("artitube_gemini_api_key", apiKeyInput.trim());
      await saveGeminiKey(apiKeyInput.trim());
      setTimeout(() => {
        setIsKeyModalOpen(false);
        setKeyValidationStatus("idle");
      }, 1000);
    } else {
      setKeyValidationStatus("invalid");
      setKeyValidationError("Invalid Gemini API Key. Please make sure the key is correct and has access to Gemini model endpoints.");
    }
  };

  // Chat message send handler
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !activeVideo) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage("");
    setChatLoading(true);

    const key = profile?.gemini_api_key || localStorage.getItem("artitube_gemini_api_key") || "";

    try {
      const responseText = await chatWithGeminiAgent(
        key,
        activeVideo.summary,
        updatedMessages.map(m => ({ role: m.role, content: m.content })),
        inputMessage
      );

      const aiMsg: ChatMessage = {
        role: "model",
        content: responseText,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);

      // Save chat history to database
      await supabase.from("chats").upsert({
        user_id: user?.id,
        video_id: activeVideo.id,
        messages: finalMessages,
      });

      // Agentic Note-taking Integration: Check if AI message starts with "🗒️ [Note added]:"
      if (responseText.trim().startsWith("🗒️ [Note added]:")) {
        const noteContent = responseText.replace("🗒️ [Note added]:", "").trim();
        appendNoteFromAI(noteContent);
      }

    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setChatLoading(false);
    }
  };

  // Append note extracted from AI chat
  const appendNoteFromAI = async (newNote: string) => {
    if (!activeVideo || !user) return;
    const separator = notesContent ? "\n\n" : "";
    const updatedContent = `${notesContent}${separator}### Note from AI Chat\n* ${newNote}`;
    setNotesContent(updatedContent);
    
    // Save to database
    setNotesStatus("Saving");
    try {
      await supabase.from("notes").upsert({
        user_id: user.id,
        video_id: activeVideo.id,
        content: updatedContent,
      });
      setNotesStatus("Saved");
    } catch (e) {
      setNotesStatus("Error");
    }
  };

  // Manual save for notes editor
  const handleSaveNotes = async (content: string) => {
    setNotesContent(content);
    if (!activeVideo || !user) return;

    setNotesStatus("Saving");
    try {
      const { error } = await supabase.from("notes").upsert({
        user_id: user.id,
        video_id: activeVideo.id,
        content: content,
      });
      if (error) throw error;
      setNotesStatus("Saved");
    } catch (e) {
      console.error(e);
      setNotesStatus("Error");
    }
  };

  // Seek YouTube video to seconds
  const handleSeek = (seconds: number) => {
    setSeekTime(seconds);
    // Reset seekTime so subsequent clicks trigger state updates
    setTimeout(() => setSeekTime(null), 50);
  };

  // Render text containing timestamps as clickable badges
  const renderMessageContent = (text: string) => {
    const regex = /\[(\d{1,2}:)?(\d{1,2}):(\d{2})\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const rawTime = match[0];
      const timeStr = rawTime.slice(1, -1); // remove brackets
      const timeParts = timeStr.split(":").map(Number);
      let seconds = 0;
      if (timeParts.length === 3) {
        seconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
      } else {
        seconds = timeParts[0] * 60 + timeParts[1];
      }

      parts.push(
        <button
          key={match.index}
          onClick={() => handleSeek(seconds)}
          className="text-blue-500 hover:text-blue-600 font-mono font-semibold underline bg-blue-500/10 dark:bg-blue-400/10 px-1 py-0.5 rounded cursor-pointer transition-colors mx-0.5"
        >
          {timeStr}
        </button>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  if (loading || !user) {
    return (
      <div className="flex-grow flex items-center justify-center bg-background min-h-[70vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/85 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 border hover:bg-muted rounded-xl transition-colors cursor-pointer"
              title="Open History"
            >
              <CiCircleList size={20} />
            </button>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
              <img src="/ArtitubeNoBg.png" alt="Arti Tube Logo" className="h-9 w-9 object-contain" />
              <span className="font-bold text-lg hidden sm:inline">Arti Tube</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <CoolThemeToggle size="sm" />
            {isAdmin && (
              <button
                onClick={() => router.push("/admin")}
                className="px-3.5 py-1.5 text-xs font-semibold text-amber-500 border border-amber-500/20 rounded-xl hover:bg-amber-500/10 transition-colors cursor-pointer"
              >
                Admin Panel
              </button>
            )}
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className="p-2 border hover:bg-muted rounded-xl transition-colors cursor-pointer"
              title="API Key Settings"
            >
              <CiSettings size={20} />
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

      {/* Main Content Area */}
      <div className="flex-1 container mx-auto px-6 py-6 flex flex-col gap-6 max-w-4xl">
        
        {/* Top Side: Search & Theater Player */}
        <div className="w-full flex flex-col gap-4">
          
          {/* Input Url box */}
          <div className="border rounded-2xl p-4 bg-card shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex-grow relative border rounded-xl bg-muted/20 px-3.5 py-2.5 flex items-center gap-2 text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <CiSearch size={18} className="text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Paste YouTube video link here (e.g. https://www.youtube.com/watch?v=...)"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="bg-transparent border-0 outline-none w-full text-sm font-sans"
                />
              </div>
              <button
                onClick={handleAnalyzeVideo}
                disabled={analysisLoading || !youtubeUrl}
                className="px-5 py-3 bg-foreground text-background font-semibold rounded-xl text-sm hover:bg-foreground/90 transition-all cursor-pointer disabled:opacity-40"
              >
                {analysisLoading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
            {analysisError && (
              <p className="text-xs text-red-500 font-medium text-left">{analysisError}</p>
            )}
          </div>

          {/* Video Player & Insights Summary */}
          {activeVideo ? (
            <div className="space-y-4">
              <YouTubeTheaterPlayer
                videoId={activeVideo.youtube_id}
                seekTime={seekTime}
              />

              {/* Theater Mode summary details toggle */}
              <div className="border rounded-2xl bg-card overflow-hidden shadow-sm">
                <button
                  onClick={() => setIsSummaryOpen(!isSummaryOpen)}
                  className="w-full px-5 py-4 border-b flex justify-between items-center hover:bg-muted/15 cursor-pointer font-bold text-sm"
                >
                  <div className="flex items-center gap-2">
                    <CiCircleList size={18} />
                    <span>Video Insights & Timeline</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {isSummaryOpen ? "Hide" : "Show"}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isSummaryOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 space-y-4 text-left">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">About Video</h3>
                          <p className="text-sm mt-1 font-light leading-relaxed">{activeVideo.summary.about}</p>
                        </div>
                        <div className="border-t pt-4">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Comprehensive Summary</h3>
                          <p className="text-sm mt-1.5 font-light leading-relaxed whitespace-pre-line">{activeVideo.summary.summary}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="flex-1 border border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-12 text-muted-foreground min-h-[450px] bg-muted/5">
              <CiVideoOn size={48} className="opacity-50 mb-3" />
              <h3 className="text-lg font-bold text-foreground">No Video Loaded</h3>
              <p className="text-sm max-w-xs mt-1 font-light">Paste a YouTube link above or open history to load a previously analyzed video.</p>
            </div>
          )}
        </div>

        {/* Bottom Side: Navigation Tabs Container */}
        <div className="w-full flex flex-col border rounded-2xl bg-card overflow-hidden shadow-md min-h-[500px]">
          {/* Custom Capsule Tab Switcher */}
          <div className="flex p-1.5 bg-muted/40 border-b relative">
            {(["chat", "summary", "notes"] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg relative cursor-pointer z-10 transition-colors uppercase tracking-wider ${
                    isActive ? "text-background dark:text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "chat" && "AI Chat"}
                  {tab === "summary" && "Timestamps"}
                  {tab === "notes" && "Notes"}
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTabCapsule"
                      className="absolute inset-0 bg-foreground dark:bg-slate-800 rounded-lg -z-10 shadow-sm"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content Display */}
          <div className="flex-1 p-4 flex flex-col overflow-hidden">
            {activeVideo ? (
              <>
                {/* 1. Chat Tab */}
                {activeTab === "chat" && (
                  <div className="flex-grow flex flex-col justify-between overflow-hidden h-full">
                    {/* Message Bubble list */}
                    <div className="flex-grow overflow-y-auto space-y-4 pr-1 mb-4 flex flex-col">
                      {messages.map((msg, index) => {
                        const isAI = msg.role === "model";
                        return (
                          <div
                            key={index}
                            className={`flex flex-col max-w-[85%] text-left ${
                              isAI ? "self-start" : "self-end"
                            }`}
                          >
                            <div
                              className={`p-3 rounded-2xl text-sm leading-relaxed ${
                                isAI
                                  ? "bg-muted text-foreground rounded-tl-none font-light"
                                  : "bg-foreground text-background rounded-tr-none font-medium"
                              }`}
                            >
                              {isAI ? renderMessageContent(msg.content) : msg.content}
                            </div>
                            <span className="text-[9px] text-muted-foreground mt-1 px-1 font-mono">
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        );
                      })}
                      {chatLoading && (
                        <div className="self-start max-w-[80%] flex items-center gap-2 p-3 bg-muted rounded-2xl rounded-tl-none text-xs text-muted-foreground">
                          <span className="inline-block animate-bounce font-extrabold">.</span>
                          <span className="inline-block animate-bounce [animation-delay:0.2s] font-extrabold">.</span>
                          <span className="inline-block animate-bounce [animation-delay:0.4s] font-extrabold">.</span>
                          <span>AI Agent is typing...</span>
                        </div>
                      )}
                    </div>

                    {/* Chat send action */}
                    <div className="flex gap-2 border-t pt-3">
                      <input
                        type="text"
                        placeholder="Ask anything about the video..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        className="flex-1 border bg-muted/20 rounded-xl px-3 py-2 text-sm outline-none"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={chatLoading || !inputMessage.trim()}
                        className="p-3 bg-foreground text-background hover:bg-foreground/90 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                      >
                        <CiPaperplane size={18} className="stroke-[1.5]" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Timestamps Tab */}
                {activeTab === "summary" && (
                  <div className="flex-grow overflow-y-auto space-y-3 pr-1 text-left h-full">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-1 border-b">
                      Timeline Key Takeaways
                    </h3>
                    <div className="divide-y">
                      {activeVideo.summary.takeaways.map((takeaway, i) => (
                        <div key={i} className="py-3 flex gap-3 items-start hover:bg-muted/10 px-2 rounded-lg transition-colors">
                          <button
                            onClick={() => handleSeek(takeaway.seconds)}
                            className="px-2 py-1 bg-primary/10 text-primary dark:bg-slate-800 dark:text-slate-300 font-mono font-bold rounded text-xs underline cursor-pointer shrink-0 transition-all hover:scale-[1.05]"
                          >
                            {takeaway.timestamp}
                          </button>
                          <p className="text-sm text-foreground/90 font-light leading-relaxed">
                            {takeaway.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Notes Tab */}
                {activeTab === "notes" && (
                  <div className="flex-grow flex flex-col justify-between overflow-hidden h-full text-left">
                    <div className="flex justify-between items-center border-b pb-2 mb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Interactive markdown notes
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          notesStatus === "Saved" ? "bg-green-500" : notesStatus === "Saving" ? "bg-amber-500 animate-pulse" : "bg-red-500"
                        }`} />
                        <span className="text-[10px] text-muted-foreground font-mono">{notesStatus}</span>
                      </div>
                    </div>

                    <textarea
                      placeholder="Take your personal notes here... Supports markdown formatting. Auto-saved."
                      value={notesContent}
                      onChange={(e) => handleSaveNotes(e.target.value)}
                      className="flex-grow border-0 outline-none resize-none font-mono text-sm leading-relaxed p-1 bg-transparent w-full focus:ring-0"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                <CiChat1 size={36} className="opacity-40 mb-2" />
                <h4 className="font-bold text-sm text-foreground">Interactive Side Panel</h4>
                <p className="text-xs max-w-xs mt-1 font-light">Select a video or paste a link to unlock AI chat discussions, key timestamps, and persistent learning notes.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* History Drawer Overlay */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-80 bg-background border-r p-6 shadow-2xl flex flex-col text-left"
            >
              <div className="flex justify-between items-center pb-4 border-b mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <CiCalendar size={20} />
                  <span>Analysis History</span>
                </h3>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="px-2 py-1 text-xs border rounded-lg hover:bg-muted cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {historyList.length > 0 ? (
                  historyList.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => handleSelectVideo(video)}
                      className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-colors ${
                        activeVideo?.id === video.id
                          ? "border-foreground bg-foreground/5"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="overflow-hidden whitespace-nowrap text-ellipsis flex-grow pr-3">
                        <div className="text-xs font-semibold overflow-hidden text-ellipsis">
                          {video.summary.about.slice(0, 45)}...
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-1">
                          ID: {video.youtube_id}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteVideo(e, video.id)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete video"
                      >
                        <CiTrash size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground py-12 text-center font-light">No parsed videos found.</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Gemini API Key Settings / Init Modal */}
      <AnimatePresence>
        {isKeyModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6 bg-card border rounded-2xl shadow-2xl text-left space-y-5"
            >
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold flex items-center gap-1.5">
                  <CiSettings size={22} className="stroke-[2]" />
                  <span>Configure Gemini API Key</span>
                </h3>
                <p className="text-xs text-muted-foreground font-light">
                  To analyze videos, enter your personal Google Gemini API Key. It is stored securely in your private session and database.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Google AI Studio API Key
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full border bg-muted/20 rounded-xl px-3.5 py-2.5 text-sm outline-none font-mono"
                />
                {keyValidationError && (
                  <p className="text-[11px] text-red-500 font-medium leading-relaxed">{keyValidationError}</p>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                {profile?.gemini_api_key && (
                  <button
                    onClick={() => {
                      setIsKeyModalOpen(false);
                      setKeyValidationError(null);
                      setKeyValidationStatus("idle");
                    }}
                    className="px-4 py-2 border text-xs font-semibold rounded-xl hover:bg-muted cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleSaveApiKey}
                  disabled={keyValidationStatus === "validating" || !apiKeyInput.trim()}
                  className="px-5 py-2 bg-foreground text-background text-xs font-semibold rounded-xl hover:bg-foreground/90 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {keyValidationStatus === "validating" ? (
                    <>
                      <span className="inline-block animate-spin border-2 border-current border-t-transparent rounded-full h-3 w-3 mr-1" />
                      Testing Key...
                    </>
                  ) : keyValidationStatus === "valid" ? (
                    <>
                      <CiCircleCheck size={14} className="stroke-[2] text-green-400" />
                      Key Saved!
                    </>
                  ) : (
                    "Save & Close"
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
