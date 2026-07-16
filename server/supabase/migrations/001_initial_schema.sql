-- ============================================================
-- Crispies Server — Initial Schema
-- Supabase PostgreSQL migration
-- ============================================================

-- 0. Enums
create type fulfilment_type as enum ('delivery', 'collection');
create type payment_method as enum ('card', 'cash');
create type order_status as enum ('pending', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled');
create type job_status as enum ('draft', 'active', 'closed');
create type admin_role as enum ('admin', 'superadmin');

-- 1. Menu Categories
create table if not exists menu_categories (
  id            text primary key default gen_random_uuid()::text,
  number        text not null,
  title         text not null,
  image         text not null default '',
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. Menu Items
create table if not exists menu_items (
  id            text primary key default gen_random_uuid()::text,
  category_id   text not null references menu_categories(id) on delete cascade,
  name          text not null,
  description   text not null default '',
  price         numeric(10,2) not null,
  image         text not null default '',
  badge         text,
  badge_variant text check (badge_variant in ('default', 'vegan')),
  sort_order    integer not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 3. Deals
create table if not exists deals (
  id            text primary key default gen_random_uuid()::text,
  name          text not null,
  description   text not null default '',
  price         numeric(10,2) not null,
  image         text not null default '',
  badge         text,
  badge_variant text check (badge_variant in ('default', 'vegan')),
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 4. Locations
create table if not exists locations (
  id            text primary key default gen_random_uuid()::text,
  name          text not null,
  address       text not null,
  hours         text not null,
  phone         text not null,
  lat           numeric(10,7),
  lng           numeric(10,7),
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 5. Orders
create table if not exists orders (
  id              text primary key default gen_random_uuid()::text,
  customer_name   text not null,
  email           text not null,
  phone           text not null,
  address         text,
  postcode        text,
  city            text,
  notes           text,
  fulfilment      fulfilment_type not null default 'delivery',
  payment_method  payment_method not null default 'card',
  subtotal        numeric(10,2) not null,
  delivery_fee    numeric(10,2) not null default 0,
  total           numeric(10,2) not null,
  status          order_status not null default 'pending',
  location_id     text references locations(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 6. Order Items
create table if not exists order_items (
  id            text primary key default gen_random_uuid()::text,
  order_id      text not null references orders(id) on delete cascade,
  menu_item_id  text references menu_items(id),
  name          text not null,
  price         numeric(10,2) not null,
  quantity      integer not null,
  created_at    timestamptz not null default now()
);

-- 7. Business Settings (singleton row)
create table if not exists business_settings (
  id                      text primary key default gen_random_uuid()::text,
  delivery_fee            numeric(10,2) not null default 2.99,
  free_delivery_threshold numeric(10,2) not null default 20.00,
  updated_at              timestamptz not null default now()
);

-- 8. Job Posts
create table if not exists job_posts (
  id            text primary key default gen_random_uuid()::text,
  title         text not null,
  location      text not null,
  type          text not null,
  salary        text not null,
  description   text not null,
  requirements  jsonb not null default '[]'::jsonb,
  status        job_status not null default 'draft',
  applications  integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 9. Contact Messages
create table if not exists contact_messages (
  id            text primary key default gen_random_uuid()::text,
  name          text not null,
  email         text not null,
  subject       text not null,
  message       text not null,
  type          text not null default 'general' check (type in ('general', 'franchise', 'careers', 'press')),
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);

-- 10. Admin Profiles (links to Supabase Auth users)
create table if not exists admin_profiles (
  id            text primary key,
  email         text not null unique,
  name          text not null,
  role          admin_role not null default 'admin',
  created_at    timestamptz not null default now()
);

-- Indexes
create index idx_menu_items_category on menu_items(category_id);
create index idx_menu_items_active on menu_items(active);
create index idx_orders_status on orders(status);
create index idx_orders_created on orders(created_at desc);
create index idx_order_items_order on order_items(order_id);
create index idx_job_posts_status on job_posts(status);
create index idx_contact_messages_read on contact_messages(read);

-- Auto-update updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger menu_categories_updated_at before update on menu_categories
  for each row execute function update_updated_at();
create trigger menu_items_updated_at before update on menu_items
  for each row execute function update_updated_at();
create trigger deals_updated_at before update on deals
  for each row execute function update_updated_at();
create trigger locations_updated_at before update on locations
  for each row execute function update_updated_at();
create trigger orders_updated_at before update on orders
  for each row execute function update_updated_at();
create trigger business_settings_updated_at before update on business_settings
  for each row execute function update_updated_at();
create trigger job_posts_updated_at before update on job_posts
  for each row execute function update_updated_at();

-- Row Level Security
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table deals enable row level security;
alter table locations enable row level security;
alter table business_settings enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table job_posts enable row level security;
alter table contact_messages enable row level security;
alter table admin_profiles enable row level security;

-- RLS: anon can read everything except orders, contact_messages, admin_profiles
create policy "Public read menu_categories" on menu_categories for select using (true);
create policy "Public read menu_items" on menu_items for select using (active = true);
create policy "Public read deals" on deals for select using (active = true);
create policy "Public read locations" on locations for select using (true);
create policy "Public read business_settings" on business_settings for select using (true);
create policy "Public read job_posts" on job_posts for select using (status = 'active');

-- RLS: anon can insert into orders and contact_messages
create policy "Anyone can create orders" on orders for insert with check (true);
create policy "Anyone can create order_items" on order_items for insert with check (true);
create policy "Anyone can contact us" on contact_messages for insert with check (true);

-- RLS: admin can do everything
create policy "Admin all menu_categories" on menu_categories for all using (auth.role() = 'authenticated');
create policy "Admin all menu_items" on menu_items for all using (auth.role() = 'authenticated');
create policy "Admin all deals" on deals for all using (auth.role() = 'authenticated');
create policy "Admin all locations" on locations for all using (auth.role() = 'authenticated');
create policy "Admin all business_settings" on business_settings for all using (auth.role() = 'authenticated');
create policy "Admin all orders" on orders for all using (auth.role() = 'authenticated');
create policy "Admin all order_items" on order_items for all using (auth.role() = 'authenticated');
create policy "Admin all job_posts" on job_posts for all using (auth.role() = 'authenticated');
create policy "Admin all contact_messages" on contact_messages for all using (auth.role() = 'authenticated');
create policy "Admin read admin_profiles" on admin_profiles for select using (auth.role() = 'authenticated');
