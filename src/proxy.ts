import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authRatelimit, resetRatelimit } from "@/lib/rate-limit";

// UI-only redirect gate — prevents unauthenticated browsers from reaching these pages.
// This is NOT the security boundary. Every API route under /api/ enforces its own
// session check via auth.api.getSession(). Never remove those checks on the assumption
// that the middleware protects the API layer.
const PROTECTED = ["/dashboard", "/profile-setup", "/profile", "/settings", "/collection", "/wishlist", "/browse", "/listings", "/marketplace", "/transactions"];
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];
// HTTP (dev): better-auth.session_token
// HTTPS (prod): __Secure-better-auth.session_token
const SESSION_COOKIE = "better-auth.session_token";
const SESSION_COOKIE_SECURE = "__Secure-better-auth.session_token";

// Auth API paths that should be rate-limited
const RATE_LIMITED_AUTH = [
  "/api/auth/sign-in",
  "/api/auth/sign-up",
  "/api/auth/forget-password",
  "/api/auth/reset-password",
];
const RESET_AUTH_PATHS = ["/api/auth/forget-password", "/api/auth/reset-password"];

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit auth API endpoints
  if (RATE_LIMITED_AUTH.some((p) => pathname.startsWith(p))) {
    const limiter = RESET_AUTH_PATHS.some((p) => pathname.startsWith(p))
      ? resetRatelimit
      : authRatelimit;

    if (limiter) {
      const ip = getIp(request);
      const { success, limit, remaining, reset } = await limiter.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": String(limit),
              "X-RateLimit-Remaining": String(remaining),
              "X-RateLimit-Reset": String(reset),
              "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
            },
          }
        );
      }
    }
    return NextResponse.next();
  }

  const sessionToken =
    request.cookies.get(SESSION_COOKIE_SECURE)?.value ??
    request.cookies.get(SESSION_COOKIE)?.value;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (isProtected && !sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
