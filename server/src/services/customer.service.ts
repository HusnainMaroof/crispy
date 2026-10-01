import { getPrisma } from "../config/prisma.js";
import { NotFoundException } from "../utils/app-error.js";
import { serialize } from "../utils/db.js";
import type { PageRequest } from "../utils/pagination.js";
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

/**
 * The customer list only needs two things per customer: how many orders they
 * have placed, and their most recent one. It was fetching every order row (and
 * its location join) for every customer in the result set to derive those,
 * which grows as orders x customers. _count does the tally in the database and
 * `take: 1` after the same ordering grabs just the latest.
 */
export async function listCustomers(admin: Staff, options: { q?: string } & PageRequest) {
  const allowed = await getAccessibleLocationIds(admin);
  const q = options.q?.trim();
  const scope = orderScope(allowed);

  const where = {
    ...(allowed ? { orders: { some: scope } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  // Both reads in one transaction so the count and the page describe the same
  // snapshot. Without it a concurrent order can shift the rows between the two
  // queries and the page count disagrees with the rows shown.
  const [rows, total] = await getPrisma().$transaction([
    getPrisma().customers.findMany({
      where,
      skip: options.skip,
      take: options.limit,
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        created_at: true,
        _count: { select: { orders: { where: scope } } },
        orders: {
          where: scope,
          orderBy: [{ created_at: "desc" }, { id: "desc" }],
          take: 1,
          select: orderSelect,
        },
      },
    }),
    getPrisma().customers.count({ where }),
  ]);

  const customers = rows.map((row) => {
    const latest = row.orders[0];
    return serialize({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      created_at: row.created_at,
      order_count: row._count.orders,
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

  return { customers, total };
}

export async function getCustomerForStaff(admin: Staff, id: string) {
  const allowed = await getAccessibleLocationIds(admin);
  const row = await getPrisma().customers.findUnique({
    where: { id },
    include: {
      orders: {
        where: orderScope(allowed),
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
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
