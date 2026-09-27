CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

INSERT INTO "customers" ("id", "name", "email", "phone", "created_at", "updated_at")
SELECT DISTINCT ON ("customer_id")
    "customer_id",
    "customer_name",
    "email",
    "phone",
    "created_at",
    "updated_at"
FROM "orders"
WHERE "customer_id" IS NOT NULL AND "customer_id" <> ''
ORDER BY "customer_id", "created_at" DESC;

ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
