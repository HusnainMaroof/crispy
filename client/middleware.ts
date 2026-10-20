import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALE_COOKIE = "crispy_locale";

const RESERVED = new Set([
  "menu",
  "locations",
  "checkout",
  "delivery",
  "franchise-inquiries",
  // Single-segment, so the branch rewrite below never sees it. Listed anyway so
  // a nested /career/:id route cannot be rewritten to /super-admin/:id.
  "career",
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

/** Staff panels must never show up in search, including the /{branch}/... rewrites. */
function noindex(response: NextResponse) {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // One host for search engines: www.crispiesuk.com served the same pages as a
  // duplicate site, so it now redirects permanently to the bare domain.
  const host = request.headers.get("host") ?? "";
  if (host.startsWith("www.")) {
    return NextResponse.redirect(`https://${host.slice(4)}${pathname}${search}`, 308);
  }

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
    return noindex(withDefaultLocale(request, NextResponse.rewrite(url)));
  }

  if (parts.length >= 2 && !RESERVED.has(parts[0])) {
    // Both branches sliced the same way, so the ternary was a no-op that
    // looked like it distinguished /{branch}/admin from /{branch}/<page>.
    const rest = parts.slice(2);
    const url = request.nextUrl.clone();
    url.pathname = rest.length > 0 ? `/super-admin/${rest.join("/")}` : "/super-admin";
    return noindex(withDefaultLocale(request, NextResponse.rewrite(url)));
  }

  if (pathname === "/super-admin" || pathname.startsWith("/super-admin/")) {
    return noindex(withDefaultLocale(request, NextResponse.next()));
  }

  return withDefaultLocale(request, NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
