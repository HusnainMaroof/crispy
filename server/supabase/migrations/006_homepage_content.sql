-- Homepage content table for managing hardcoded storefront data via admin
create table if not exists homepage_content (
  key text primary key,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed with default values for all keys
insert into homepage_content (key, content) values
  ('stats', '[
    {"value": "23", "numericPart": 23, "suffix": "", "label": "London Locations"},
    {"value": "100%", "numericPart": 100, "suffix": "%", "label": "Halal Certified"},
    {"value": "30min", "numericPart": 30, "suffix": "min", "label": "Average Delivery"},
    {"value": "12k+", "numericPart": 12, "suffix": "k+", "label": "Five-Star Reviews"}
  ]'::jsonb),
  ('hero', '{
    "heroImage": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=2000&auto=format&fit=crop",
    "pillImage": "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop",
    "heroVideo": "/sizzle-reel.mp4"
  }'::jsonb),
  ('franchise', '{
    "steps": [
      {"number": "01", "title": "Apply", "description": "Submit your application and tell us about yourself. We look for passion, drive, and a love for great food."},
      {"number": "02", "title": "Meet the Team", "description": "We will invite you for a chat. It is a two-way process — you need to vibe with us as much as we vibe with you."},
      {"number": "03", "title": "Training", "description": "Four weeks of hands-on training in our kitchens. You will learn every recipe, every trick, every secret."},
      {"number": "04", "title": "Location Scout", "description": "We will help you find the perfect spot. High footfall, strong demographics, the right energy."},
      {"number": "05", "title": "Build Out", "description": "Our design team handles the fit-out. You get a Crispies that looks and feels exactly right."},
      {"number": "06", "title": "Grand Opening", "description": "We are with you on day one. Marketing, ops support, and a queue out the door."}
    ],
    "numbers": [
      {"value": "23+", "label": "Locations"},
      {"value": "95%", "label": "Franchisee satisfaction"},
      {"value": "12 mo", "label": "Average payback"},
      {"value": "4.8", "label": "Google rating"}
    ],
    "investment": "starts from **£150,000**"
  }'::jsonb),
  ('about', '[
    {"title": "Our Story", "description": "Born in Brixton, built on flavour. Crispies started as a single counter serving the crispiest chicken and the boldest burgers in South London. Word spread fast."},
    {"title": "Halal By Default", "description": "Every single Crispies location is 100% halal certified. No exceptions. We believe great food should be accessible to everyone."},
    {"title": "Community First", "description": "We hire locally, source locally, and give back locally. Every Crispies is a reflection of the neighbourhood it serves."},
    {"title": "Unapologetically Bold", "description": "We do not do bland. Every bite is packed with flavour, every menu item is designed to hit different. This is food with personality."}
  ]'::jsonb)
on conflict (key) do nothing;

-- Update trigger
create or replace function update_homepage_content_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger homepage_content_updated_at
  before update on homepage_content
  for each row
  execute function update_homepage_content_updated_at();
