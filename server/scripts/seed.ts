import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function seed() {
  console.log("Seeding database...");

  // Business settings
  const { error: settingsErr } = await supabase.from("business_settings").insert({
    delivery_fee: 2.99,
    free_delivery_threshold: 20.00,
  });
  if (settingsErr) console.error("Settings error:", settingsErr.message);

  // Locations
  const locations = [
    { id: "loc-brixton", name: "Crispies Brixton", address: "123 Atlantic Road, Brixton, London SW9 8HS", hours: "11am–11pm", phone: "+44 20 7946 0001", sort_order: 0 },
    { id: "loc-peckham", name: "Crispies Peckham", address: "45 Rye Lane, Peckham, London SE15 5BY", hours: "11am–12am", phone: "+44 20 7946 0002", sort_order: 1 },
    { id: "loc-tottenham", name: "Crispies Tottenham", address: "78 High Road, Tottenham, London N17 8AA", hours: "11am–11pm", phone: "+44 20 7946 0003", sort_order: 2 },
    { id: "loc-stratford", name: "Crispies Stratford", address: "12 The Broadway, Stratford, London E15 1DA", hours: "11am–11pm", phone: "+44 20 7946 0004", sort_order: 3 },
    { id: "loc-lewisham", name: "Crispies Lewisham", address: "200 Lewisham High Street, London SE13 6JP", hours: "11am–12am", phone: "+44 20 7946 0005", sort_order: 4 },
    { id: "loc-hackney", name: "Crispies Hackney", address: "56 Mare Street, Hackney, London E8 4RG", hours: "11am–11pm", phone: "+44 20 7946 0006", sort_order: 5 },
  ];
  const { error: locErr } = await supabase.from("locations").insert(locations);
  if (locErr) console.error("Locations error:", locErr.message);

  // Menu categories
  const categories = [
    { id: "cat-wings", number: "01", title: "Crispies Style Wings", image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 0 },
    { id: "cat-tenders", number: "02", title: "Chicken Tenders", image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 1 },
    { id: "cat-burgers", number: "03", title: "Big Flavour Burgers", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 2 },
    { id: "cat-box", number: "04", title: "Box Meals", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 3 },
    { id: "cat-gourmet", number: "05", title: "Gourmet Burgers", image: "https://images.unsplash.com/photo-1550317135-9ba9fbc88e54?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 4 },
    { id: "cat-wrap", number: "06", title: "The Big Wrap", image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 5 },
    { id: "cat-grill", number: "07", title: "Crispies Flaming Grill", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 6 },
    { id: "cat-platters", number: "08", title: "Crispies Platters", image: "https://images.unsplash.com/photo-1576867757603-05b134ebc379?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 7 },
    { id: "cat-kids", number: "09", title: "Kids Deals", image: "https://images.unsplash.com/photo-1509042239860-f550ce740f57?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 8 },
    { id: "cat-sides", number: "10", title: "Signature Sides", image: "https://images.unsplash.com/photo-1639024471283-035a8a9c4c35?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 9 },
    { id: "cat-desserts", number: "11", title: "Desserts", image: "https://images.unsplash.com/photo-1606313564200-e1d346c0d0a1?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 10 },
  ];
  const { error: catErr } = await supabase.from("menu_categories").insert(categories);
  if (catErr) console.error("Categories error:", catErr.message);

  // Menu items
  const items = [
    { id: "item-wings-5", category_id: "cat-wings", name: "5 Wings", description: "Five crispy golden wings tossed in your choice of house sauce.", price: 5.99, image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 0 },
    { id: "item-wings-7", category_id: "cat-wings", name: "7 Wings", description: "Seven wings, more crunch, more flavour — pick your heat level.", price: 7.99, image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 1 },
    { id: "item-wings-10", category_id: "cat-wings", name: "10 Wings", description: "The full ten — perfect for sharing or going solo on a big day.", price: 10.99, image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 2 },
    { id: "item-tenders-3", category_id: "cat-tenders", name: "Trio-Tastic", description: "Three juicy hand-breaded tenders, crisp outside, tender all the way through.", price: 5.49, image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=800&h=600", badge: "3 Tenders", sort_order: 0 },
    { id: "item-tenders-5", category_id: "cat-tenders", name: "Five Easy Pieces", description: "Five golden tenders served with your choice of dipping sauce.", price: 7.99, image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=800&h=600", badge: "5 Tenders", sort_order: 1 },
    { id: "item-tenders-10", category_id: "cat-tenders", name: "Ten Steps to Heaven", description: "Ten tenders — the real deal. Share if you must.", price: 12.99, image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=800&h=600", badge: "10 Tenders", sort_order: 2 },
    { id: "item-burger-classic", category_id: "cat-burgers", name: "Classic Crispies Burger", description: "Our OG crispy chicken burger — house slaw, pickles, signature mayo on a toasted brioche bun.", price: 7.99, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 0 },
    { id: "item-burger-plant", category_id: "cat-burgers", name: "Plant Based Burger", description: "A plant-based patty with all the crunch. Lettuce, tomato, vegan mayo. Zero compromise.", price: 7.99, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800&h=600", badge: "V", badge_variant: "vegan", sort_order: 1 },
    { id: "item-burger-smoked", category_id: "cat-burgers", name: "Smoked Grill Burger", description: "Chargrilled chicken breast, smoked cheddar, caramelised onions, smoky BBQ glaze.", price: 8.99, image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 2 },
    { id: "item-burger-quarter", category_id: "cat-burgers", name: "Quarter Pounder", description: "A thick, seasoned beef-style patty stacked with fresh lettuce, tomato, and special sauce.", price: 8.49, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800&h=600", sort_order: 3 },
  ];
  const { error: itemErr } = await supabase.from("menu_items").insert(items);
  if (itemErr) console.error("Items error:", itemErr.message);

  // Deals
  const deals = [
    { id: "deal-wing-side", name: "Wing + Side Combo", description: "7 crispy wings paired with loaded fries and a dipping sauce of your choice.", price: 9.99, image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=800&h=600", badge: "Popular", active: true },
    { id: "deal-burger-drink", name: "Burger + Drink Deal", description: "Classic Crispies Burger with any regular drink. The perfect lunch combo.", price: 9.49, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800&h=600", badge: "Lunch", active: true },
    { id: "deal-family", name: "Family Feast", description: "10 wings, 5 tenders, loaded fries, and 4 dips. Feeds the whole crew.", price: 24.99, image: "https://images.unsplash.com/photo-1576867757603-05b134ebc379?auto=format&fit=crop&q=80&w=800&h=600", badge: "Save £8", active: true },
    { id: "deal-student", name: "Student Deal", description: "Trio-Tastic tenders with fries and a drink. Show your student ID.", price: 6.99, image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=800&h=600", badge: "Student", active: true },
  ];
  const { error: dealErr } = await supabase.from("deals").insert(deals);
  if (dealErr) console.error("Deals error:", dealErr.message);

  // Job posts
  const jobs = [
    { id: "job-kitchen", title: "Kitchen Team Member", location: "Brixton", type: "Full-time / Part-time", salary: "£11.50/hr", description: "Work the line, prep fresh ingredients, and deliver orders that meet our quality standards. No experience needed — we train you properly.", requirements: ["Reliable and punctual", "Team player", "Willing to learn"], status: "active" },
    { id: "job-shift", title: "Shift Leader", location: "Stratford", type: "Full-time", salary: "£28,000/yr", description: "Lead shifts, manage the kitchen flow, and ensure every customer leaves happy.", requirements: ["Previous leadership experience", "Food safety certification", "Flexible schedule"], status: "active" },
    { id: "job-manager", title: "Store Manager", location: "Peckham", type: "Full-time", salary: "£38,000/yr", description: "Run a full Crispies location. P&L ownership, team development, and ops management.", requirements: ["3+ years management experience", "P&L experience", "Passion for food"], status: "active" },
  ];
  const { error: jobErr } = await supabase.from("job_posts").insert(jobs);
  if (jobErr) console.error("Jobs error:", jobErr.message);

  console.log("Seed completed.");
}

seed();
