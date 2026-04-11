import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

const PROTECTED_ROUTES = [
  "/profile",
  "/games",
  "/surveys",
  "/chat",
  "/friends",
  "/notifications",
  "/albums",
  "/groups",
  "/search",
];

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createMiddlewareClient(request, response);
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // Brute force protection: check IP-based login rate limit via the DB-backed
  // rate_limits table (persists across serverless cold starts).
  if (pathname === "/login" || pathname.startsWith("/api/auth/")) {
    const windowStart = new Date(
      Math.floor(Date.now() / (15 * 60 * 1000)) * 15 * 60 * 1000
    ).toISOString();

    try {
      const { data: rlRecord } = await supabase
        .from("rate_limits")
        .select("request_count")
        .eq("identifier", `ip:${ip}`)
        .eq("action", "login_attempt")
        .eq("window_start", windowStart)
        .single();

      if (rlRecord && rlRecord.request_count >= 10) {
        return new NextResponse(
          JSON.stringify({
            error: {
              message:
                "Too many failed login attempts. Please try again in 15 minutes.",
              code: "ACCOUNT_LOCKED",
            },
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
    } catch {
      // Fail open if rate limit table is unavailable
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if the path requires authentication
  const requiresAuth = PROTECTED_ROUTES.some((route) => {
    if (route === "/profile") {
      return pathname.match(/^\/profile\/[^/]+\/edit/);
    }
    return pathname.startsWith(route);
  });

  if (requiresAuth && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (session && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
