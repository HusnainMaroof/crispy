import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) {
  console.error("NEON_DATABASE_URL is not set in server/.env");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function seed() {
  console.log("Seeding database...");

  await prisma.business_settings.create({
    data: { delivery_fee: 2.99, free_delivery_threshold: 20 },
  });

  await prisma.locations.createMany({
    data: [
      { id: "6f8c2a14-0b31-4d5e-9a72-11c0ffee0001", name: "Harrow Road", slug: "harrow-road", address: "412 Harrow Road, London W9 2HU", postcode: "W9 2HU", city: "London", hours: "11:00 AM – 11:00 PM", phone: "", lat: 51.523411, lng: -0.196294, sort_order: 0 },
      { id: "7a9d3b25-1c42-4e6f-8b83-22c0ffee0002", name: "Tower Hill", slug: "tower-hill", address: "Unit 2, Tower Hill Terrace, London EC3N 4EE", postcode: "EC3N 4EE", city: "London", hours: "11:00 AM – 11:00 PM", phone: "", lat: 51.509201, lng: -0.078397, sort_order: 1 },
      { id: "8b0e4c36-2d53-4f70-9c94-33c0ffee0003", name: "Kilburn", slug: "kilburn", address: "302 Kilburn High Rd, Kilburn, London NW6 2DB", postcode: "NW6 2DB", city: "London", hours: "9:00 AM – 11:00 PM", phone: "", lat: 51.544201, lng: -0.200361, sort_order: 2 },
      { id: "9c1f5d47-3e64-4071-8da5-44c0ffee0004", name: "Harrow", slug: "harrow", address: "253 Station Rd, Harrow, London HA1 2TB", postcode: "HA1 2TB", city: "London", hours: "9:00 AM – 11:00 PM", phone: "", lat: 51.583105, lng: -0.332066, sort_order: 3 },
      { id: "ad206e58-4f75-4182-9eb6-55c0ffee0005", name: "Elephant & Castle", slug: "elephant-and-castle", address: "345 Walworth Rd, Elephant & Castle, London SE17 2NA", postcode: "SE17 2NA", city: "London", hours: "9:00 AM – 11:00 PM", phone: "", lat: 51.48606, lng: -0.094754, sort_order: 4 },
      { id: "be317f69-5086-4293-8fc7-66c0ffee0006", name: "Edgware Road", slug: "edgware-road", address: "340 Edgware Rd, Westminster, London W2 1EA", postcode: "W2 1EA", city: "London", hours: "11:00 AM – 11:00 PM", phone: "", lat: 51.52107, lng: -0.171146, sort_order: 5 },
      { id: "cf42807a-6197-43a4-90d8-77c0ffee0007", name: "Stockwell", slug: "stockwell", address: "314 Clapham Rd, Lambeth, London SW9 9AE", postcode: "SW9 9AE", city: "London", hours: "9:00 AM – 11:00 PM", phone: "", lat: 51.470752, lng: -0.124765, sort_order: 6 },
      { id: "d053918b-72a8-44b5-a1e9-88c0ffee0008", name: "Wembley Central", slug: "wembley-central", address: "421 High Rd, Wembley, London HA9 7AB", postcode: "HA9 7AB", city: "London", hours: "Coming Soon", phone: "", lat: 51.553282, lng: -0.29421, sort_order: 7 },
      { id: "e164a29c-83b9-45c6-b2fa-99c0ffee0009", name: "Ruislip", slug: "ruislip", address: "77 Victoria Road, Ruislip, London HA4 9BH", postcode: "HA4 9BH", city: "London", hours: "Coming Soon", phone: "", lat: 51.571683, lng: -0.411649, sort_order: 8 },
    ],
  });

  await prisma.menu_categories.createMany({
    data: [
      { id: "cat-wings", number: "01", title: "Crispies Style Wings", title_ar: "أجنحة كريسبيز", image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 0 },
      { id: "cat-tenders", number: "02", title: "Chicken Tenders", title_ar: "أصابع الدجاج", image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 1 },
      { id: "cat-burgers", number: "03", title: "Big Flavour Burgers", title_ar: "برجر بنكهات قوية", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 2 },
      { id: "cat-box", number: "04", title: "Box Meals", title_ar: "وجبات الصناديق", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 3 },
      { id: "cat-gourmet", number: "05", title: "Gourmet Burgers", title_ar: "برجر جورميه", image: "https://images.unsplash.com/photo-1550317135-9ba9fbc88e54?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 4 },
      { id: "cat-wrap", number: "06", title: "The Big Wrap", title_ar: "الراب الكبير", image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 5 },
      { id: "cat-grill", number: "07", title: "Crispies Flaming Grill", title_ar: "شواء كريسبيز الناري", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 6 },
      { id: "cat-platters", number: "08", title: "Crispies Platters", title_ar: "صحون كريسبيز", image: "https://images.unsplash.com/photo-1576867757603-05b134ebc379?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 7 },
      { id: "cat-kids", number: "09", title: "Kids Deals", title_ar: "وجبات الأطفال", image: "https://images.unsplash.com/photo-1509042239860-f550ce740f57?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 8 },
      { id: "cat-sides", number: "10", title: "Signature Sides", title_ar: "الإضافات المميزة", image: "https://images.unsplash.com/photo-1639024471283-035a8a9c4c35?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 9 },
      { id: "cat-desserts", number: "11", title: "Desserts", title_ar: "الحلويات", image: "https://images.unsplash.com/photo-1606313564200-e1d346c0d0a1?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 10 },
    ],
  });

  await prisma.deals.createMany({
    data: [
      { id: "deal-wing-side", name: "Wing + Side Combo", name_ar: "كومبو جناح + إضافة", description: "7 crispy wings paired with loaded fries and a dipping sauce of your choice.", description_ar: "7 أجنحة مقرمشة مع بطاطس محملة وصلصة غمس من اختيارك.", price: 9.99, image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=800&h=600", badge: "Popular", active: true },
      { id: "deal-burger-drink", name: "Burger + Drink Deal", name_ar: "عرض برجر + مشروب", description: "Classic Crispies Burger with any regular drink. The perfect lunch combo.", description_ar: "برجر كريسبيز الكلاسيكي مع أي مشروب عادي. الكومبو المثالي للغداء.", price: 9.49, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800&h=600", badge: "Lunch", active: true },
      { id: "deal-family", name: "Family Feast", name_ar: "وليمة العائلة", description: "10 wings, 5 tenders, loaded fries, and 4 dips. Feeds the whole crew.", description_ar: "10 أجنحة، 5 قطع تندرز، بطاطس محملة، و4 صلصات. تكفي الجميع.", price: 24.99, image: "https://images.unsplash.com/photo-1576867757603-05b134ebc379?auto=format&fit=crop&q=80&w=800&h=600", badge: "Save £8", active: true },
      { id: "deal-student", name: "Student Deal", name_ar: "عرض الطالب", description: "Trio-Tastic tenders with fries and a drink. Show your student ID.", description_ar: "قطع تريو لذيذة مع بطاطس ومشروب. أظهر بطاقتك الطلابية.", price: 6.99, image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=800&h=600", badge: "Student", active: true },
    ],
  });

  const branches = await prisma.locations.findMany({ where: { status: "active" }, select: { id: true } });
  const dealRows = await prisma.deals.findMany({ where: { active: true }, select: { id: true } });
  if (branches.length && dealRows.length) {
    await prisma.branch_deals.createMany({
      data: branches.flatMap((branch) => dealRows.map((deal) => ({ location_id: branch.id, deal_id: deal.id, available: true }))),
    });
  }

  // Branch scoped, so these have to name branches that exist above. The ids match
  // scripts/seed-jobs.ts so a full seed and the jobs seed converge on one set.
  await prisma.job_posts.createMany({
    data: [
      { id: "job-harrow-road-kitchen", title: "Kitchen Team Member", location: "Harrow Road", location_id: "6f8c2a14-0b31-4d5e-9a72-11c0ffee0001", type: "Full-time / Part-time", salary: "£11.50/hr", description: "Work the line, prep fresh ingredients, and deliver orders that meet our quality standards. No experience needed — we train you properly.", requirements: ["Reliable and punctual", "Team player", "Willing to learn"], status: "active" },
      { id: "job-tower-hill-shift", title: "Shift Supervisor", location: "Tower Hill", location_id: "7a9d3b25-1c42-4e6f-8b83-22c0ffee0002", type: "Full-time", salary: "£28,000/yr", description: "Lead shifts, manage the kitchen flow, and ensure every customer leaves happy.", requirements: ["Previous leadership experience", "Food safety certification", "Flexible schedule"], status: "active" },
      { id: "job-kilburn-manager", title: "Store Manager", location: "Kilburn", location_id: "8b0e4c36-2d53-4f70-9c94-33c0ffee0003", type: "Full-time", salary: "£38,000/yr", description: "Run a full Crispies location. P&L ownership, team development, and ops management.", requirements: ["3+ years management experience", "P&L experience", "Passion for food"], status: "active" },
    ],
  });

  console.log("Seed completed. No menu products were inserted.");
}

seed()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
