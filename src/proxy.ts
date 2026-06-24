import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/dashboard"];
const AUTH_ROUTES = ["/login", "/signup"];
// HTTP (dev): better-auth.session_token
// HTTPS (prod): __Secure-better-auth.session_token
const SESSION_COOKIE = "better-auth.session_token";
const SESSION_COOKIE_SECURE = "__Secure-better-auth.session_token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
