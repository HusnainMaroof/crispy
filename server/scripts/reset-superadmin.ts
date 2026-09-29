import "dotenv/config";
import { getPrisma } from "../src/config/prisma.js";
import { hashPassword } from "../src/utils/password.js";

const email = process.env.SUPERADMIN_EMAIL;
const password = process.env.SUPERADMIN_PASSWORD;
if (!email || !password) {
  throw new Error("Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD");
}

const prisma = getPrisma();
await prisma.admin_branch_access.deleteMany();
const removed = await prisma.admin_profiles.deleteMany();
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
console.log(`Removed ${removed.count} accounts. One super admin remains: ${email}`);
await prisma.$disconnect();
