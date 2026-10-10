import "dotenv/config";
import { getPrisma } from "../src/config/prisma.js";
import { hashPassword } from "../src/utils/password.js";

const email = process.env.SUPERADMIN_EMAIL;
const password = process.env.SUPERADMIN_PASSWORD;
if (!email || !password) {
  throw new Error("Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD");
}

/**
 * --purge wipes every other admin and all branch access first. Without it this
 * script only ever touches the one account named by SUPERADMIN_EMAIL, so the
 * branch managers and staff on the row are left alone. The name of the script
 * used to promise a reset but quietly deleted the whole table, which is not
 * something a routine credential fix should do.
 */
const purge = process.argv.includes("--purge");

const prisma = getPrisma();

if (purge) {
  const access = await prisma.admin_branch_access.deleteMany();
  const removed = await prisma.admin_profiles.deleteMany();
  console.log(`Purged ${access.count} branch grants and ${removed.count} accounts.`);
}

// `tabs: []` on an existing row is left untouched below, because tabsForRole
// already resolves the full set for a super admin and an empty stored array
// would only hide the difference between "never chosen" and "reset".
const existing = await prisma.admin_profiles.findUnique({
  where: { email },
  select: { id: true, role: true },
});

if (existing) {
  await prisma.admin_profiles.update({
    where: { id: existing.id },
    data: {
      role: "superadmin",
      password_hash: await hashPassword(password),
      is_active: true,
      // Bumping this revokes every token already issued to the account, so a
      // password reset actually ends the sessions it was meant to end.
      token_version: { increment: 1 },
    },
  });
  console.log(`Reset password for existing account ${email} (was ${existing.role}).`);
} else {
  await prisma.admin_profiles.create({
    data: {
      email,
      name: "Super admin",
      role: "superadmin",
      password_hash: await hashPassword(password),
      tabs: [],
      is_active: true,
    },
  });
  console.log(`Created super admin ${email}.`);
}

const remaining = await prisma.admin_profiles.count();
console.log(`Done. ${remaining} admin account(s) exist.`);

await prisma.$disconnect();