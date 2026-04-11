"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  updated_at: string | null;
}

export async function sendFriendRequest(addresseeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (user.id === addresseeId) return { error: "Cannot friend yourself" };

  const { error } = await supabase.from("friendships").insert({
    requester_id: user.id,
    addressee_id: addresseeId,
    status: "pending",
  });

  if (error) return { error: error.message };
  revalidatePath("/friends");
  return { success: true };
}

export async function acceptFriendRequest(friendshipId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", friendshipId)
    .eq("addressee_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/friends");
  return { success: true };
}

export async function declineFriendRequest(friendshipId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("friendships")
    .update({ status: "declined", updated_at: new Date().toISOString() })
    .eq("id", friendshipId)
    .eq("addressee_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/friends");
  return { success: true };
}

export async function removeFriend(friendshipId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  if (error) return { error: error.message };
  revalidatePath("/friends");
  return { success: true };
}

export async function getFriends(userId?: string) {
  const supabase = await createClient();
  const uid = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return [];

  const { data } = await supabase
    .from("friendships")
    .select(`
      id, requester_id, addressee_id,
      requester:profiles!requester_id(id, username, display_name, avatar_url),
      addressee:profiles!addressee_id(id, username, display_name, avatar_url)
    `)
    .eq("status", "accepted")
    .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`);

  return data ?? [];
}

export async function getPendingRequests() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("friendships")
    .select(`
      id, requester_id,
      requester:profiles!requester_id(id, username, display_name, avatar_url)
    `)
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  return data ?? [];
}

export async function getDegreesOfConnection(targetUserId: string): Promise<number | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.rpc("get_degrees_of_connection", {
    user1_id: user.id,
    user2_id: targetUserId,
  });

  return data ?? null;
}
