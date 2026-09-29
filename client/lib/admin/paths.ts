const RESERVED = new Set([
  "menu",
  "locations",
  "checkout",
  "delivery",
  "franchise-inquiries",
  "orders",
  "super-admin",
  "api",
]);

export function splitPanel(pathname: string): { prefix: string; rest: string } {
  if (pathname === "/super-admin" || pathname.startsWith("/super-admin/")) {
    const rest = pathname.slice("/super-admin".length) || "/";
    return { prefix: "/super-admin", rest };
  }
  const parts = pathname.split("/").filter(Boolean);
  // Shared login (/login, /{branch}/login) always maps onto the login screen.
  if (parts.length === 1 && parts[0] === "login") {
    return { prefix: "/super-admin", rest: "/login" };
  }
  if (parts.length === 2 && parts[1] === "login" && !RESERVED.has(parts[0])) {
    return { prefix: "/super-admin", rest: "/login" };
  }
  if (parts.length >= 2 && !RESERVED.has(parts[0]) && parts[1] === "admin") {
    const rest = parts.slice(2).join("/");
    return { prefix: `/${parts[0]}/admin`, rest: rest ? `/${rest}` : "/" };
  }
  if (parts.length >= 2 && !RESERVED.has(parts[0])) {
    const rest = parts.slice(2).join("/");
    return { prefix: `/${parts[0]}/${parts[1]}`, rest: rest ? `/${rest}` : "/" };
  }
  return { prefix: "/super-admin", rest: pathname.startsWith("/") ? pathname : `/${pathname}` };
}

export function panelHref(prefix: string, segment = ""): string {
  const clean = segment.replace(/^\//, "");
  return clean ? `${prefix}/${clean}` : prefix;
}
