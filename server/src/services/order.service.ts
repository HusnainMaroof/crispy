import { Prisma } from "../generated/prisma/client.js";
import { getPrisma } from "../config/prisma.js";
import { logger } from "../middleware/logger.js";
import { sendEmail, sendAdminEmail } from "./email.service.js";
import { BadRequestException, ConflictException, ForbiddenException, InternalServerException, NotFoundException } from "../utils/app-error.js";
import { assertLocationAccess, isBranchScoped } from "./branch-access.service.js";
import type { AuthPayload } from "../types/responses.js";
import { rethrow, serialize } from "../utils/db.js";
import type { PageRequest } from "../utils/pagination.js";
import type { Order, OrderItem } from "../types/models.js";
import {
  orderConfirmationEmail,
  newOrderAdminEmail,
  orderStatusUpdateEmail,
  orderDeliveredEmail,
  orderCancelledEmail,
} from "./email-templates.js";
import { quoteCart, type QuoteLine } from "./quote.service.js";
import { cachedJson, invalidateDashboardCache, TTL_DASHBOARD_SECONDS } from "../utils/cache.js";

interface CreateOrderInput {
  customer_name: string;
  email: string;
  phone: string;
  address?: string | null;
  postcode?: string | null;
  city?: string | null;
  notes?: string | null;
  fulfilment: "delivery" | "collection";
  payment_method: "card" | "cash";
  location_id: string;
  customer_id?: string | null;
  checkout_key: string;
  locale?: string;
  items: { kind: "product" | "deal"; id: string; quantity: number }[];
}

function db() {
  return getPrisma();
}

/**
 * orders.id is a BigInt column, so the path segment has to be an integer.
 * BigInt() throws a bare SyntaxError on anything else ("abc", "1.5"), which the
 * error handler turns into a 500. A malformed id is a missing record, so it is
 * rejected as a 404 before it reaches the driver.
 */
function orderId(id: string | number): bigint {
  if (typeof id === "bigint") return id;
  const raw = String(id).trim();
  if (!/^\d+$/.test(raw)) throw new NotFoundException("Order not found");
  return BigInt(raw);
}

export async function createOrder(input: CreateOrderInput): Promise<Order & { items: OrderItem[] }> {
  const existing = await db().orders.findUnique({
    where: { checkout_key: input.checkout_key },
    include: { order_items: { orderBy: { id: "asc" } } },
  });
  if (existing) return replayCheckout(existing, input.customer_id ?? null);

  const quote = await quoteCart(input.location_id, input.items, input.locale);
  const deliveryFee = new Prisma.Decimal(0);
  const subtotal = new Prisma.Decimal(quote.subtotal);
  const total = subtotal.add(deliveryFee);

  let created;
  try {
    created = await db().$transaction(async (tx) => {
      if (input.customer_id) {
        await tx.customers.upsert({
          where: { id: input.customer_id },
          create: {
            id: input.customer_id,
            name: input.customer_name,
            email: input.email,
            phone: input.phone,
          },
          update: {},
        });
      }
      const order = await tx.orders.create({
        data: {
          customer_name: input.customer_name,
          email: input.email,
          phone: input.phone,
          address: input.fulfilment === "delivery" ? input.address : null,
          postcode: input.fulfilment === "delivery" ? input.postcode : null,
          city: input.fulfilment === "delivery" ? input.city : null,
          notes: input.notes,
          fulfilment: input.fulfilment,
          payment_method: input.payment_method,
          location_id: quote.locationId,
          customer_id: input.customer_id,
          checkout_key: input.checkout_key,
          subtotal,
          delivery_fee: deliveryFee,
          total,
          status: "pending",
        },
      });
      await tx.order_items.createMany({
        data: quote.items.map((item) => lineData(order.id, item)),
      });
      return order;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raced = await db().orders.findUnique({
        where: { checkout_key: input.checkout_key },
        include: { order_items: { orderBy: { id: "asc" } } },
      });
      if (raced) return replayCheckout(raced, input.customer_id ?? null);
    }
    rethrow(error, "Order not found");
  }

  const saved = await db().orders.findUnique({
    where: { id: created.id },
    include: { order_items: { orderBy: { id: "asc" } } },
  });
  if (!saved) throw new InternalServerException("Failed to create order");
  // Dashboard totals are cached, so a new order must drop them. Fire-and-forget:
  // the response must not wait on cache work, and a failed invalidation is
  // bounded by the TTL.
  void invalidateDashboardCache();
  const { order_items, ...order } = saved;
  const result = serialize<Order & { items: OrderItem[] }>({ ...order, items: order_items });

  const { subject: confirmSubject, html: confirmHtml } = orderConfirmationEmail(result, result.items);
  sendEmail({ to: result.email, subject: confirmSubject, htmlContent: confirmHtml }).catch(() => {});
  const { subject: adminSubject, html: adminHtml } = newOrderAdminEmail(result, result.items);
  sendAdminEmail(adminSubject, adminHtml).catch(() => {});
  return result;
}

/**
 * A repeated checkout key returns the order it made, so a retried request does
 * not place a second order. The key comes from the client, so the owner must
 * match: another customer's key must not expose that customer's order.
 */
function replayCheckout(
  existing: Prisma.ordersGetPayload<{ include: { order_items: true } }>,
  customerId: string | null,
): Order & { items: OrderItem[] } {
  if (existing.customer_id !== customerId) {
    throw new ConflictException("This checkout was already submitted");
  }
  const { order_items, ...order } = existing;
  return serialize<Order & { items: OrderItem[] }>({ ...order, items: order_items });
}

function lineData(orderId: bigint, item: QuoteLine) {
  return {
    order_id: orderId,
    kind: item.kind,
    menu_item_id: item.kind === "product" ? item.id : null,
    deal_id: item.kind === "deal" ? item.id : null,
    name: item.name,
    price: item.unitPrice,
    quantity: item.quantity,
  };
}

export async function getOrders(
  filter: { status?: string; location_id?: string; location_ids?: string[]; fulfilment?: string; q?: string } & PageRequest,
): Promise<(Order & { item_count: number; location_name: string | null })[]> {
  const where = orderWhere(filter);

  const rows = await db().orders.findMany({
    where,
    skip: filter.skip,
    take: filter.limit,
    // List rows carry a line *count*, not the lines themselves. The order
    // detail endpoint loads the full `order_items`; shipping every line for
    // every row here made the payload grow with (lines x page size) for data the
    // list grid never renders. `_count` is computed in the database, so no
    // relation rows are transferred.
    include: {
      _count: { select: { order_items: true } },
      location: { select: { name: true } },
    },
    // id DESC is the tiebreaker. created_at alone is not a stable sort key:
    // two orders placed in the same millisecond could swap places between two
    // page requests, which duplicates one row and drops another.
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
  });

  return rows.map((row) => {
    const { _count, location, ...order } = row;
    return serialize<Order & { item_count: number; location_name: string | null }>({
      ...order,
      item_count: _count.order_items,
      location_name: location?.name ?? null,
    });
  });
}

export async function countOrders(filter: {
  status?: string;
  location_id?: string;
  location_ids?: string[];
  fulfilment?: string;
  q?: string;
}): Promise<number> {
  return db().orders.count({ where: orderWhere(filter) });
}

/** One place that builds the list filter, so the page and the count agree. */
function orderWhere(filter: { status?: string; location_id?: string; location_ids?: string[]; fulfilment?: string; q?: string }) {
  const q = filter.q?.trim();
  // A requested branch and an allow-list are both predicates. Putting them on
  // the same object key let the allow-list replace the requested branch, so a
  // manager with several branches could not narrow the list to one of them.
  const location: Prisma.ordersWhereInput[] = [];
  if (filter.location_id) location.push({ location_id: filter.location_id });
  if (filter.location_ids) location.push({ location_id: { in: filter.location_ids } });
  return {
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.fulfilment ? { fulfilment: filter.fulfilment } : {}),
    ...(location.length > 0 ? { AND: location } : {}),
    // Free-text search moves to the database. It used to be impossible to
    // push down anyway, so it belongs in the where clause rather than in a
    // filter pass over the page in JavaScript.
    ...(q
      ? {
          OR: [
            { customer_name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { customer_id: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

export async function getOrderById(id: string | number): Promise<{ order: Order & { location_name: string | null }; items: OrderItem[] }> {
  // One query, not two. The line items came back in a second round-trip that
  // had nothing to wait for.
  const row = await db().orders.findUnique({
    where: { id: orderId(id) },
    include: {
      location: { select: { name: true } },
      order_items: { orderBy: { id: "asc" } },
    },
  });
  if (!row) throw new NotFoundException("Order not found");

  const { location, order_items, ...order } = row;
  return {
    order: serialize<Order & { location_name: string | null }>({ ...order, location_name: location?.name ?? null }),
    items: serialize<OrderItem[]>(order_items),
  };
}

/**
 * Storefront order detail. Ownership is part of the where clause, so another
 * customer's order is a plain not-found and its row is never read.
 */
export async function getOwnedOrderById(
  id: string | number,
  customerId: string,
): Promise<{ order: Order & { location_name: string | null }; items: OrderItem[] }> {
  const row = await db().orders.findFirst({
    where: { id: orderId(id), customer_id: customerId },
    include: {
      location: { select: { name: true } },
      order_items: { orderBy: { id: "asc" } },
    },
  });
  if (!row) throw new NotFoundException("Order not found");

  const { location, order_items, ...order } = row;
  return {
    order: serialize<Order & { location_name: string | null }>({ ...order, location_name: location?.name ?? null }),
    items: serialize<OrderItem[]>(order_items),
  };
}

export async function getOrdersByCustomerId(customerId: string, page: PageRequest): Promise<{ orders: Order[]; total: number }> {
  const where = { customer_id: customerId };
  const [rows, total] = await db().$transaction([
    db().orders.findMany({
      where,
      skip: page.skip,
      take: page.limit,
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
    }),
    db().orders.count({ where }),
  ]);
  return { orders: serialize<Order[]>(rows), total };
}

/**
 * Order history lookup for the storefront.
 *
 * The caller-supplied email used to select every order with that address and
 * the ownership check was applied afterwards in JavaScript, so a caller could
 * make the server pull an arbitrary customer's full order history off the
 * database. Both predicates are now index-backed and both run in Postgres.
 * The result set is identical; the discarded rows are never transferred.
 */
export async function getOrdersByEmail(email: string, customerId: string, page: PageRequest): Promise<{ orders: Order[]; total: number }> {
  const where = { email, customer_id: customerId };
  const [rows, total] = await db().$transaction([
    db().orders.findMany({
      where,
      skip: page.skip,
      take: page.limit,
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
    }),
    db().orders.count({ where }),
  ]);
  return { orders: serialize<Order[]>(rows), total };
}

const DELIVERY_TRANSITIONS: Record<string, string[]> = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["out-for-delivery", "cancelled"],
  "out-for-delivery": ["delivered"],
  delivered: [],
  cancelled: [],
};

const COLLECTION_TRANSITIONS: Record<string, string[]> = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function nextStatuses(fulfilment: string, status: string): string[] {
  const table = fulfilment === "collection" ? COLLECTION_TRANSITIONS : DELIVERY_TRANSITIONS;
  return table[status] ?? [];
}

export function assertStatusTransition(fulfilment: string, from: string, to: string): void {
  if (!nextStatuses(fulfilment, from).includes(to)) {
    throw new BadRequestException(`Cannot change a ${fulfilment} order from ${from} to ${to}`);
  }
}

export async function assertOrderAccess(admin: Pick<AuthPayload, "sub" | "role">, locationId: string | null): Promise<void> {
  if (!locationId) {
    if (isBranchScoped(admin.role)) {
      throw new ForbiddenException("You do not have access to this branch");
    }
    return;
  }
  await assertLocationAccess(admin, locationId);
}

export function customerCanView(orderCustomerId: string | null | undefined, requesterId: string): boolean {
  return Boolean(orderCustomerId) && orderCustomerId === requesterId;
}

export async function updateOrderStatus(id: string | number, status: Order["status"], admin: Pick<AuthPayload, "sub" | "role">): Promise<Order> {
  const current = await db().orders.findUnique({ where: { id: orderId(id) } });
  if (!current) throw new NotFoundException("Order not found");
  await assertOrderAccess(admin, current.location_id);
  assertStatusTransition(current.fulfilment, current.status, status);

  const updated = await db().orders.updateMany({
    where: { id: current.id, status: current.status },
    data: { status },
  });
  if (updated.count !== 1) throw new ConflictException("Order status changed. Refresh and try again.");
  // Status feeds the dashboard's active/terminal split, so drop the cached stats.
  void invalidateDashboardCache();

  const order = await db().orders.findUnique({ where: { id: current.id } });
  if (!order) throw new NotFoundException("Order not found");

  const saved = serialize<Order>(order);

  if (status === "cancelled") {
    const { subject, html } = orderCancelledEmail(saved);
    sendEmail({ to: saved.email, subject, htmlContent: html }).catch(() => {});
  } else if (status === "delivered") {
    const { subject, html } = orderDeliveredEmail(saved);
    sendEmail({ to: saved.email, subject, htmlContent: html }).catch(() => {});
  } else {
    const { subject, html } = orderStatusUpdateEmail(saved);
    sendEmail({ to: saved.email, subject, htmlContent: html }).catch(() => {});
  }

  return saved;
}

const TERMINAL_STATUSES = ["delivered", "cancelled"];

/**
 * Removes an order outright. This is for erasing a mistaken or test order, not
 * for cancelling a real one: cancelling keeps the row and the customer gets an
 * email, whereas this leaves no trace. `order_items` cascades in the schema.
 *
 * Branch scope is still enforced so a manager cannot reach another branch even
 * by guessing an id.
 */
export async function deleteOrder(id: string | number, admin: Pick<AuthPayload, "sub" | "role">): Promise<void> {
  const current = await db().orders.findUnique({ where: { id: orderId(id) } });
  if (!current) throw new NotFoundException("Order not found");
  await assertOrderAccess(admin, current.location_id);

  try {
    await db().orders.delete({ where: { id: current.id } });
  } catch (error) {
    // Re-throws app errors as they are and translates a Prisma miss, which is
    // what a delete racing someone else's delete looks like.
    rethrow(error, "Order not found");
  }

  // Totals, revenue and the per-status tiles all change, so drop the cached stats.
  void invalidateDashboardCache();
  logger.info({ orderId: String(current.id), by: admin.sub }, "Order deleted");
}

/**
 * Dashboard aggregates, all scoped to the caller's branches.
 *
 * The per-status breakdown replaced a client-side count over the loaded order
 * list. That list is now a single page, so counting it in the browser would
 * have reported the page size rather than the real number. One groupBy answers
 * the total, the active count and every per-status tile at once, so this is
 * fewer queries than the two separate counts it replaces.
 *
 * `status_counts` is additive: existing consumers of the four original fields
 * are unaffected.
 */
export interface DashboardStats {
  total_orders: number;
  active_orders: number;
  revenue: number;
  today_revenue: number;
  status_counts: Record<string, number>;
}

/**
 * Branch-scoped dashboard totals.
 *
 * The two revenue sums scan the caller's whole order history, so the cost grows
 * with the table. The admin dashboard passes `cache: true` and gets a short-lived
 * result keyed by its branch scope; every order write drops it via
 * `invalidateDashboardCache`. Callers that need a guaranteed-fresh number (tests,
 * the parity check) omit `cache` and always read the database, so they are never
 * served a stale aggregate.
 */
export async function getDashboardStats(
  locationIds?: string[] | null,
  options?: { cache?: boolean },
): Promise<DashboardStats> {
  if (options?.cache) {
    return cachedJson(dashboardCacheKey(locationIds), TTL_DASHBOARD_SECONDS, () => loadDashboardStats(locationIds));
  }
  return loadDashboardStats(locationIds);
}

/** Different branch scopes must not share a cache entry. */
function dashboardCacheKey(locationIds?: string[] | null): string {
  if (!locationIds) return "dashboard:all";
  return `dashboard:${[...locationIds].sort().join(",")}`;
}

async function loadDashboardStats(locationIds?: string[] | null): Promise<DashboardStats> {
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  try {
    // One statement, one round-trip. The previous version ran three separate
    // aggregates (groupBy + two sums) in a transaction, which cost three
    // sequential database round-trips on every dashboard load. A single GROUP BY
    // with FILTER yields the same per-status counts, the all-time revenue and
    // today's revenue. The branch scope is still enforced in SQL: a null array
    // means every branch, and an array means `location_id = ANY(...)`.
    // Sums are cast to text so the exact decimal value is parsed, not a float.
    const rows = await db().$queryRaw<
      { status: string; orders: number; revenue: string; today_revenue: string }[]
    >`
      SELECT status,
             COUNT(*)::int AS orders,
             COALESCE(SUM(total), 0)::text AS revenue,
             COALESCE(SUM(total) FILTER (WHERE created_at >= ${startOfToday}), 0)::text AS today_revenue
      FROM orders
      WHERE (${locationIds ?? null}::text[] IS NULL OR location_id = ANY(${locationIds ?? null}::text[]))
      GROUP BY status
      ORDER BY status ASC
    `;

    const statusCounts: Record<string, number> = {};
    let totalOrders = 0;
    let activeOrders = 0;
    let revenue = new Prisma.Decimal(0);
    let todayRevenue = new Prisma.Decimal(0);
    for (const row of rows) {
      statusCounts[row.status] = row.orders;
      totalOrders += row.orders;
      if (!TERMINAL_STATUSES.includes(row.status)) activeOrders += row.orders;
      revenue = revenue.add(row.revenue);
      todayRevenue = todayRevenue.add(row.today_revenue);
    }

    return {
      total_orders: totalOrders,
      active_orders: activeOrders,
      revenue: revenue.toNumber(),
      today_revenue: todayRevenue.toNumber(),
      status_counts: statusCounts,
    };
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch dashboard stats");
    throw new InternalServerException("Failed to fetch dashboard stats");
  }
}
