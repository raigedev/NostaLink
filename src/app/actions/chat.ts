"use server";

import { createClient } from "@/lib/supabase/server";

export interface Conversation {
  id: string;
  created_at: string;
  members?: { user_id: string; profile: { username: string; display_name: string | null; avatar_url: string | null } }[];
  last_message?: { content: string; created_at: string } | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: { username: string; display_name: string | null; avatar_url: string | null };
}

export async function getConversations(): Promise<Conversation[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("conversation_members")
    .select(`
      conversation_id,
      conversations!inner(id, created_at)
    `)
    .eq("user_id", user.id);

  return (data ?? []).map((d) => ({
    id: d.conversation_id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    created_at: (d as any).conversations?.created_at ?? "",
  }));
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select(`*, sender:profiles!sender_id(username, display_name, avatar_url)`)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return (data as Message[]) ?? [];
}

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: content.trim(),
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function createConversation(otherUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .insert({})
    .select()
    .single();

  if (convError || !conv) return { error: convError?.message ?? "Failed to create conversation" };

  await supabase.from("conversation_members").insert([
    { conversation_id: conv.id, user_id: user.id },
    { conversation_id: conv.id, user_id: otherUserId },
  ]);

  return { conversationId: conv.id };
}

export async function findOrCreateConversation(otherUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Find an existing 1-on-1 conversation shared by both users (in parallel)
  const [{ data: myMemberships }, { data: theirMemberships }] = await Promise.all([
    supabase.from("conversation_members").select("conversation_id").eq("user_id", user.id),
    supabase.from("conversation_members").select("conversation_id").eq("user_id", otherUserId),
  ]);

  if (myMemberships && theirMemberships) {
    const myIds = new Set(myMemberships.map((m) => m.conversation_id));
    const sharedIds = theirMemberships
      .filter((m) => myIds.has(m.conversation_id))
      .map((m) => m.conversation_id);

    // Confirm the shared conversation is a 1-on-1 (exactly 2 members)
    for (const convId of sharedIds) {
      const { count } = await supabase
        .from("conversation_members")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", convId);
      if (count === 2) return { conversationId: convId };
    }
  }

  return createConversation(otherUserId);
}
