import { Prisma } from "../generated/prisma/client.js";
import { getPrisma } from "../config/prisma.js";
import { sendEmail, sendAdminEmail } from "./email.service.js";
import { BadRequestException, ConflictException, ForbiddenException, InternalServerException, NotFoundException } from "../utils/app-error.js";
import { assertLocationAccess, isBranchScoped } from "./branch-access.service.js";
import type { AuthPayload } from "../types/responses.js";
import { rethrow, serialize } from "../utils/db.js";
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

function orderId(id: string | number): bigint {
  return BigInt(id);
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

export async function getOrders(filter?: { status?: string; location_id?: string; location_ids?: string[] }): Promise<(Order & { items: OrderItem[]; location_name: string | null })[]> {
  const rows = await db().orders.findMany({
    where: {
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.location_id ? { location_id: filter.location_id } : {}),
      ...(filter?.location_ids ? { location_id: { in: filter.location_ids } } : {}),
    },
    include: {
      order_items: { orderBy: { id: "asc" } },
      location: { select: { name: true } },
    },
    orderBy: { created_at: "desc" },
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

export async function getOrderById(id: string | number): Promise<{ order: Order & { location_name: string | null }; items: OrderItem[] }> {
  const row = await db().orders.findUnique({
    where: { id: orderId(id) },
    include: { location: { select: { name: true } } },
  });
  if (!row) throw new NotFoundException("Order not found");

  const items = await db().order_items.findMany({ where: { order_id: row.id }, orderBy: { id: "asc" } });
  const { location, ...order } = row;
  return {
    order: serialize<Order & { location_name: string | null }>({ ...order, location_name: location?.name ?? null }),
    items: serialize<OrderItem[]>(items),
  };
}

export async function getOrdersByCustomerId(customerId: string): Promise<Order[]> {
  const rows = await db().orders.findMany({
    where: { customer_id: customerId },
    orderBy: { created_at: "desc" },
  });
  return serialize<Order[]>(rows);
}

export async function getOrdersByEmail(email: string): Promise<Order[]> {
  const rows = await db().orders.findMany({
    where: { email },
    orderBy: { created_at: "desc" },
  });
  return serialize<Order[]>(rows);
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

export async function getDashboardStats(locationIds?: string[] | null) {
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const branch = locationIds ? { location_id: { in: locationIds } } : {};

  try {
    const [totalOrders, activeOrders, revenue, todayRevenue] = await db().$transaction([
      db().orders.count({ where: branch }),
      db().orders.count({ where: { ...branch, status: { notIn: ["delivered", "cancelled"] } } }),
      db().orders.aggregate({ _sum: { total: true }, where: branch }),
      db().orders.aggregate({
        _sum: { total: true },
        where: { ...branch, created_at: { gte: startOfToday } },
      }),
    ]);

    return {
      total_orders: totalOrders,
      active_orders: activeOrders,
      revenue: revenue._sum.total ? Number(revenue._sum.total) : 0,
      today_revenue: todayRevenue._sum.total ? Number(todayRevenue._sum.total) : 0,
    };
  } catch {
    throw new InternalServerException("Failed to fetch dashboard stats");
  }
}
