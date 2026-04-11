"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface Post {
  id: string;
  author_id: string;
  content: string;
  media_urls: string[] | null;
  privacy: "public" | "friends" | "private";
  group_id: string | null;
  created_at: string;
  updated_at: string | null;
  author?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  reaction_count?: number;
  comment_count?: number;
}

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const content = formData.get("content") as string;
  const privacy = (formData.get("privacy") as string) || "public";

  if (!content?.trim()) return { error: "Content is required" };

  const { error } = await supabase.from("posts").insert({
    author_id: user.id,
    content: content.trim(),
    privacy,
  });

  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

export async function getPosts(limit = 20, offset = 0): Promise<Post[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(`*, author:profiles!author_id(username, display_name, avatar_url)`)
    .eq("privacy", "public")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  return (data as Post[]) ?? [];
}

export async function getPost(id: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(`*, author:profiles!author_id(username, display_name, avatar_url)`)
    .eq("id", id)
    .single();
  return (data as Post) ?? null;
}

export async function deletePost(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

export async function getFeedPosts(limit = 20, offset = 0): Promise<Post[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return getPosts(limit, offset);

  const { data } = await supabase
    .from("posts")
    .select(`*, author:profiles!author_id(username, display_name, avatar_url)`)
    .or(`privacy.eq.public,author_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return (data as Post[]) ?? [];
}
