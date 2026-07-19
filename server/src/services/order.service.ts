import { getAdminClient } from "../config/supabase.js";
import { sendEmail } from "./email.service.js";
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
  customer_id?: string | null;
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

  const o = order as Order;

  sendEmail({
    to: o.email,
    subject: `Order #${o.id} confirmed — Crispies`,
    htmlContent: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="color:#DC2626;font-size:28px;margin:0 0 8px">Crispies</h1>
        <p style="color:#333;font-size:16px;margin:0 0 24px">Thanks, ${o.customer_name}! Your order is being prepared.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr><td style="color:#666;padding:4px 0">Order</td><td style="text-align:right;font-weight:600">#${o.id}</td></tr>
          <tr><td style="color:#666;padding:4px 0">Total</td><td style="text-align:right;font-weight:600">£${o.total.toFixed(2)}</td></tr>
          <tr><td style="color:#666;padding:4px 0">Fulfilment</td><td style="text-align:right;text-transform:capitalize">${o.fulfilment}</td></tr>
          <tr><td style="color:#666;padding:4px 0">Status</td><td style="text-align:right;text-transform:capitalize">${o.status.replace(/-/g, " ")}</td></tr>
        </table>
        <a href="https://crispies.co.uk/track" style="display:inline-block;background:#DC2626;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Track your order</a>
        <p style="color:#999;font-size:12px;margin-top:32px">Crispies — Good Mood Food</p>
      </div>
    `,
  }).catch(() => {});

  return o;
}

export async function getOrders(filter?: { status?: string; location_id?: string }): Promise<Order[]> {
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

export async function getOrdersByCustomerId(customerId: string): Promise<Order[]> {
  const { data, error } = await getAdminClient()
    .from("orders")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw new InternalServerException("Failed to fetch orders");
  return (data ?? []) as Order[];
}

export async function getOrdersByEmail(email: string): Promise<Order[]> {
  const { data, error } = await getAdminClient()
    .from("orders")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false });

  if (error) throw new InternalServerException("Failed to fetch orders");
  return (data ?? []) as Order[];
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
  const { data, error } = await getAdminClient().rpc("get_dashboard_stats");

  if (error || !data) throw new InternalServerException("Failed to fetch dashboard stats");

  return data as {
    total_orders: number;
    active_orders: number;
    revenue: number;
    today_revenue: number;
  };
}
