import assert from "node:assert/strict";
import { describe, it } from "node:test";
import "dotenv/config";
import pg from "pg";
import { slugifyBranchName } from "../src/utils/slug.js";
import { accessibleLocationIds } from "../src/services/branch-access.service.js";
import { getFullMenu } from "../src/services/menu.service.js";

describe("branch slug", () => {
  it("builds a stable slug from the branch name", () => {
    assert.equal(slugifyBranchName("Crispies Brixton"), "crispies-brixton");
    assert.equal(slugifyBranchName("Elephant & Castle"), "elephant-and-castle");
  });
});

describe("branch access", () => {
  it("leaves superadmin and admin unrestricted", () => {
    assert.equal(accessibleLocationIds("superadmin", ["loc-a"]), null);
    assert.equal(accessibleLocationIds("admin", []), null);
  });

  it("limits a branch manager to assigned locations", () => {
    assert.deepEqual(accessibleLocationIds("branch_manager", ["loc-a", "loc-b"]), ["loc-a", "loc-b"]);
    assert.deepEqual(accessibleLocationIds("branch_manager", []), []);
  });
});

describe("branch foundation database", () => {
  it("keeps order history when configuration rows are removed", async () => {
    const client = new pg.Client({ connectionString: process.env.NEON_DATABASE_URL });
    await client.connect();
    try {
      await client.query("BEGIN");
      const locationId = `test-loc-${crypto.randomUUID()}`;
      const categoryId = `test-cat-${crypto.randomUUID()}`;
      const itemId = `test-item-${crypto.randomUUID()}`;
      const dealId = `test-deal-${crypto.randomUUID()}`;
      const adminId = `test-admin-${crypto.randomUUID()}`;

      await client.query(
        `INSERT INTO locations (id, name, slug, address, hours, phone, status, updated_at)
         VALUES ($1, 'Test Branch', $2, '1 Test Street', '11-11', '000', 'active', CURRENT_TIMESTAMP)`,
        [locationId, `test-${locationId}`],
      );
      await client.query(
        `INSERT INTO menu_categories (id, number, title, updated_at) VALUES ($1, '99', 'Test', CURRENT_TIMESTAMP)`,
        [categoryId],
      );
      await client.query(
        `INSERT INTO menu_items (id, category_id, name, price, active, updated_at)
         VALUES ($1, $2, 'Test Burger', 8.99, true, CURRENT_TIMESTAMP)`,
        [itemId, categoryId],
      );
      await client.query(
        `INSERT INTO deals (id, name, price, active, updated_at) VALUES ($1, 'Test Deal', 5.00, true, CURRENT_TIMESTAMP)`,
        [dealId],
      );
      await client.query(
        `INSERT INTO branch_menu_items (location_id, menu_item_id, price, available, updated_at)
         VALUES ($1, $2, NULL, true, CURRENT_TIMESTAMP)`,
        [locationId, itemId],
      );
      await client.query(
        `INSERT INTO branch_deals (location_id, deal_id, price, available, updated_at)
         VALUES ($1, $2, 4.50, true, CURRENT_TIMESTAMP)`,
        [locationId, dealId],
      );
      await client.query(
        `INSERT INTO admin_profiles (id, email, name, role, password_hash)
         VALUES ($1, $2, 'Test Manager', 'branch_manager', 'x')`,
        [adminId, `${adminId}@example.com`],
      );
      await client.query(
        `INSERT INTO admin_branch_access (admin_id, location_id) VALUES ($1, $2)`,
        [adminId, locationId],
      );

      await client.query("SAVEPOINT duplicate_menu");
      await assert.rejects(
        client.query(
          `INSERT INTO branch_menu_items (location_id, menu_item_id, available, updated_at)
           VALUES ($1, $2, true, CURRENT_TIMESTAMP)`,
          [locationId, itemId],
        ),
      );
      await client.query("ROLLBACK TO SAVEPOINT duplicate_menu");

      const order = await client.query(
        `INSERT INTO orders (customer_name, email, phone, subtotal, total, location_id, updated_at)
         VALUES ('Test', 'test@example.com', '000', 8.99, 8.99, $1, CURRENT_TIMESTAMP)
         RETURNING id`,
        [locationId],
      );
      const orderId = order.rows[0].id;
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, name, price, quantity)
         VALUES ($1, $2, 'Test Burger', 8.99, 1)`,
        [orderId, itemId],
      );

      await client.query(`DELETE FROM menu_items WHERE id = $1`, [itemId]);
      const line = await client.query(`SELECT menu_item_id, name, price, quantity FROM order_items WHERE order_id = $1`, [orderId]);
      assert.equal(line.rows[0].menu_item_id, null);
      assert.equal(line.rows[0].name, "Test Burger");
      assert.equal(Number(line.rows[0].price), 8.99);
      assert.equal(line.rows[0].quantity, 1);
      const menuLinks = await client.query(`SELECT COUNT(*) FROM branch_menu_items WHERE menu_item_id = $1`, [itemId]);
      assert.equal(Number(menuLinks.rows[0].count), 0);

      await client.query(`DELETE FROM admin_profiles WHERE id = $1`, [adminId]);
      const accessAfterAdmin = await client.query(`SELECT COUNT(*) FROM admin_branch_access WHERE admin_id = $1`, [adminId]);
      assert.equal(Number(accessAfterAdmin.rows[0].count), 0);

      await client.query(`DELETE FROM locations WHERE id = $1`, [locationId]);
      const orderRow = await client.query(`SELECT location_id FROM orders WHERE id = $1`, [orderId]);
      assert.equal(orderRow.rows[0].location_id, null);
      const dealsLeft = await client.query(`SELECT COUNT(*) FROM branch_deals WHERE location_id = $1`, [locationId]);
      const accessLeft = await client.query(`SELECT COUNT(*) FROM admin_branch_access WHERE location_id = $1`, [locationId]);
      assert.equal(Number(dealsLeft.rows[0].count), 0);
      assert.equal(Number(accessLeft.rows[0].count), 0);

      await client.query("ROLLBACK");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      await client.end();
    }
  });
});

describe("public menu contract", () => {
  it("still loads the global menu without a location", async () => {
    const menu = await getFullMenu();
    assert.ok(Array.isArray(menu));
  });
});
