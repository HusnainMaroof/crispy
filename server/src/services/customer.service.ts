import { getPrisma } from "../config/prisma.js";
import { NotFoundException } from "../utils/app-error.js";
import { serialize } from "../utils/db.js";
import { getAccessibleLocationIds } from "./branch-access.service.js";
import type { AuthPayload } from "../types/responses.js";

export type ProfileInput = {
  name?: string;
  email?: string;
  phone?: string;
};

type Staff = Pick<AuthPayload, "sub" | "role">;

const orderSelect = {
  id: true,
  created_at: true,
  status: true,
  total: true,
  fulfilment: true,
  location_id: true,
  customer_name: true,
  address: true,
  location: { select: { name: true } },
} as const;

function orderScope(allowed: string[] | null) {
  if (allowed === null) return {};
  return { location_id: { in: allowed } };
}

export async function getOwnProfile(customerId: string) {
  const row = await getPrisma().customers.findUnique({ where: { id: customerId } });
  if (!row) {
    return { id: customerId, name: null, email: null, phone: null, created_at: null, updated_at: null };
  }
  return serialize(row);
}

export async function updateOwnProfile(customerId: string, input: ProfileInput) {
  const row = await getPrisma().customers.upsert({
    where: { id: customerId },
    create: { id: customerId, ...input },
    update: input,
  });
  return serialize(row);
}

export async function listCustomers(admin: Staff, query?: string) {
  const allowed = await getAccessibleLocationIds(admin);
  const q = query?.trim();
  const rows = await getPrisma().customers.findMany({
    where: {
      ...(allowed ? { orders: { some: orderScope(allowed) } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      orders: {
        where: orderScope(allowed),
        orderBy: { created_at: "desc" },
        select: orderSelect,
      },
    },
    orderBy: { created_at: "desc" },
  });

  return rows.map((row) => {
    const latest = row.orders[0];
    return serialize({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      created_at: row.created_at,
      order_count: row.orders.length,
      latest_order: latest
        ? {
            id: latest.id,
            created_at: latest.created_at,
            status: latest.status,
            total: latest.total,
            fulfilment: latest.fulfilment,
            location_name: latest.location?.name ?? null,
          }
        : null,
    });
  });
}

export async function getCustomerForStaff(admin: Staff, id: string) {
  const allowed = await getAccessibleLocationIds(admin);
  const row = await getPrisma().customers.findUnique({
    where: { id },
    include: {
      orders: {
        where: orderScope(allowed),
        orderBy: { created_at: "desc" },
        select: orderSelect,
      },
    },
  });
  if (!row) throw new NotFoundException("Customer not found");
  if (allowed && row.orders.length === 0) throw new NotFoundException("Customer not found");

  return serialize({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    created_at: row.created_at,
    updated_at: row.updated_at,
    order_count: row.orders.length,
    orders: row.orders.map((order) => ({
      id: order.id,
      created_at: order.created_at,
      status: order.status,
      total: order.total,
      fulfilment: order.fulfilment,
      location_id: order.location_id,
      location_name: order.location?.name ?? null,
      customer_name: order.customer_name,
      address: order.address,
    })),
  });
}
