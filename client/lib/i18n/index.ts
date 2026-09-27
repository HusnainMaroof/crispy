export const SUPPORTED_LOCALES = ["en", "ur"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_COOKIE = "crispy_locale";

export function isSupportedLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(value: unknown): AppLocale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

const messages: Record<AppLocale, Record<string, string>> = {
  en: {
    "nav.menu": "Menu",
    "nav.locations": "Locations",
    "nav.franchise": "Franchise inquiry",
    "nav.cart": "Cart",
    "nav.close": "Close",
    "cart.title": "Cart",
    "cart.checkout": "Checkout",
    "cart.empty": "Your cart is empty",
    "cart.subtotal": "Subtotal",
    "cart.waiting": "Awaiting server price",
    "cart.clear": "Clear cart",
    "cart.remove": "Remove",
    "checkout.title": "Checkout",
    "checkout.placed": "Order placed",
    "checkout.total": "Total",
    "checkout.waiting": "Waiting for server total",
    "checkout.save": "Place order",
    "checkout.view": "View order status",
    "orders.title": "Your orders",
    "orders.one": "Your order",
    "orders.save": "Save details",
    "orders.saved": "Saved",
    "orders.all": "All your orders",
    "orders.name": "Name",
    "orders.email": "Email",
    "orders.phone": "Phone",
    "status.pending": "Pending",
    "status.preparing": "Preparing",
    "status.ready": "Ready",
    "status.out-for-delivery": "Out for delivery",
    "status.delivered": "Delivered",
    "status.cancelled": "Cancelled",
    "error.required": "Required field",
    "error.order": "Order not found",
    "error.generic": "Something went wrong",
  },
  ur: {},
};

export function translate(locale: unknown, key: string): string {
  const selected = resolveLocale(locale);
  return messages[selected][key] || messages.en[key] || key;
}

const CURRENCY = "GBP";

function intlLocale(locale: unknown): string {
  return resolveLocale(locale) === "ur" ? "ur" : "en-GB";
}

export function formatCurrency(amount: number, _locale: unknown = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: CURRENCY }).format(amount);
}

export function formatNumber(amount: number, locale: unknown = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(amount);
}

export function formatDate(value: Date | string | number, locale: unknown = DEFAULT_LOCALE): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
