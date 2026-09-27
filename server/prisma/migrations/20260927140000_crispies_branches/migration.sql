-- The nine branches from the storefront locations page.
-- Phone was not present in that data, so phone is empty.
-- City is London because every source address says London.
-- status stays active so Coming Soon branches still appear.
-- Their closed state is the hours text "Coming Soon", not locations.status.

INSERT INTO "locations" (
  "id", "name", "slug", "address", "postcode", "city", "hours", "phone",
  "lat", "lng", "status", "delivery_enabled", "collection_enabled",
  "delivery_fee", "free_delivery_threshold", "sort_order", "updated_at"
) VALUES
  ('6f8c2a14-0b31-4d5e-9a72-11c0ffee0001', 'Harrow Road', 'harrow-road', '412 Harrow Road, London W9 2HU', 'W9 2HU', 'London', '11:00 AM – 11:00 PM', '', 51.523411, -0.196294, 'active', true, true, NULL, NULL, 0, CURRENT_TIMESTAMP),
  ('7a9d3b25-1c42-4e6f-8b83-22c0ffee0002', 'Tower Hill', 'tower-hill', 'Unit 2, Tower Hill Terrace, London EC3N 4EE', 'EC3N 4EE', 'London', '11:00 AM – 11:00 PM', '', 51.509201, -0.078397, 'active', true, true, NULL, NULL, 1, CURRENT_TIMESTAMP),
  ('8b0e4c36-2d53-4f70-9c94-33c0ffee0003', 'Kilburn', 'kilburn', '302 Kilburn High Rd, Kilburn, London NW6 2DB', 'NW6 2DB', 'London', '9:00 AM – 11:00 PM', '', 51.544201, -0.200361, 'active', true, true, NULL, NULL, 2, CURRENT_TIMESTAMP),
  ('9c1f5d47-3e64-4071-8da5-44c0ffee0004', 'Harrow', 'harrow', '253 Station Rd, Harrow, London HA1 2TB', 'HA1 2TB', 'London', '9:00 AM – 11:00 PM', '', 51.583105, -0.332066, 'active', true, true, NULL, NULL, 3, CURRENT_TIMESTAMP),
  ('ad206e58-4f75-4182-9eb6-55c0ffee0005', 'Elephant & Castle', 'elephant-and-castle', '345 Walworth Rd, Elephant & Castle, London SE17 2NA', 'SE17 2NA', 'London', '9:00 AM – 11:00 PM', '', 51.48606, -0.094754, 'active', true, true, NULL, NULL, 4, CURRENT_TIMESTAMP),
  ('be317f69-5086-4293-8fc7-66c0ffee0006', 'Edgware Road', 'edgware-road', '340 Edgware Rd, Westminster, London W2 1EA', 'W2 1EA', 'London', '11:00 AM – 11:00 PM', '', 51.52107, -0.171146, 'active', true, true, NULL, NULL, 5, CURRENT_TIMESTAMP),
  ('cf42807a-6197-43a4-90d8-77c0ffee0007', 'Stockwell', 'stockwell', '314 Clapham Rd, Lambeth, London SW9 9AE', 'SW9 9AE', 'London', '9:00 AM – 11:00 PM', '', 51.470752, -0.124765, 'active', true, true, NULL, NULL, 6, CURRENT_TIMESTAMP),
  ('d053918b-72a8-44b5-a1e9-88c0ffee0008', 'Wembley Central', 'wembley-central', '421 High Rd, Wembley, London HA9 7AB', 'HA9 7AB', 'London', 'Coming Soon', '', 51.553282, -0.29421, 'active', true, true, NULL, NULL, 7, CURRENT_TIMESTAMP),
  ('e164a29c-83b9-45c6-b2fa-99c0ffee0009', 'Ruislip', 'ruislip', '77 Victoria Road, Ruislip, London HA4 9BH', 'HA4 9BH', 'London', 'Coming Soon', '', 51.571683, -0.411649, 'active', true, true, NULL, NULL, 8, CURRENT_TIMESTAMP);

INSERT INTO "branch_menu_items" ("location_id", "menu_item_id", "price", "available", "created_at", "updated_at")
SELECT l."id", m."id", NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "locations" l
CROSS JOIN "menu_items" m
WHERE l."status" = 'active' AND m."active" = true
ON CONFLICT ("location_id", "menu_item_id") DO NOTHING;

INSERT INTO "branch_deals" ("location_id", "deal_id", "price", "available", "created_at", "updated_at")
SELECT l."id", d."id", NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "locations" l
CROSS JOIN "deals" d
WHERE l."status" = 'active' AND d."active" = true
ON CONFLICT ("location_id", "deal_id") DO NOTHING;
