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

// In-memory brute-force tracker (resets on cold start; fine for edge use)
// Key: IP address, Value: { count: number; firstSeen: number; lockedUntil?: number }
const loginAttempts = new Map<
  string,
  { count: number; firstSeen: number; lockedUntil?: number }
>();

const BRUTE_FORCE_MAX_ATTEMPTS = 10;
const BRUTE_FORCE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const BRUTE_FORCE_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isIpLockedOut(ip: string): boolean {
  const record = loginAttempts.get(ip);
  if (!record) return false;
  if (record.lockedUntil && Date.now() < record.lockedUntil) return true;
  return false;
}

function recordFailedLogin(ip: string) {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now - record.firstSeen > BRUTE_FORCE_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstSeen: now });
    return;
  }

  record.count += 1;
  if (record.count >= BRUTE_FORCE_MAX_ATTEMPTS) {
    record.lockedUntil = now + BRUTE_FORCE_LOCKOUT_MS;
  }
  loginAttempts.set(ip, record);
}

function clearLoginAttempts(ip: string) {
  loginAttempts.delete(ip);
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createMiddlewareClient(request, response);
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // Check brute-force lockout for login attempts
  if (pathname === "/login" || pathname === "/api/auth/login") {
    if (isIpLockedOut(ip)) {
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
  }

  // Track failed auth attempts via a request header set by the login action
  if (request.headers.get("x-auth-failed") === "1") {
    recordFailedLogin(ip);
  }

  if (request.headers.get("x-auth-success") === "1") {
    clearLoginAttempts(ip);
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
