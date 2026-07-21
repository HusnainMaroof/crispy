import { getAdminClient } from "../config/supabase.js";
import { sendEmail, sendAdminEmail } from "./email.service.js";
import {
  BadRequestException,
  NotFoundException,
  InternalServerException,
} from "../utils/app-error.js";
import type { Order, OrderItem } from "../types/models.js";
import {
  orderConfirmationEmail,
  newOrderAdminEmail,
  orderStatusUpdateEmail,
  orderDeliveredEmail,
  orderCancelledEmail,
} from "./email-templates.js";

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

  const { subject: confirmSubject, html: confirmHtml } = orderConfirmationEmail(o, items as OrderItem[]);
  sendEmail({ to: o.email, subject: confirmSubject, htmlContent: confirmHtml }).catch(() => {});

  const { subject: adminSubject, html: adminHtml } = newOrderAdminEmail(o, items as OrderItem[]);
  sendAdminEmail(adminSubject, adminHtml).catch(() => {});

  return o;
}

export async function getOrders(filter?: { status?: string; location_id?: string }): Promise<(Order & { items: OrderItem[] })[]> {
  let query = getAdminClient()
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .order("id", { foreignTable: "order_items" });

  if (filter?.status) query = query.eq("status", filter.status);
  if (filter?.location_id) query = query.eq("location_id", filter.location_id);

  const { data, error } = await query;
  if (error) throw new InternalServerException("Failed to fetch orders");
  return ((data ?? []) as (Order & { order_items: OrderItem[] })[]).map((order) => ({
    ...order,
    items: order.order_items ?? [],
  }));
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
  const { data: existing } = await getAdminClient()
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (!existing) throw new NotFoundException("Order not found");

  const { data, error } = await getAdminClient()
    .from("orders")
    .update({ status } as Record<string, unknown>)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new BadRequestException(error.message);
  if (!data) throw new NotFoundException("Order not found");

  const order = data as Order;

  if (status === "cancelled") {
    const { subject, html } = orderCancelledEmail(order);
    sendEmail({ to: order.email, subject, htmlContent: html }).catch(() => {});
  } else if (status === "delivered") {
    const { subject, html } = orderDeliveredEmail(order);
    sendEmail({ to: order.email, subject, htmlContent: html }).catch(() => {});
  } else {
    const { subject, html } = orderStatusUpdateEmail(order);
    sendEmail({ to: order.email, subject, htmlContent: html }).catch(() => {});
  }

  return order;
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
