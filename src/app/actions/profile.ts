"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sanitizeCSS, sanitizeHTML } from "@/lib/sanitize";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  mood: string | null;
  headline: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  location: string | null;
  website: string | null;
  relationship_status: string | null;
  theme_id: string | null;
  font_id: string | null;
  custom_css: string | null;
  custom_html: string | null;
  bg_url: string | null;
  bg_mode: string | null;
  bg_color: string | null;
  profile_song_url: string | null;
  hit_count: number;
  widgets: Record<string, unknown>[] | null;
  top_friends: string[] | null;
  created_at: string;
  updated_at: string | null;
}

export async function getProfile(username: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();
  return data ?? null;
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const updates: Record<string, unknown> = {
    display_name: formData.get("display_name"),
    bio: formData.get("bio"),
    mood: formData.get("mood"),
    headline: formData.get("headline"),
    location: formData.get("location"),
    website: formData.get("website"),
    relationship_status: formData.get("relationship_status"),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profile?.username) revalidatePath(`/profile/${profile.username}`);
  return { success: true };
}

export async function updateProfileCustomization(data: {
  theme_id?: string;
  font_id?: string;
  custom_css?: string;
  custom_html?: string;
  bg_url?: string;
  bg_mode?: string;
  bg_color?: string;
  profile_song_url?: string;
  widgets?: Record<string, unknown>[];
  top_friends?: string[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const sanitized = {
    ...data,
    custom_css: data.custom_css ? sanitizeCSS(data.custom_css) : data.custom_css,
    custom_html: data.custom_html ? sanitizeHTML(data.custom_html) : data.custom_html,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("profiles")
    .update(sanitized)
    .eq("id", user.id);

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profile?.username) revalidatePath(`/profile/${profile.username}`);
  return { success: true };
}

export async function updateAvatar(url: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: url, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}
