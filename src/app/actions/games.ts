"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { auditSuspiciousGameScore } from "@/lib/security/audit-logger";

export interface Game {
  id: string;
  slug: string;
  name: string;
  description: string;
  thumbnail_url: string | null;
  max_possible_score?: number | null;
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

  let user;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error("Unauthorized");
    user = data.user;
  } catch {
    return { error: "Unauthorized", code: "UNAUTHORIZED", status: 401 };
  }

  if (typeof score !== "number" || !isFinite(score) || score < 0) {
    return { error: "Invalid score" };
  }

  // Validate score against the game's max_possible_score
  const { data: game } = await supabase
    .from("games")
    .select("id, max_possible_score")
    .eq("id", gameId)
    .single();

  if (!game) return { error: "Game not found" };

  if (
    game.max_possible_score != null &&
    score > game.max_possible_score
  ) {
    await auditSuspiciousGameScore(
      user.id,
      gameId,
      score,
      game.max_possible_score
    );
    return { error: "Score exceeds maximum possible score for this game" };
  }

  const { error } = await supabase.from("game_scores").insert({
    game_id: gameId,
    user_id: user.id,
    score,
  });

  if (error) return { error: "Failed to submit score" };
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

  let user;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error("Unauthorized");
    user = data.user;
  } catch {
    return { error: "Unauthorized", code: "UNAUTHORIZED", status: 401 };
  }

  const { error } = await supabase.from("game_invites").insert({
    game_id: gameId,
    from_user_id: user.id,
    to_user_id: toUserId,
    status: "pending",
  });

  if (error) return { error: "Failed to send game invite" };
  return { success: true };
}
