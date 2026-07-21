import type { Order, OrderItem } from "../types/models.js";

const BRAND = {
  NAME: "Crispies",
  TAGLINE: "Good mood food. Burgers + Chicken. Made halal.",
  COPYRIGHT: `© ${new Date().getFullYear()} Crispies. All rights reserved.`,
  SITE: "https://crispies.co.uk",
};

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000">
    <tr><td align="center" style="padding:40px 16px">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
        <tr><td style="padding:0 0 32px 0;text-align:center">
          <h1 style="margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;color:#DC2626;font-family:inherit">CRISPIES</h1>
          <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.5);letter-spacing:1px;text-transform:uppercase">Good mood food</p>
        </td></tr>
        <tr><td style="background:#111111;border-radius:12px;padding:40px 32px">
          ${content}
        </td></tr>
        <tr><td style="padding:32px 0 0;text-align:center">
          <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.4)">${BRAND.TAGLINE}</p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3)">${BRAND.COPYRIGHT}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function orderItemsTable(items: OrderItem[]): string {
  const rows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.08);color:#fff;font-size:14px">${i.quantity}x ${i.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);font-size:14px;text-align:right">£${i.price.toFixed(2)}</td>
        </tr>`
    )
    .join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0">
    <thead><tr><th style="padding:0 0 8px;border-bottom:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.5);font-size:11px;font-weight:600;text-transform:uppercase;text-align:left;letter-spacing:0.5px">Item</th>
    <th style="padding:0 0 8px;border-bottom:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.5);font-size:11px;font-weight:600;text-transform:uppercase;text-align:right;letter-spacing:0.5px">Price</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function statusBadge(status: string): string {
  const colors: Record<string, string> = {
    pending: "#DC2626",
    preparing: "#DC2626",
    ready: "#16A34A",
    "out-for-delivery": "#2563EB",
    delivered: "#16A34A",
    cancelled: "#6B7280",
  };
  const bg = colors[status] || "#DC2626";
  return `<span style="display:inline-block;padding:4px 12px;border-radius:20px;background:${bg};color:#fff;font-size:12px;font-weight:600;text-transform:capitalize">${status.replace(/-/g, " ")}</span>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0">
    <tr><td style="border-radius:8px;background:#DC2626;text-align:center">
      <a href="${href}" style="display:inline-block;padding:14px 32px;border-radius:8px;color:#fff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.3px">${label}</a>
    </td></tr>
  </table>`;
}

function divider(): string {
  return `<div style="height:1px;background:rgba(255,255,255,0.1);margin:24px 0"></div>`;
}

function orderMeta(order: Order): string {
  const addr = [order.address, order.city, order.postcode].filter(Boolean).join(", ");
  return `<table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:4px 0;color:rgba(255,255,255,0.5);font-size:13px">Order</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;font-weight:600">#${order.id}</td></tr>
    <tr><td style="padding:4px 0;color:rgba(255,255,255,0.5);font-size:13px">Fulfilment</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;text-transform:capitalize">${order.fulfilment}</td></tr>
    ${order.fulfilment === "delivery" && addr ? `<tr><td style="padding:4px 0;color:rgba(255,255,255,0.5);font-size:13px">Delivery to</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right">${addr}</td></tr>` : ""}
    <tr><td style="padding:4px 0;color:rgba(255,255,255,0.5);font-size:13px">Payment</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;text-transform:capitalize">${order.payment_method}</td></tr>
    <tr><td style="padding:4px 0;color:rgba(255,255,255,0.5);font-size:13px">Status</td><td style="padding:4px 0;text-align:right">${statusBadge(order.status)}</td></tr>
    <tr><td style="padding:8px 0 4px;border-top:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);font-size:13px">Subtotal</td><td style="padding:8px 0 4px;border-top:1px solid rgba(255,255,255,0.1);color:#fff;font-size:13px;text-align:right">£${order.subtotal.toFixed(2)}</td></tr>
    <tr><td style="padding:4px 0;color:rgba(255,255,255,0.5);font-size:13px">Delivery</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right">${order.delivery_fee === 0 ? "Free" : `£${order.delivery_fee.toFixed(2)}`}</td></tr>
    <tr><td style="padding:4px 0;color:#DC2626;font-size:15px;font-weight:700">Total</td><td style="padding:4px 0;color:#DC2626;font-size:15px;text-align:right;font-weight:700">£${order.total.toFixed(2)}</td></tr>
  </table>`;
}

export function orderConfirmationEmail(order: Order, items: OrderItem[]): { subject: string; html: string } {
  const content = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#fff;font-weight:700">Thanks, ${order.customer_name}!</h2>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.6)">Your order is confirmed and we're getting it ready.</p>
    ${orderItemsTable(items)}
    ${orderMeta(order)}
    ${button(`${BRAND.SITE}/track?order=${order.id}`, "Track your order")}
    ${order.fulfilment === "collection" ? `<p style="margin:16px 0 0;font-size:13px;color:rgba(255,255,255,0.5)">We'll let you know when your order is ready to collect.</p>` : `<p style="margin:16px 0 0;font-size:13px;color:rgba(255,255,255,0.5)">We'll keep you updated on your delivery status.</p>`}
  `;
  return { subject: `Order #${order.id} confirmed — Crispies`, html: wrap(content) };
}

export function newOrderAdminEmail(order: Order, items: OrderItem[]): { subject: string; html: string } {
  const content = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#fff;font-weight:700">New order received</h2>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.6)">${order.customer_name} just placed an order.</p>
    ${orderItemsTable(items)}
    ${orderMeta(order)}
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0">Customer</td><td style="color:#fff;font-size:13px;text-align:right">${order.customer_name}</td></tr>
      <tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0">Email</td><td style="color:#fff;font-size:13px;text-align:right"><a href="mailto:${order.email}" style="color:#DC2626;text-decoration:none">${order.email}</a></td></tr>
      <tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0">Phone</td><td style="color:#fff;font-size:13px;text-align:right">${order.phone}</td></tr>
      ${order.notes ? `<tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0">Notes</td><td style="color:#fff;font-size:13px;text-align:right">${order.notes}</td></tr>` : ""}
    </table>
    ${button(`${BRAND.SITE}/admin/orders/${order.id}`, "View order in admin")}
  `;
  return { subject: `New order #${order.id} from ${order.customer_name}`, html: wrap(content) };
}

export function orderStatusUpdateEmail(order: Order): { subject: string; html: string } {
  const statusMessages: Record<string, string> = {
    preparing: "Your order is now being prepared.",
    ready: "Your order is ready!",
    "out-for-delivery": "Your order is on its way!",
  };
  const msg = statusMessages[order.status] || `Your order status has been updated to ${order.status.replace(/-/g, " ")}.`;

  const content = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#fff;font-weight:700">Order update, ${order.customer_name}</h2>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.6)">${msg}</p>
    <div style="text-align:center;margin:16px 0">${statusBadge(order.status)}</div>
    ${orderMeta(order)}
    ${button(`${BRAND.SITE}/track?order=${order.id}`, "Track your order")}
  `;
  return { subject: `Order #${order.id} — ${order.status.replace(/-/g, " ")}`, html: wrap(content) };
}

export function orderDeliveredEmail(order: Order): { subject: string; html: string } {
  const content = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#fff;font-weight:700">Enjoy your meal, ${order.customer_name}!</h2>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.6)">Your order has been delivered. Hope you love it as much as we loved making it.</p>
    ${orderMeta(order)}
    ${divider()}
    <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.6);text-align:center">Craving more?<br><a href="${BRAND.SITE}/menu" style="display:inline-block;margin-top:8px;padding:12px 28px;border-radius:8px;background:#DC2626;color:#fff;text-decoration:none;font-weight:700;font-size:14px">Order again</a></p>
  `;
  return { subject: `Order #${order.id} delivered — enjoy!`, html: wrap(content) };
}

export function orderCancelledEmail(order: Order): { subject: string; html: string } {
  const content = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#fff;font-weight:700">Order cancelled</h2>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.6)">Your order #${order.id} has been cancelled. If you have any questions, please <a href="${BRAND.SITE}/contact" style="color:#DC2626;text-decoration:underline">contact us</a>.</p>
    ${orderMeta(order)}
    <p style="margin:24px 0 0;font-size:13px;color:rgba(255,255,255,0.4);text-align:center">If you were charged, a refund will be processed within 3–5 business days.</p>
  `;
  return { subject: `Order #${order.id} cancelled — Crispies`, html: wrap(content) };
}
