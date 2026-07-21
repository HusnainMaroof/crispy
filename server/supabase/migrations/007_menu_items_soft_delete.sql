-- ============================================================
-- Allow menu_items deletion without breaking order history
-- Switch order_items.menu_item_id FK to ON DELETE SET NULL
-- ============================================================

alter table order_items
  drop constraint if exists order_items_menu_item_id_fkey,
  add constraint order_items_menu_item_id_fkey
    foreign key (menu_item_id) references menu_items(id)
    on delete set null;
