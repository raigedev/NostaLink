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

  let user;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error("Unauthorized");
    user = data.user;
  } catch {
    return [];
  }

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

  let user;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error("Unauthorized");
    user = data.user;
  } catch {
    return [];
  }

  // Verify user is a member of this conversation
  const { data: membership } = await supabase
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!membership) return [];

  const { data } = await supabase
    .from("messages")
    .select(`*, sender:profiles!sender_id(username, display_name, avatar_url)`)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return (data as Message[]) ?? [];
}

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient();

  let user;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error("Unauthorized");
    user = data.user;
  } catch {
    return { error: "Unauthorized", code: "UNAUTHORIZED", status: 401 };
  }

  // Verify user is a member of this conversation before sending
  const { data: membership } = await supabase
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { error: "You are not a member of this conversation" };
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: content.trim(),
  });

  if (error) return { error: "Failed to send message" };
  return { success: true };
}

export async function createConversation(otherUserId: string) {
  const supabase = await createClient();

  let user;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error("Unauthorized");
    user = data.user;
  } catch {
    return { error: "Unauthorized", code: "UNAUTHORIZED", status: 401 };
  }

  if (user.id === otherUserId) {
    return { error: "Cannot create a conversation with yourself" };
  }

  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .insert({})
    .select()
    .single();

  if (convError || !conv) return { error: "Failed to create conversation" };

  await supabase.from("conversation_members").insert([
    { conversation_id: conv.id, user_id: user.id },
    { conversation_id: conv.id, user_id: otherUserId },
  ]);

  return { conversationId: conv.id };
}
