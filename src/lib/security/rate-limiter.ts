import { createClient } from "@/lib/supabase/server";

const RATE_LIMITS: Record<string, { maxRequests: number; windowSeconds: number }> = {
  login: { maxRequests: 5, windowSeconds: 60 },
  register: { maxRequests: 3, windowSeconds: 300 },
  post_create: { maxRequests: 50, windowSeconds: 86400 },
  comment_create: { maxRequests: 200, windowSeconds: 86400 },
  message_send: { maxRequests: 500, windowSeconds: 86400 },
  friend_request: { maxRequests: 50, windowSeconds: 86400 },
  poke: { maxRequests: 20, windowSeconds: 3600 },
  survey_create: { maxRequests: 10, windowSeconds: 86400 },
  survey_respond: { maxRequests: 100, windowSeconds: 86400 },
  file_upload: { maxRequests: 50, windowSeconds: 3600 },
  search: { maxRequests: 60, windowSeconds: 60 },
  game_score: { maxRequests: 100, windowSeconds: 3600 },
  testimonial: { maxRequests: 10, windowSeconds: 86400 },
  nudge: { maxRequests: 30, windowSeconds: 3600 },
  profile_view: { maxRequests: 300, windowSeconds: 3600 },
  api_general: { maxRequests: 100, windowSeconds: 60 },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function checkRateLimit(
  identifier: string,
  action: string
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[action] ?? RATE_LIMITS.api_general;
  const supabase = await createClient();

  const windowStart = new Date(
    Math.floor(Date.now() / (config.windowSeconds * 1000)) *
      config.windowSeconds *
      1000
  ).toISOString();

  const resetAt = new Date(
    (Math.floor(Date.now() / (config.windowSeconds * 1000)) + 1) *
      config.windowSeconds *
      1000
  );

  try {
    const { data: existing } = await supabase
      .from("rate_limits")
      .select("id, request_count")
      .eq("identifier", identifier)
      .eq("action", action)
      .eq("window_start", windowStart)
      .single();

    if (existing) {
      if (existing.request_count >= config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetAt,
        };
      }

      await supabase
        .from("rate_limits")
        .update({ request_count: existing.request_count + 1 })
        .eq("id", existing.id);

      return {
        allowed: true,
        remaining: config.maxRequests - existing.request_count - 1,
        resetAt,
      };
    }

    await supabase.from("rate_limits").insert({
      identifier,
      action,
      window_start: windowStart,
      request_count: 1,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  } catch {
    // Fail open on rate limiter errors to avoid blocking legitimate users
    return { allowed: true, remaining: 1, resetAt };
  }
}
