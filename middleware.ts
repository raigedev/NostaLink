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

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createMiddlewareClient(request, response);

  const { data: { session } } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Check if the path requires authentication
  const requiresAuth = PROTECTED_ROUTES.some((route) => {
    if (route === "/profile") {
      // /profile/*/edit requires auth, /profile/* does not
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
