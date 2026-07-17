import { getAdminClient } from "../config/supabase.js";
import {
  BadRequestException,
  NotFoundException,
  InternalServerException,
} from "../utils/app-error.js";
import type { Order, OrderItem } from "../types/models.js";

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
  location_id?: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  items: {
    menu_item_id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { items, ...orderData } = input;

  const { data: order, error: orderError } = await getAdminClient()
    .from("orders")
    .insert({ ...orderData, status: "pending" } as Record<string, unknown>)
    .select()
    .single();

  if (orderError) throw new BadRequestException(orderError.message);

  const orderItems = items.map((item) => ({
    order_id: (order as Order).id,
    ...item,
  }));

  const { error: itemsError } = await getAdminClient()
    .from("order_items")
    .insert(orderItems as Record<string, unknown>[]);

  if (itemsError) {
    await getAdminClient().from("orders").delete().eq("id", (order as Order).id);
    throw new BadRequestException(itemsError.message);
  }

  return order as Order;
}

export async function getOrders(filter?: { status?: string; location_id?: string | number }): Promise<Order[]> {
  let query = getAdminClient().from("orders").select("*").order("created_at", { ascending: false });

  if (filter?.status) query = query.eq("status", filter.status);
  if (filter?.location_id) query = query.eq("location_id", filter.location_id);

  const { data, error } = await query;
  if (error) throw new InternalServerException("Failed to fetch orders");
  return (data ?? []) as Order[];
}

export async function getOrderById(id: string | number): Promise<{ order: Order; items: OrderItem[] }> {
  const { data: order, error: orderError } = await getAdminClient()
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (orderError || !order) throw new NotFoundException("Order not found");

  const { data: items, error: itemsError } = await getAdminClient()
    .from("order_items")
    .select("*")
    .eq("order_id", id);

  if (itemsError) throw new InternalServerException("Failed to fetch order items");

  return { order: order as Order, items: (items ?? []) as OrderItem[] };
}

export async function updateOrderStatus(id: string | number, status: Order["status"]): Promise<Order> {
  const { data, error } = await getAdminClient()
    .from("orders")
    .update({ status } as Record<string, unknown>)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new BadRequestException(error.message);
  if (!data) throw new NotFoundException("Order not found");
  return data as Order;
}

export async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [orders, activeOrders, todayOrders] = await Promise.all([
    getAdminClient().from("orders").select("total"),
    getAdminClient()
      .from("orders")
      .select("id", { count: "exact", head: true })
      .not("status", "in", '("delivered","cancelled")'),
    getAdminClient()
      .from("orders")
      .select("total")
      .gte("created_at", today.toISOString()),
  ]);

  const allOrders = (orders.data ?? []) as { total: number }[];
  const revenue = allOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const todayOrdersData = (todayOrders.data ?? []) as { total: number }[];
  const todayRevenue = todayOrdersData.reduce((sum, o) => sum + (o.total ?? 0), 0);

  return {
    total_orders: allOrders.length,
    active_orders: activeOrders.count ?? 0,
    revenue,
    today_revenue: todayRevenue,
  };
}
