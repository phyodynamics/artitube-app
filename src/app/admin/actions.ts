"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Initialize service role client (only run on server)
const getAdminClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables are missing.");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export async function getAdminData(accessToken: string) {
  try {
    const adminClient = getAdminClient();

    // Verify identity: must be phyodynamics@gmail.com
    const { data: { user }, error: userError } = await adminClient.auth.getUser(accessToken);
    if (userError || !user || user.email !== "phyodynamics@gmail.com") {
      throw new Error("Unauthorized access. Admin privileges required.");
    }

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    // Calculate quick stats
    const total = profiles.length;
    const pending = profiles.filter((p) => p.status === "pending" && p.payment_screenshot_url).length;
    const active = profiles.filter((p) => p.status === "active").length;

    return {
      profiles: profiles || [],
      stats: { total, pending, active },
      error: null,
    };
  } catch (err: any) {
    console.error("Error in getAdminData Server Action:", err);
    return {
      profiles: [],
      stats: { total: 0, pending: 0, active: 0 },
      error: err.message || "An unexpected error occurred.",
    };
  }
}

export async function approveProfileAdmin(accessToken: string, profileId: string) {
  try {
    const adminClient = getAdminClient();

    // Verify identity: must be phyodynamics@gmail.com
    const { data: { user }, error: userError } = await adminClient.auth.getUser(accessToken);
    if (userError || !user || user.email !== "phyodynamics@gmail.com") {
      throw new Error("Unauthorized access. Admin privileges required.");
    }

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ status: "active" })
      .eq("id", profileId);

    if (updateError) {
      throw new Error(`Failed to approve profile: ${updateError.message}`);
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error in approveProfileAdmin Server Action:", err);
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function rejectProfileAdmin(accessToken: string, profileId: string) {
  try {
    const adminClient = getAdminClient();

    // Verify identity: must be phyodynamics@gmail.com
    const { data: { user }, error: userError } = await adminClient.auth.getUser(accessToken);
    if (userError || !user || user.email !== "phyodynamics@gmail.com") {
      throw new Error("Unauthorized access. Admin privileges required.");
    }

    // Rejecting clears the payment screenshot URL and keeps status as 'pending'
    // so they are redirected back to the payment upload page.
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ 
        status: "pending", 
        payment_screenshot_url: null 
      })
      .eq("id", profileId);

    if (updateError) {
      throw new Error(`Failed to reject profile: ${updateError.message}`);
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error in rejectProfileAdmin Server Action:", err);
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
