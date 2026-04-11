"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Game {
  id: string;
  slug: string;
  name: string;
  description: string;
  thumbnail_url: string | null;
}

export interface GameScore {
  id: string;
  game_id: string;
  user_id: string;
  score: number;
  created_at: string;
  profile?: { username: string; display_name: string | null; avatar_url: string | null };
}

export async function getGames(): Promise<Game[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("games").select("*").order("name");
  return data ?? [];
}

export async function submitScore(gameId: string, score: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("game_scores").insert({
    game_id: gameId,
    user_id: user.id,
    score,
  });

  if (error) return { error: error.message };
  revalidatePath("/games");
  return { success: true };
}

export async function getLeaderboard(gameId: string, limit = 10): Promise<GameScore[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("game_scores")
    .select(`*, profile:profiles!user_id(username, display_name, avatar_url)`)
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit);
  return (data as GameScore[]) ?? [];
}

export async function sendGameInvite(gameId: string, toUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("game_invites").insert({
    game_id: gameId,
    from_user_id: user.id,
    to_user_id: toUserId,
    status: "pending",
  });

  if (error) return { error: error.message };
  return { success: true };
}
