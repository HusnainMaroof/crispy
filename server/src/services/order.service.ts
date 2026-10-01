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
  if (existing) {
    const { order_items, ...order } = existing;
    return serialize({ ...order, items: order_items });
  }

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
      if (raced) {
        const { order_items, ...order } = raced;
        return serialize({ ...order, items: order_items });
      }
    }
    rethrow(error, "Order not found");
  }

  const saved = await db().orders.findUnique({
    where: { id: created.id },
    include: { order_items: { orderBy: { id: "asc" } } },
  });
  if (!saved) throw new InternalServerException("Failed to create order");
  const { order_items, ...order } = saved;
  const result = serialize<Order & { items: OrderItem[] }>({ ...order, items: order_items });

  const { subject: confirmSubject, html: confirmHtml } = orderConfirmationEmail(result, result.items);
  sendEmail({ to: result.email, subject: confirmSubject, htmlContent: confirmHtml }).catch(() => {});
  const { subject: adminSubject, html: adminHtml } = newOrderAdminEmail(result, result.items);
  sendAdminEmail(adminSubject, adminHtml).catch(() => {});
  return result;
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
): Promise<(Order & { items: OrderItem[]; location_name: string | null })[]> {
  const where = orderWhere(filter);

  const rows = await db().orders.findMany({
    where,
    skip: filter.skip,
    take: filter.limit,
    include: {
      order_items: { orderBy: { id: "asc" } },
      location: { select: { name: true } },
    },
    // id DESC is the tiebreaker. created_at alone is not a stable sort key:
    // two orders placed in the same millisecond could swap places between two
    // page requests, which duplicates one row and drops another.
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
  });

  return rows.map((row) => {
    const { order_items, location, ...order } = row;
    return serialize<Order & { items: OrderItem[]; location_name: string | null }>({
      ...order,
      items: order_items,
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
export async function getDashboardStats(locationIds?: string[] | null) {
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const branch = locationIds ? { location_id: { in: locationIds } } : {};

  try {
    const [groups, revenue, todayRevenue] = await db().$transaction([
      db().orders.groupBy({
        by: ["status"],
        where: branch,
        orderBy: { status: "asc" },
        _count: true,
      }),
      db().orders.aggregate({ _sum: { total: true }, where: branch }),
      db().orders.aggregate({
        _sum: { total: true },
        where: { ...branch, created_at: { gte: startOfToday } },
      }),
    ]);

    // Prisma types groupBy's _count as a union of every possible count shape,
    // so the group rows are narrowed here once rather than at each use.
    const byStatus = groups as unknown as { status: string; _count: number }[];

    const statusCounts: Record<string, number> = {};
    let totalOrders = 0;
    let activeOrders = 0;
    for (const row of byStatus) {
      const count = row._count;
      statusCounts[row.status] = count;
      totalOrders += count;
      if (!TERMINAL_STATUSES.includes(row.status)) activeOrders += count;
    }

    return {
      total_orders: totalOrders,
      active_orders: activeOrders,
      revenue: revenue._sum.total ? Number(revenue._sum.total) : 0,
      today_revenue: todayRevenue._sum.total ? Number(todayRevenue._sum.total) : 0,
      status_counts: statusCounts,
    };
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch dashboard stats");
    throw new InternalServerException("Failed to fetch dashboard stats");
  }
}
