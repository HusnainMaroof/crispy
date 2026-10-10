import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getPrisma } from "../../config/prisma.js";
import { envConfig } from "../../config/env.js";
import { UnauthorizedException } from "../../utils/app-error.js";
import { checkPassword } from "../../utils/password.js";
import { serialize } from "../../utils/db.js";
import { sendSuccess } from "../../utils/response.js";
import { resolveTabs } from "../../config/admin-tabs.js";
import { normalizeRole } from "../../config/admin-roles.js";
import type { AdminProfile } from "../../types/models.js";
import { ADMIN_AUTH_COOKIE, clearAdminAuthCookie, setAdminAuthCookie } from "../../utils/admin-auth-cookie.js";
import { invalidateAdminAuth } from "../../utils/cache.js";
import { slugifyBranchName } from "../../utils/slug.js";
import { loadAuthProfile, type SessionClaims } from "../../middleware/auth.js";

function personSlug(name: string) {
  try {
    return slugifyBranchName(name);
  } catch {
    return "team";
  }
}

function homeFor(role: string, name: string, branches: { slug: string }[], tabs: string[]) {
  const slug = branches[0]?.slug;
  const normalized = normalizeRole(role);
  const base = normalized === "branch_manager" && slug ? `/${slug}/admin`
    : normalized === "staff" && slug ? `/${slug}/${personSlug(name)}` : "/super-admin";
  if (tabs.includes("dashboard")) return base;
  const segments: Record<string, string> = {
    orders: "orders", customers: "customers", menu: "menu", "branch-menu": "menu",
    staff: "staff", categories: "menu", deals: "menu", locations: "locations",
    branches: "locations", posts: "posts", content: "cms/home", settings: "settings",
  };
  const first = tabs.find((tab) => segments[tab]);
  return first ? `${base}/${segments[first]}` : base;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * `sv` must match the account's current token_version, and `ss` is when this
 * login began. Refresh copies `ss` forward, so the session cap cannot be reset.
 */
function signToken(
  profile: { id: string; email: string; role: string; token_version: number },
  sessionStart: number,
): string {
  return jwt.sign(
    { sub: profile.id, email: profile.email, role: profile.role, sv: profile.token_version, ss: sessionStart },
    envConfig.JWT.SECRET,
    { expiresIn: envConfig.JWT.EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );
}

async function publicProfile(profile: {
  id: string;
  email: string;
  name: string;
  role: string;
  tabs?: string[];
  is_active: boolean;
  created_at: Date;
}) {
  const access = await getPrisma().admin_branch_access.findMany({
    where: { admin_id: profile.id },
    select: { location: { select: { id: true, name: true, slug: true } } },
  });
  const branches = access.flatMap((row) => {
    if (!row.location) return [];
    const slug = row.location.slug || personSlug(row.location.name);
    return [{ id: row.location.id, name: row.location.name, slug }];
  });
  const tabs = resolveTabs(profile.role, profile.tabs ?? []);
  return serialize({
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: normalizeRole(profile.role) as AdminProfile["role"],
    tabs,
    is_active: profile.is_active,
    created_at: profile.created_at,
    branches,
    home: homeFor(profile.role, profile.name, branches, tabs),
  });
}

export const AuthController = {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const profile = await getPrisma().admin_profiles.findUnique({ where: { email } });

    const passwordMatches = await checkPassword(password, profile?.password_hash);
    if (!profile || !passwordMatches || !profile.is_active) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const user = await publicProfile(profile);
    const token = signToken(profile, nowSeconds());
    setAdminAuthCookie(res, token);
    sendSuccess(res, { user });
  },

  async refresh(req: Request, res: Response) {
    const payload = req.admin;
    if (!payload || payload.session_started_at === undefined) {
      throw new UnauthorizedException("Not authenticated");
    }

    const profile = await getPrisma().admin_profiles.findUnique({ where: { id: payload.sub } });
    if (!profile?.is_active) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // Keeps the original login time, so refreshing never extends the session cap.
    const token = signToken(profile, payload.session_started_at);
    setAdminAuthCookie(res, token);
    sendSuccess(res, { user: await publicProfile(profile) });
  },

  /**
   * Revokes the session, not just the cookie. The token is checked for its
   * signature only (expiry ignored, so a stale tab can still sign out). A
   * forged or unreadable token has nothing to revoke and is ignored.
   */
  async logout(req: Request, res: Response) {
    const header = req.headers?.authorization;
    const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
    const token = bearer || req.cookies?.[ADMIN_AUTH_COOKIE];
    if (typeof token === "string" && token) {
      try {
        const claims = jwt.verify(token, envConfig.JWT.SECRET, { ignoreExpiration: true }) as SessionClaims;
        await getPrisma().admin_profiles.update({
          where: { id: claims.sub },
          data: { token_version: { increment: 1 } },
        });
        void invalidateAdminAuth(claims.sub);
      } catch {
        // Not a token this server issued, or the account is gone: nothing to revoke.
      }
    }
    clearAdminAuthCookie(res);
    sendSuccess(res);
  },

  async me(req: Request, res: Response) {
    // Reuses the memoized profile the auth middleware already loaded (same row,
    // same invalidation), so this request no longer pays its own profile read.
    const profile = await loadAuthProfile(req.admin!.sub);
    if (!profile?.is_active) {
      throw new UnauthorizedException("Invalid email or password");
    }
    sendSuccess(res, await publicProfile(profile));
  },

  async updateMe(req: Request, res: Response) {
    const profile = await getPrisma().admin_profiles.update({
      where: { id: req.admin!.sub },
      data: { name: req.body.name },
    });
    sendSuccess(res, await publicProfile(profile));
  },
};
