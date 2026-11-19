import type { Order, OrderItem } from "../types/models.js";

const BRAND = {
  NAME: "Crispies",
  TAGLINE: "Good mood food. Burgers + Chicken. Made halal.",
  COPYRIGHT: `© ${new Date().getFullYear()} Crispies. All rights reserved.`,
  SITE: "https://crispiesuk.com",
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
    <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.6)">Your order #${order.id} has been cancelled. If you have any questions, please <a href="${BRAND.SITE}/franchise-inquiries" style="color:#DC2626;text-decoration:underline">contact us</a>.</p>
    ${orderMeta(order)}
    <p style="margin:24px 0 0;font-size:13px;color:rgba(255,255,255,0.4);text-align:center">If you were charged, a refund will be processed within 3–5 business days.</p>
  `;
  return { subject: `Order #${order.id} cancelled — Crispies`, html: wrap(content) };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type BrochureLead = { name: string; email: string; phone?: string; locale?: "en" | "ar" };

/** Sent to the visitor with the brochure link, after they give us an email. */
export function brochureEmail(lead: BrochureLead, brochureUrl: string): { subject: string; html: string } {
  const greeting = lead.name ? `Hi ${escapeHtml(lead.name)},` : "Hi there,";
  const content = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#fff;font-weight:700">Your Crispies franchise brochure</h2>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.6)">${greeting} here it is — everything you need to grow with us.</p>
    ${button(brochureUrl, "Download the brochure")}
    <p style="margin:24px 0 0;font-size:13px;color:rgba(255,255,255,0.5)">
      Prefer a conversation? Send us a note and our franchise team will get back to you.
    </p>
    ${button(`${BRAND.SITE}/franchise-inquiries`, "Start your application")}
  `;
  return { subject: "Your Crispies franchise brochure", html: wrap(content) };
}

/** Internal alert so the franchise team knows who asked. */
export function brochureLeadAdminEmail(lead: BrochureLead): { subject: string; html: string } {
  const content = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#fff;font-weight:700">New brochure request</h2>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.6)">Someone requested the franchise brochure from the website.</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:4px 0;color:rgba(255,255,255,0.5);font-size:13px">Name</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right">${escapeHtml(lead.name) || "—"}</td></tr>
      <tr><td style="padding:4px 0;color:rgba(255,255,255,0.5);font-size:13px">Email</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right"><a href="mailto:${escapeHtml(lead.email)}" style="color:#DC2626;text-decoration:none">${escapeHtml(lead.email)}</a></td></tr>
      <tr><td style="padding:4px 0;color:rgba(255,255,255,0.5);font-size:13px">Phone</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right">${escapeHtml(lead.phone ?? "") || "—"}</td></tr>
      <tr><td style="padding:4px 0;color:rgba(255,255,255,0.5);font-size:13px">Language</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;text-transform:uppercase">${escapeHtml(lead.locale ?? "en")}</td></tr>
    </table>
    ${divider()}
    ${button(`${BRAND.SITE}/franchise-inquiries`, "Open the franchise page")}
  `;
  return { subject: `Brochure request from ${lead.email}`, html: wrap(content) };
}

export type FranchiseApplication = {
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  city: string;
  propertyStatus: string;
  budget: string;
  occupation: string;
  experience: string;
  ownBusinesses: string;
  vision: string;
  locale?: "en" | "ar";
};

/** Sent to the franchise inbox with every answer from the application form. */
export function franchiseApplicationEmail(app: FranchiseApplication): { subject: string; html: string } {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:rgba(255,255,255,0.5);font-size:13px;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:6px 0;color:#fff;font-size:13px;text-align:right">${escapeHtml(value) || "-"}</td></tr>`;
  const email = escapeHtml(app.email);
  const content = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#fff;font-weight:700">New franchise application</h2>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.6)">Sent from the franchise page. Reply to this email to answer the applicant.</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${row("Full name", app.fullName)}
      <tr><td style="padding:6px 12px 6px 0;color:rgba(255,255,255,0.5);font-size:13px">Email</td><td style="padding:6px 0;font-size:13px;text-align:right"><a href="mailto:${email}" style="color:#DC2626;text-decoration:none">${email}</a></td></tr>
      ${row("Phone", app.phone)}
      ${row("Date of birth", app.dob)}
      ${row("City", app.city)}
      ${row("Property status", app.propertyStatus)}
      ${row("Investment budget", app.budget)}
      ${row("Occupation", app.occupation)}
      ${row("Food industry experience", app.experience)}
      ${row("Owns businesses", app.ownBusinesses)}
      ${row("Language", (app.locale ?? "en").toUpperCase())}
    </table>
    ${divider()}
    <p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,0.5)">Vision</p>
    <p style="margin:0;font-size:14px;color:#fff;white-space:pre-wrap">${escapeHtml(app.vision)}</p>
  `;
  return { subject: `Franchise application from ${escapeHtml(app.fullName)}`, html: wrap(content) };
}

const OTP_COPY = {
  en: {
    subject: (code: string) => `${code} is your Crispies verification code`,
    preheader: (code: string, m: number) => `Your code is ${code}. It expires in ${m} minutes.`,
    greeting: (name: string) => (name ? `Hi ${name},` : "Hi there,"),
    title: "Confirm your email",
    body: "Enter this code on the Crispies franchise page.",
    copy: "Copy code",
    copyHint: "Tap to select, then copy",
    expires: (m: number) => `Expires in ${m} minutes.`,
    ignore: "Didn't ask for this? You can ignore this email.",
  },
  ar: {
    subject: (code: string) => `${code} هو رمز التحقق من كريسبيز`,
    preheader: (code: string, m: number) => `رمزك هو ${code}. ينتهي خلال ${m} دقائق.`,
    greeting: (name: string) => (name ? `مرحباً ${name}،` : "مرحباً،"),
    title: "أكّد بريدك الإلكتروني",
    body: "أدخل هذا الرمز في صفحة امتياز كريسبيز.",
    copy: "نسخ الرمز",
    copyHint: "اضغط للتحديد ثم انسخ",
    expires: (m: number) => `ينتهي خلال ${m} دقائق.`,
    ignore: "لم تطلب هذا الرمز؟ يمكنك تجاهل هذه الرسالة.",
  },
} as const;

export type VerificationEmailOptions = {
  code: string;
  minutes: number;
  locale?: "en" | "ar";
  name?: string;
  /** `cid:` reference to the inline logo, or a public PNG URL. Empty shows a text wordmark. */
  logoUrl: string;
};

/**
 * One-time code that proves the visitor owns the email address. Kept plain on
 * purpose: logo, greeting, the code, how long it lasts, and one safety line.
 *
 * Email apps block scripts, so a real copy-to-clipboard button cannot work.
 * The "Copy code" chip instead holds the code with user-select:all, so one tap
 * selects all four digits. Gmail on phones also adds its own copy button for
 * codes it finds in the subject.
 *
 * Tables and inline styles only, so it renders the same in Gmail, Outlook and
 * Apple Mail.
 */
export function verificationCodeEmail(opts: VerificationEmailOptions): { subject: string; html: string; text: string } {
  const { code, minutes, locale = "en", name = "", logoUrl } = opts;
  const c = OTP_COPY[locale];
  const greeting = c.greeting(name.trim());
  const dir = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "right" : "left";
  const safeCode = escapeHtml(code);
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const mono = "'SF Mono',Menlo,Consolas,'Courier New',monospace";

  // Digits always read left to right, even in the Arabic layout.
  const digitCells = safeCode
    .split("")
    .map(
      (d) => `<td style="padding:0 5px">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td width="58" height="70" align="center" valign="middle" style="width:58px;height:70px;border-radius:12px;background:#1a1a1a;border:1px solid #2e2e2e;font-family:${mono};font-size:34px;font-weight:700;color:#ffffff;line-height:70px">${d}</td>
        </tr></table>
      </td>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="dark only">
  <meta name="supported-color-schemes" content="dark">
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no">
  <title>${escapeHtml(c.subject(code))}</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:${font};-webkit-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(c.preheader(code, minutes))}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#000000" style="background-color:#000000">
    <tr><td align="center" style="padding:40px 16px">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%">

        ${
          logoUrl
            ? `<tr><td align="center" style="padding:0 0 32px">
          <img src="${escapeHtml(logoUrl)}" width="120" height="103" alt="Crispies" style="display:block;width:120px;height:auto;max-width:120px;border:0;outline:none;text-decoration:none;color:#eaeaea;font-size:22px;font-weight:800">
        </td></tr>`
            : `<tr><td align="center" style="padding:0 0 28px;font-size:26px;font-weight:900;letter-spacing:1px;color:#eaeaea">CRISPIES</td></tr>`
        }

        <tr><td dir="${dir}" bgcolor="#111111" style="background:#111111;border:1px solid #1f1f1f;border-radius:16px;padding:36px 32px;text-align:${align}">
          <p style="margin:0 0 8px;font-size:15px;color:rgba(255,255,255,0.7)">${escapeHtml(greeting)}</p>
          <h1 style="margin:0 0 8px;font-size:26px;line-height:1.25;font-weight:800;color:#ffffff">${c.title}</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.6)">${c.body}</p>

          <table role="presentation" cellpadding="0" cellspacing="0" align="center" dir="ltr" style="margin:30px auto 0">
            <tr>${digitCells}</tr>
          </table>

          <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:18px auto 0">
            <tr><td style="border:1px solid #333333;border-radius:8px;padding:8px 14px;font-size:13px;color:rgba(255,255,255,0.75)" title="${c.copyHint}">
              ${c.copy}&nbsp;&nbsp;<span dir="ltr" style="-webkit-user-select:all;user-select:all;font-family:${mono};font-size:14px;font-weight:700;letter-spacing:2px;color:#ffffff">${safeCode}</span>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;text-align:center;font-size:14px;color:rgba(255,255,255,0.6)">${c.expires(minutes)}</p>

          <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #222222;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.45)">${c.ignore}</p>
        </td></tr>

        <tr><td align="center" style="padding:24px 12px 0">
          <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.4)">${BRAND.TAGLINE}</p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3)">${BRAND.COPYRIGHT}</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [greeting, "", c.title, c.body, "", code, "", c.expires(minutes), "", c.ignore, "", "Crispies"].join("\n");

  return { subject: c.subject(code), html, text };
}

/** Sent to the applicant so they know the application arrived. */
export function franchiseApplicationReceivedEmail(
  app: FranchiseApplication,
  brochureUrl: string | null = null,
): { subject: string; html: string } {
  const greeting = app.fullName ? `Hi ${escapeHtml(app.fullName)},` : "Hi there,";
  const content = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#fff;font-weight:700">We have your franchise application</h2>
    <p style="margin:0 0 16px;font-size:14px;color:rgba(255,255,255,0.6)">${greeting} thank you for your interest in opening a Crispies.</p>
    <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.6)">Our franchise team will review your details and get back to you soon. If you have questions in the meantime, just reply to this email.</p>
    ${brochureUrl ? button(brochureUrl, "Download the brochure") : ""}
  `;
  return { subject: "We have your Crispies franchise application", html: wrap(content) };
}
