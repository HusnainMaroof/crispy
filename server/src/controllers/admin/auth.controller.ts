import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getPrisma } from "../../config/prisma.js";
import { envConfig } from "../../config/env.js";
import { UnauthorizedException } from "../../utils/app-error.js";
import { verifyPassword } from "../../utils/password.js";
import { serialize } from "../../utils/db.js";
import { sendSuccess } from "../../utils/response.js";
import { resolveTabs } from "../../config/admin-tabs.js";
import { normalizeRole } from "../../config/admin-roles.js";
import type { AdminProfile } from "../../types/models.js";
import { clearAdminAuthCookie, setAdminAuthCookie } from "../../utils/admin-auth-cookie.js";
import { slugifyBranchName } from "../../utils/slug.js";

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

function signToken(profile: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { sub: profile.id, email: profile.email, role: profile.role },
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

    const passwordMatches = profile ? await verifyPassword(password, profile.password_hash) : false;
    if (!profile || !passwordMatches || !profile.is_active) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const user = await publicProfile(profile);
    const token = signToken(profile);
    setAdminAuthCookie(res, token);
    sendSuccess(res, { user });
  },

  async refresh(req: Request, res: Response) {
    const payload = req.admin;
    if (!payload) {
      throw new UnauthorizedException("Not authenticated");
    }

    const profile = await getPrisma().admin_profiles.findUnique({ where: { id: payload.sub } });
    if (!profile?.is_active) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const token = signToken(profile);
    setAdminAuthCookie(res, token);
    sendSuccess(res, { user: await publicProfile(profile) });
  },

  async logout(_req: Request, res: Response) {
    clearAdminAuthCookie(res);
    sendSuccess(res);
  },

  async me(req: Request, res: Response) {
    const profile = await getPrisma().admin_profiles.findUnique({ where: { id: req.admin!.sub } });
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
