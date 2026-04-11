"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  creator_id: string;
  privacy: "public" | "private" | "secret";
  created_at: string;
  member_count?: number;
}

export async function createGroup(data: { name: string; description?: string; avatar_url?: string; privacy?: "public" | "private" | "secret" }) {
  const supabase = await createClient();

  let user;
  try {
    const { data: authData, error } = await supabase.auth.getUser();
    if (error || !authData.user) throw new Error("Unauthorized");
    user = authData.user;
  } catch {
    return { error: "Unauthorized", code: "UNAUTHORIZED", status: 401 };
  }

  const slug = slugify(data.name);
  const { data: group, error } = await supabase
    .from("groups")
    .insert({ ...data, slug, creator_id: user.id })
    .select()
    .single();

  if (error) return { error: "Failed to create group" };

  await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "admin",
  });

  revalidatePath("/groups");
  return { group: group as Group };
}

export async function getGroups(limit = 20, offset = 0): Promise<Group[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  return (data as Group[]) ?? [];
}

export async function getGroup(id: string): Promise<Group | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("groups").select("*").eq("id", id).single();
  return (data as Group) ?? null;
}

export async function joinGroup(groupId: string) {
  const supabase = await createClient();

  let user;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error("Unauthorized");
    user = data.user;
  } catch {
    return { error: "Unauthorized", code: "UNAUTHORIZED", status: 401 };
  }

  // Check group privacy — secret groups require an invite
  const { data: group } = await supabase
    .from("groups")
    .select("privacy")
    .eq("id", groupId)
    .single();

  if (!group) return { error: "Group not found" };

  if (group.privacy === "secret") {
    return { error: "You need an invite to join this group" };
  }

  const { error } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: user.id,
    role: "member",
  });

  if (error) return { error: "Failed to join group" };
  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

export async function leaveGroup(groupId: string) {
  const supabase = await createClient();

  let user;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error("Unauthorized");
    user = data.user;
  } catch {
    return { error: "Unauthorized", code: "UNAUTHORIZED", status: 401 };
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to leave group" };
  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}
