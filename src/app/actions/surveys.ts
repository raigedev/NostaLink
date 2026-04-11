"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SurveyQuestion {
  id: string;
  text: string;
  type: "text" | "multiple_choice" | "rating" | "yes_no";
  options?: string[];
  required: boolean;
}

export interface Survey {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  questions: SurveyQuestion[];
  created_at: string;
  creator?: { username: string; display_name: string | null; avatar_url: string | null };
}

export async function createSurvey(data: {
  title: string;
  description?: string;
  questions: SurveyQuestion[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: survey, error } = await supabase
    .from("surveys")
    .insert({
      creator_id: user.id,
      title: data.title,
      description: data.description,
      questions: data.questions,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/surveys");
  return { survey };
}

export async function getSurveys(limit = 20, offset = 0): Promise<Survey[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("surveys")
    .select(`*, creator:profiles!creator_id(username, display_name, avatar_url)`)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  return (data as Survey[]) ?? [];
}

export async function getSurvey(id: string): Promise<Survey | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("surveys")
    .select(`*, creator:profiles!creator_id(username, display_name, avatar_url)`)
    .eq("id", id)
    .single();
  return (data as Survey) ?? null;
}

export async function submitSurveyResponse(surveyId: string, answers: Record<string, unknown>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("survey_responses").insert({
    survey_id: surveyId,
    user_id: user.id,
    answers,
  });

  if (error) return { error: error.message };
  return { success: true };
}
