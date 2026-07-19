-- Track anonymous users by cookie
alter table orders add column if not exists customer_id text;
create index if not exists idx_orders_customer on orders(customer_id);
