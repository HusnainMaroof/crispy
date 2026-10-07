import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

/**
 * Job posts for the careers pages, matched to real branches.
 *
 * The earlier `scripts/seed.ts` rows used locations like "Brixton" and "Peckham"
 * that match no `locations` row. Since job posts became branch scoped those rows
 * can no longer be managed by a branch manager and `location_id` stayed null, so
 * they are replaced here by posts that point at branches that actually exist.
 *
 * Branches whose `hours` is "Coming Soon" are deliberately left out: Wembley
 * Central and Ruislip are not trading yet, so they should not advertise roles.
 *
 * Ids are stable so re-running upserts rather than duplicating.
 */

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) {
  console.error("NEON_DATABASE_URL is not set in server/.env");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

type JobSeed = {
  id: string;
  branchSlug: string;
  title: string;
  /** Arabic display copy, the same rows the 20261005130000_job_post_arabic
   * migration backfills, so a fresh seed matches a migrated database. */
  titleAr: string;
  type: string;
  salary: string;
  description: string;
  descriptionAr: string;
  requirements: string[];
  requirementsAr: string[];
  status: "draft" | "active" | "closed";
};

const JOBS: JobSeed[] = [
  {
    id: "job-harrow-road-kitchen",
    branchSlug: "harrow-road",
    title: "Kitchen Team Member",
    titleAr: "عضو فريق المطبخ",
    type: "Full-time / Part-time",
    salary: "£11.50/hr",
    description:
      "Work the line, prep fresh ingredients, and deliver orders that meet our quality standards. No experience needed, we train you properly.",
    descriptionAr:
      "اعمل على الخط، حضّر المكونات الطازجة، وقدّم الطلبات التي تلبي معايير الجودة لدينا. لا تحتاج إلى خبرة، ندرّبك بشكل كامل.",
    requirements: ["Reliable and punctual", "Team player", "Willing to learn"],
    requirementsAr: ["موثوق وملتزم بالمواعيد", "لاعب فريق", "راغب في التعلم"],
    status: "active",
  },
  {
    id: "job-tower-hill-shift",
    branchSlug: "tower-hill",
    title: "Shift Supervisor",
    titleAr: "مشرف الوردية",
    type: "Full-time",
    salary: "£28,000/yr",
    description:
      "Lead shifts, manage the kitchen flow, and make sure every customer leaves happy.",
    descriptionAr: "قد الورديات، وأدِر سير العمل في المطبخ، وتأكد من أن كل عميل يغادر راضياً.",
    requirements: ["Previous leadership experience", "Food safety certification", "Flexible schedule"],
    requirementsAr: ["خبرة سابقة في القيادة", "شهادة سلامة الغذاء", "جدول مرن"],
    status: "active",
  },
  {
    id: "job-kilburn-manager",
    branchSlug: "kilburn",
    title: "Store Manager",
    titleAr: "مدير المتجر",
    type: "Full-time",
    salary: "£38,000/yr",
    description:
      "Run a full Crispies location. P&L ownership, team development, and day to day operations.",
    descriptionAr: "أدر فرعاً كاملاً لكريسبيز. مسؤولية الأرباح والخسائر، وتطوير الفريق، والعمليات اليومية.",
    requirements: ["3+ years management experience", "P&L experience", "Passion for food"],
    requirementsAr: ["خبرة إدارية 3 سنوات أو أكثر", "خبرة في الأرباح والخسائر", "شغف بالطعام"],
    status: "active",
  },
  {
    id: "job-elephant-castle-rider",
    branchSlug: "elephant-and-castle",
    title: "Delivery Rider",
    titleAr: "سائق توصيل",
    type: "Part-time",
    salary: "£9.50/hr + per mile",
    description:
      "Deliver orders across Elephant and Castle on a scooter. Flexible shifts, weekly pay, and a proper team behind you.",
    descriptionAr:
      "وصّل الطلبات في منطقة إليفانت آند كاسل بالسكوتر. ورديات مرنة، وأجر أسبوعي، وفريق يقف خلفك.",
    requirements: ["Own scooter or bike", "Full UK licence", "Smartphone for the app"],
    requirementsAr: ["سكوتر أو دراجة خاصة", "رخصة قيادة بريطانية كاملة", "هاتف ذكي لاستخدام التطبيق"],
    status: "active",
  },
  {
    id: "job-edgware-road-counter",
    branchSlug: "edgware-road",
    title: "Front Counter Team",
    titleAr: "فريق الواجهة",
    type: "Part-time",
    salary: "£11.00/hr",
    description:
      "Take orders, handle cash, and make every guest feel welcome from the moment they walk in.",
    descriptionAr: "استقبل الطلبات، وتعامل مع النقد، واجعل كل ضيف يشعر بالترحاب من لحظة دخوله.",
    requirements: ["Confident with cash", "Friendly manner", "Available weekends"],
    requirementsAr: ["ثقة في التعامل مع النقد", "أسلوب ودود", "متاح في عطلات نهاية الأسبوع"],
    status: "active",
  },
  {
    id: "job-stockwell-closed",
    branchSlug: "stockwell",
    title: "Weekend Team Member",
    titleAr: "عضو فريق عطلة نهاية الأسبوع",
    type: "Weekend",
    salary: "£11.50/hr",
    description:
      "Saturday and Sunday cover on the line and the counter. This role is currently on hold while we finalise the rota.",
    descriptionAr:
      "تغطية أيام السبت والأحد على الخط والواجهة. هذا الدور معلّق حالياً حتى استكمال جدول الورديات.",
    requirements: ["Available both weekend days", "Reliable and punctual"],
    requirementsAr: ["متاح في يومي نهاية الأسبوع", "موثوق وملتزم بالمواعيد"],
    status: "closed",
  },
  {
    id: "job-harrow-draft",
    branchSlug: "harrow",
    title: "Area Marketing Lead",
    titleAr: "مسؤول التسويق للمنطقة",
    type: "Full-time",
    salary: "£42,000/yr",
    description:
      "Own local marketing for the Harrow area, from social to in-store promotions. Drafted ahead of the hiring round.",
    descriptionAr:
      "مسؤول عن التسويق المحلي لمنطقة هارو، من وسائل التواصل إلى العروض الترويجية داخل الفرع. مسودة قبل جولة التوظيف.",
    requirements: ["Marketing experience", "Local market knowledge", "Driving licence"],
    requirementsAr: ["خبرة في التسويق", "معرفة بالسوق المحلي", "رخصة قيادة"],
    status: "draft",
  },
];

/** One candidate per status, so the review tab shows every pipeline state. */
const APPLICATIONS = [
  {
    id: "app-tower-hill-pending",
    jobId: "job-tower-hill-shift",
    applicant_name: "Priya Raman",
    email: "priya.raman@example.com",
    phone: "07700 900112",
    cv_url: "https://example.com/cv/priya-raman",
    cover_letter: "I have run shifts for two years at a busy chicken shop and would love to move into a larger kitchen.",
    status: "pending",
  },
  {
    id: "app-tower-hill-reviewed",
    jobId: "job-tower-hill-shift",
    applicant_name: "Daniel Okoro",
    email: "daniel.okoro@example.com",
    phone: "07700 900318",
    cv_url: "https://example.com/cv/daniel-okoro",
    cover_letter: null,
    status: "reviewed",
  },
  {
    id: "app-kilburn-shortlisted",
    jobId: "job-kilburn-manager",
    applicant_name: "Sofia Alvarez",
    email: "sofia.alvarez@example.com",
    phone: "07700 900774",
    cv_url: "https://example.com/cv/sofia-alvarez",
    cover_letter: "Six years managing sites across south London, last two as an area manager for a QSR group.",
    status: "shortlisted",
  },
  {
    id: "app-elephant-castle-hired",
    jobId: "job-elephant-castle-rider",
    applicant_name: "Marcus Bell",
    email: "marcus.bell@example.com",
    phone: "07700 900455",
    cv_url: "https://example.com/cv/marcus-bell",
    cover_letter: null,
    status: "hired",
  },
  {
    id: "app-edgware-road-rejected",
    jobId: "job-edgware-road-counter",
    applicant_name: "Tomas Novak",
    email: "tomas.novak@example.com",
    phone: null,
    cv_url: null,
    cover_letter: "Looking for something closer to home and I could start on Monday.",
    status: "rejected",
    notes: "Strong application but the wrong shift pattern for what Edgware Road needs right now.",
  },
];

async function seedJobs() {
  const branches = await prisma.locations.findMany({ select: { id: true, name: true, slug: true } });
  const bySlug = new Map(branches.map((row) => [row.slug, row]));

  const missing = [...new Set(JOBS.map((job) => job.branchSlug))].filter((slug) => !bySlug.has(slug));
  if (missing.length > 0) {
    // Refuses rather than inventing a branch, so a renamed or removed branch is a
    // loud failure instead of an orphan post.
    console.error(`Missing branches for slugs: ${missing.join(", ")}`);
    process.exit(1);
  }

  let written = 0;
  for (const job of JOBS) {
    const branch = bySlug.get(job.branchSlug)!;
    await prisma.job_posts.upsert({
      where: { id: job.id },
      create: {
        id: job.id,
        title: job.title,
        title_ar: job.titleAr,
        // Always the current branch name, never a stale copy.
        location: branch.name,
        location_id: branch.id,
        type: job.type,
        salary: job.salary,
        description: job.description,
        description_ar: job.descriptionAr,
        requirements: job.requirements,
        requirements_ar: job.requirementsAr,
        status: job.status,
      },
      update: {
        title: job.title,
        title_ar: job.titleAr,
        location: branch.name,
        location_id: branch.id,
        type: job.type,
        salary: job.salary,
        description: job.description,
        description_ar: job.descriptionAr,
        requirements: job.requirements,
        requirements_ar: job.requirementsAr,
        status: job.status,
      },
    });
    written += 1;
  }

  let applicationsWritten = 0;
  for (const application of APPLICATIONS) {
    const job = JOBS.find((row) => row.id === application.jobId);
    if (!job) {
      console.error(`Application ${application.id} names unknown job ${application.jobId}`);
      process.exit(1);
    }
    await prisma.job_applications.upsert({
      where: { id: application.id },
      create: {
        id: application.id,
        job_post_id: application.jobId,
        applicant_name: application.applicant_name,
        email: application.email,
        phone: application.phone,
        cv_url: application.cv_url,
        cover_letter: application.cover_letter,
        status: application.status,
        notes: "notes" in application ? application.notes : null,
      },
      update: {
        applicant_name: application.applicant_name,
        email: application.email,
        phone: application.phone,
        cv_url: application.cv_url,
        cover_letter: application.cover_letter,
        status: application.status,
        notes: "notes" in application ? application.notes : null,
      },
    });
    applicationsWritten += 1;
  }

  // The counter is denormalised, so it has to be rebuilt from the rows rather
  // than incremented, otherwise a re-run would double count.
  const posts = await prisma.job_posts.findMany({
    where: { id: { in: JOBS.map((job) => job.id) } },
    select: { id: true },
  });
  for (const post of posts) {
    const count = await prisma.job_applications.count({ where: { job_post_id: post.id } });
    await prisma.job_posts.update({ where: { id: post.id }, data: { applications: count } });
  }

  console.log(`Seeded ${written} job posts and ${applicationsWritten} applications.`);
  for (const job of JOBS) {
    const branch = bySlug.get(job.branchSlug)!;
    const count = await prisma.job_applications.count({ where: { job_post_id: job.id } });
    console.log(`  ${job.status.padEnd(6)} ${branch.name.padEnd(20)} ${job.title} (${count} applications)`);
  }
}

seedJobs()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });