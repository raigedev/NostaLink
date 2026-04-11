"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_PENDING_TESTIMONIALS = 5;

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

  let user;
  try {
    const { data: authData, error } = await supabase.auth.getUser();
    if (error || !authData.user) throw new Error("Unauthorized");
    user = authData.user;
  } catch {
    return { error: "Unauthorized", code: "UNAUTHORIZED", status: 401 };
  }

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

  if (error) return { error: "Failed to create survey" };
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

  let user;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error("Unauthorized");
    user = data.user;
  } catch {
    return { error: "Unauthorized", code: "UNAUTHORIZED", status: 401 };
  }

  const { error } = await supabase.from("survey_responses").insert({
    survey_id: surveyId,
    user_id: user.id,
    answers,
  });

  if (error) return { error: "Failed to submit survey response" };
  return { success: true };
}

export async function submitTestimonial(recipientId: string, content: string) {
  const supabase = await createClient();

  let user;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error("Unauthorized");
    user = data.user;
  } catch {
    return { error: "Unauthorized", code: "UNAUTHORIZED", status: 401 };
  }

  if (user.id === recipientId) {
    return { error: "Cannot write a testimonial for yourself" };
  }

  // Enforce max 5 pending testimonials per recipient
  const { count } = await supabase
    .from("testimonials")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", recipientId)
    .eq("is_approved", false);

  if ((count ?? 0) >= MAX_PENDING_TESTIMONIALS) {
    return {
      error: "This user has reached the maximum number of pending testimonials",
    };
  }

  const { error } = await supabase.from("testimonials").insert({
    author_id: user.id,
    recipient_id: recipientId,
    content: content.trim(),
    is_approved: false,
  });

  if (error) return { error: "Failed to submit testimonial" };
  return { success: true };
}

export async function approveTestimonial(testimonialId: string) {
  const supabase = await createClient();

  let user;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error("Unauthorized");
    user = data.user;
  } catch {
    return { error: "Unauthorized", code: "UNAUTHORIZED", status: 401 };
  }

  // Only the recipient can approve — enforced by filtering on recipient_id
  const { error } = await supabase
    .from("testimonials")
    .update({ is_approved: true })
    .eq("id", testimonialId)
    .eq("recipient_id", user.id);

  if (error) return { error: "Failed to approve testimonial" };
  revalidatePath("/profile");
  return { success: true };
}
