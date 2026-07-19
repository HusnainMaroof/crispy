-- Missing composite indexes for common query patterns
create index if not exists idx_menu_items_category_active on menu_items(category_id, active);
create index if not exists idx_orders_status_location on orders(status, location_id);
create index if not exists idx_deals_active on deals(active);

-- Consolidated dashboard stats (single-query)
create or replace function get_dashboard_stats()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'total_orders', count(*),
    'active_orders', count(*) filter (where status not in ('delivered', 'cancelled')),
    'revenue', coalesce(sum(total)::numeric, 0),
    'today_revenue', coalesce(sum(total) filter (where created_at >= now()::date)::numeric, 0)
  )
  from orders;
$$;
