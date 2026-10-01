import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALE_COOKIE = "crispy_locale";

const RESERVED = new Set([
  "menu",
  "locations",
  "checkout",
  "delivery",
  "franchise-inquiries",
  "orders",
  "super-admin",
  "api",
  "_next",
]);

function withDefaultLocale(request: NextRequest, response: NextResponse) {
  const raw = request.cookies.get(LOCALE_COOKIE)?.value?.trim().toLowerCase() ?? "";
  if (raw && raw !== "en" && raw !== "ar") {
    response.cookies.set(LOCALE_COOKIE, "en", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return withDefaultLocale(request, NextResponse.next());
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/admin/, "/super-admin");
    return withDefaultLocale(request, NextResponse.redirect(url));
  }

  const parts = pathname.split("/").filter(Boolean);

  // One shared, easy-to-reach login for every panel: /login and /{branch}/login.
  if (pathname === "/login" || (parts.length === 2 && parts[1] === "login" && !RESERVED.has(parts[0]))) {
    const url = request.nextUrl.clone();
    url.pathname = "/super-admin/login";
    return withDefaultLocale(request, NextResponse.rewrite(url));
  }

  if (parts.length >= 2 && !RESERVED.has(parts[0])) {
    // Both branches sliced the same way, so the ternary was a no-op that
    // looked like it distinguished /{branch}/admin from /{branch}/<page>.
    const rest = parts.slice(2);
    const url = request.nextUrl.clone();
    url.pathname = rest.length > 0 ? `/super-admin/${rest.join("/")}` : "/super-admin";
    return withDefaultLocale(request, NextResponse.rewrite(url));
  }

  return withDefaultLocale(request, NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
