"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, Profile } from "./supabase";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isDemo: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInDemo: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfileStatus: (status: 'pending' | 'active', screenshotUrl?: string) => Promise<void>;
  saveGeminiKey: (key: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const isAdmin = user?.email === "phyodynamics@gmail.com";

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code === "PGRST116") {
        // Profile does not exist, create it
        const newProfile: Partial<Profile> = {
          id: userId,
          email: email,
          status: "pending",
        };
        const { data: inserted, error: insertError } = await supabase
          .from("profiles")
          .insert(newProfile)
          .select()
          .single();

        if (insertError) {
          console.error("Error creating profile in DB:", insertError);
          // Return local fallback
          return { id: userId, email, status: "pending", created_at: new Date().toISOString() } as Profile;
        }
        return inserted as Profile;
      } else if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      return data as Profile;
    } catch (e) {
      console.error("Profile fetch exception:", e);
      return null;
    }
  };

  useEffect(() => {
    // Check if there is a saved demo session in local storage
    const savedDemoUser = localStorage.getItem("artitube_demo_user");
    const savedDemoProfile = localStorage.getItem("artitube_demo_profile");

    if (savedDemoUser && savedDemoProfile) {
      setUser(JSON.parse(savedDemoUser));
      setProfile(JSON.parse(savedDemoProfile));
      setIsDemo(true);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let currentFetchId = 0;
    let loadedUserId: string | null = null;

    // Helper to fetch profile and handle loading state
    const syncAuthAndProfile = async (authUser: User | null) => {
      if (!isMounted) return;

      if (!authUser) {
        loadedUserId = null;
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      // If user is already loaded and profile exists, don't refetch
      if (loadedUserId === authUser.id) {
        setUser(authUser);
        setLoading(false);
        return;
      }

      setUser(authUser);
      setLoading(true);

      const thisFetchId = ++currentFetchId;

      try {
        const prof = await fetchProfile(authUser.id, authUser.email || "");
        if (isMounted && thisFetchId === currentFetchId) {
          setProfile(prof);
          loadedUserId = authUser.id;
        }
      } catch (err) {
        console.error("Failed to load profile in syncAuthAndProfile:", err);
      } finally {
        if (isMounted && thisFetchId === currentFetchId) {
          setLoading(false);
        }
      }
    };

    // Otherwise check Supabase auth
    const initSession = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          await syncAuthAndProfile(session?.user || null);
        }
      } catch (err) {
        console.error("Error getting session:", err);
        if (isMounted) setLoading(false);
      }
    };

    initSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          if (session?.user) {
            await syncAuthAndProfile(session.user);
          }
        } else if (event === "SIGNED_OUT") {
          loadedUserId = null;
          setUser(null);
          setProfile(null);
          setIsDemo(false);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error("Google login failed, falling back to Demo Mode:", err);
      await signInDemo();
    }
  };

  const signInDemo = async () => {
    setLoading(true);
    // Create a mock user
    const mockUser = {
      id: "demo-user-123456",
      email: "developer@artitube.com",
      aud: "authenticated",
      role: "authenticated",
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: { full_name: "Demo Developer" },
    } as unknown as User;

    const mockProfile: Profile = {
      id: "demo-user-123456",
      email: "developer@artitube.com",
      status: "pending",
      created_at: new Date().toISOString(),
    };

    // Try to insert in actual Supabase database if connected, ignore if failed
    try {
      await supabase.from("profiles").upsert(mockProfile);
    } catch (dbErr) {
      console.warn("Could not upsert demo profile in real database (using local storage fallback):", dbErr);
    }

    localStorage.setItem("artitube_demo_user", JSON.stringify(mockUser));
    localStorage.setItem("artitube_demo_profile", JSON.stringify(mockProfile));

    setUser(mockUser);
    setProfile(mockProfile);
    setIsDemo(true);
    setLoading(false);
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      console.error("Sign in error:", err);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      console.error("Sign up error:", err);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    if (isDemo) {
      localStorage.removeItem("artitube_demo_user");
      localStorage.removeItem("artitube_demo_profile");
      setUser(null);
      setProfile(null);
      setIsDemo(false);
    } else {
      await supabase.auth.signOut();
    }
    setLoading(false);
  };

  const updateProfileStatus = async (status: 'pending' | 'active', screenshotUrl?: string) => {
    if (!user) return;

    const updates: Partial<Profile> = { status };
    if (screenshotUrl) {
      updates.payment_screenshot_url = screenshotUrl;
    }

    if (isDemo) {
      const updatedProfile = { ...profile, ...updates } as Profile;
      localStorage.setItem("artitube_demo_profile", JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
    } else {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile status in DB:", error);
      } else {
        await refreshProfile();
      }
    }
  };

  const saveGeminiKey = async (key: string) => {
    if (!user) return;

    if (isDemo) {
      const updatedProfile = { ...profile, gemini_api_key: key } as Profile;
      localStorage.setItem("artitube_demo_profile", JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
    } else {
      const { error } = await supabase
        .from("profiles")
        .update({ gemini_api_key: key })
        .eq("id", user.id);

      if (error) {
        console.error("Error saving Gemini API Key:", error);
      } else {
        await refreshProfile();
      }
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    if (isDemo) {
      const saved = localStorage.getItem("artitube_demo_profile");
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    } else {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (!error && data) {
        setProfile(data as Profile);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isDemo,
        isAdmin,
        signInWithGoogle,
        signInDemo,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        updateProfileStatus,
        saveGeminiKey,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
