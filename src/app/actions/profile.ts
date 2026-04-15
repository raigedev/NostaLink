"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sanitizeCSS, sanitizeScopedCSS, sanitizeHTML } from "@/lib/sanitize";
import {
  validateUpload,
  generateFileName,
  AVATAR_CONSTRAINTS,
  BACKGROUND_CONSTRAINTS,
  AUDIO_CONSTRAINTS,
} from "@/lib/security/upload-validator";
import { usernameSchema } from "@/lib/validations";
import type { LayoutData } from "@/types/layout";

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
  /** Freeform layout metadata for the profile canvas editor */
  layout_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
}

const profileUpdateSchema = z.object({
  username: usernameSchema.optional(),
  display_name: z.string().min(1).max(50).optional().or(z.literal("")),
  bio: z.string().max(500).optional(),
  mood: z.string().max(100).optional(),
  headline: z.string().max(150).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal("")),
  relationship_status: z
    .enum(["single", "in_relationship", "married", "complicated", ""])
    .optional(),
});

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

  const raw = {
    username: (formData.get("username") as string | null) || undefined,
    display_name: formData.get("display_name") as string | null,
    bio: formData.get("bio") as string | null,
    mood: formData.get("mood") as string | null,
    headline: formData.get("headline") as string | null,
    location: formData.get("location") as string | null,
    website: formData.get("website") as string | null,
    relationship_status: formData.get("relationship_status") as string | null,
  };

  const parsed = profileUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  // Get current username before update
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (!currentProfile) return { error: "Profile not found" };

  const newUsername = parsed.data.username;

  // If username is being changed, check uniqueness
  if (newUsername && newUsername !== currentProfile.username) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", newUsername)
      .maybeSingle();
    if (existing) return { error: "Username is already taken" };
  }

  const updates: Record<string, unknown> = {
    ...parsed.data,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) return { error: error.message };

  const finalUsername = newUsername ?? currentProfile.username;
  revalidatePath(`/profile/${finalUsername}`);
  revalidatePath(`/profile/${finalUsername}/edit`);
  if (newUsername && newUsername !== currentProfile.username) {
    revalidatePath(`/profile/${currentProfile.username}`);
  }

  return { success: true, newUsername: newUsername !== currentProfile.username ? newUsername : undefined };
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
    custom_css: data.custom_css != null
      ? sanitizeScopedCSS(data.custom_css, user.id)
      : data.custom_css,
    custom_html: data.custom_html != null
      ? sanitizeHTML(data.custom_html)
      : data.custom_html,
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

// ── File Upload Actions ───────────────────────────────────────────────────────

async function uploadFileToStorage(
  bucket: string,
  file: File,
  constraints: typeof AVATAR_CONSTRAINTS
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const validation = await validateUpload(file, constraints);
  if (!validation.valid) return { error: validation.error! };

  const fileName = generateFileName(file.name);
  const path = `${user.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: validation.detectedMime,
      upsert: false,
    });

  if (uploadError) return { error: uploadError.message };

  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: publicUrl.publicUrl };
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided" };

  const result = await uploadFileToStorage("avatars", file, AVATAR_CONSTRAINTS);
  if ("error" in result) return result;

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: result.url, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();
  if (profile?.username) revalidatePath(`/profile/${profile.username}`);

  return { success: true, url: result.url };
}

export async function uploadCoverPhoto(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided" };

  const result = await uploadFileToStorage("profile-backgrounds", file, BACKGROUND_CONSTRAINTS);
  if ("error" in result) return result;

  const { error } = await supabase
    .from("profiles")
    .update({ cover_url: result.url, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();
  if (profile?.username) revalidatePath(`/profile/${profile.username}`);

  return { success: true, url: result.url };
}

export async function uploadProfileBackground(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided" };

  const result = await uploadFileToStorage("profile-backgrounds", file, BACKGROUND_CONSTRAINTS);
  if ("error" in result) return result;

  const { error } = await supabase
    .from("profiles")
    .update({ bg_url: result.url, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();
  if (profile?.username) revalidatePath(`/profile/${profile.username}`);

  return { success: true, url: result.url };
}

export async function uploadSlideshowPhoto(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided" };
  return uploadFileToStorage("profile-backgrounds", file, BACKGROUND_CONSTRAINTS);
}

export async function uploadProfileAudio(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided" };

  const result = await uploadFileToStorage("profile-audio", file, AUDIO_CONSTRAINTS);
  if ("error" in result) return result;

  const { error } = await supabase
    .from("profiles")
    .update({ profile_song_url: result.url, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();
  if (profile?.username) revalidatePath(`/profile/${profile.username}`);

  return { success: true, url: result.url };
}

// ── Widget / Top Friends Actions ──────────────────────────────────────────────

const widgetsSchema = z.array(z.record(z.string(), z.unknown())).max(20);

export async function updateWidgets(widgets: Record<string, unknown>[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = widgetsSchema.safeParse(widgets);
  if (!parsed.success) return { error: "Invalid widgets data" };

  const { error } = await supabase
    .from("profiles")
    .update({ widgets: parsed.data, updated_at: new Date().toISOString() })
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

const topFriendsSchema = z.array(z.string().uuid()).max(8);

export async function updateTopFriends(friendIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = topFriendsSchema.safeParse(friendIds);
  if (!parsed.success) return { error: "Invalid friend IDs" };

  // Verify all IDs are actual accepted friends
  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq("status", "accepted");

  const friendSet = new Set<string>();
  for (const f of friendships ?? []) {
    if (f.requester_id === user.id) friendSet.add(f.addressee_id);
    else friendSet.add(f.requester_id);
  }

  const validIds = parsed.data.filter((id) => friendSet.has(id));

  const { error } = await supabase
    .from("profiles")
    .update({ top_friends: validIds, updated_at: new Date().toISOString() })
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

// ── Hit Counter (rate limited: 1 per visitor per hour) ────────────────────────

export async function incrementHitCount(profileId: string) {
  const cookieStore = await cookies();
  const cookieKey = `hit_${profileId}`;

  // Check if we already counted this visitor recently
  const existing = cookieStore.get(cookieKey);
  if (existing) return { skipped: true };

  const supabase = await createClient();

  // Use RPC for atomic increment - if the RPC doesn't exist, silently skip
  try {
    await supabase.rpc("increment_hit_count", { profile_id: profileId });
  } catch (err) {
    // RPC might not exist yet, silently skip
    console.error("increment_hit_count RPC error:", err);
  }

  // Set cookie to rate-limit to 1 increment per hour per visitor
  cookieStore.set(cookieKey, "1", {
    maxAge: 3600,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return { success: true };
}

// ── CSS / HTML Update Actions ─────────────────────────────────────────────────

const cssSchema = z.string().max(10_240);

export async function updateCustomCss(css: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = cssSchema.safeParse(css);
  if (!parsed.success) return { error: "CSS exceeds maximum length" };

  const sanitized = sanitizeScopedCSS(parsed.data, user.id);

  const { error } = await supabase
    .from("profiles")
    .update({ custom_css: sanitized, updated_at: new Date().toISOString() })
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

const htmlSchema = z.string().max(20_480);

export async function updateCustomHtml(html: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = htmlSchema.safeParse(html);
  if (!parsed.success) return { error: "HTML exceeds maximum length" };

  const sanitized = sanitizeHTML(parsed.data);

  const { error } = await supabase
    .from("profiles")
    .update({ custom_html: sanitized, updated_at: new Date().toISOString() })
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

// ── Layout Data Action ─────────────────────────────────────────────────────────

const layoutDataSchema = z.object({
  version: z.literal(1),
  items: z.array(
    z.object({
      id: z.string().max(100),
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(10000),
      w: z.number().min(5).max(100),
    }),
  ).max(50),
}).nullable();

export async function updateLayoutData(layoutData: LayoutData | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = layoutDataSchema.safeParse(layoutData);
  if (!parsed.success) return { error: "Invalid layout data" };

  const { error } = await supabase
    .from("profiles")
    .update({ layout_data: parsed.data, updated_at: new Date().toISOString() })
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

