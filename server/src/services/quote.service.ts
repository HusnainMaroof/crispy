import { Prisma } from "../generated/prisma/client.js";
import { getPrisma } from "../config/prisma.js";
import { ItemUnavailableException, NotFoundException } from "../utils/app-error.js";

export type QuoteRequestLine = {
  kind: "product" | "deal";
  id: string;
  quantity: number;
};

export type QuoteLine = {
  kind: "product" | "deal";
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Quote = {
  locationId: string;
  items: QuoteLine[];
  subtotal: number;
  total: number;
};

/** Arabic-speaking customers see the Arabic name when the catalogue has one. */
function localizedName(locale: string | undefined, name: string, nameAr: string): string {
  return locale === "ar" && nameAr.trim() ? nameAr.trim() : name;
}

function money(value: Prisma.Decimal): number {
  return value.toDecimalPlaces(2).toNumber();
}

const productFields = { id: true, name: true, name_ar: true, price: true, active: true } as const;
const dealFields = { id: true, name: true, name_ar: true, price: true, active: true } as const;

/**
 * Prices a whole cart in four queries instead of two per line.
 *
 * This used to await findUnique for the catalogue row and then another for the
 * branch override, once per line, inside a for loop. createOrderSchema allows
 * 40 lines, so a full cart cost 81 sequential round-trips before the order was
 * even written, on every cart render and every checkout.
 *
 * Behaviour is unchanged: lines are still resolved in request order, a missing
 * id still raises NotFoundException, and an item that is inactive or not
 * stocked at the branch still raises ItemUnavailableException. Only the number
 * of queries changed.
 */
export async function quoteCart(locationId: string, lines: QuoteRequestLine[], locale?: string): Promise<Quote> {
  const db = getPrisma();

  // Run with the rest of the pricing reads: three independent lookups, so a
  // serial chain would only add latency.
  const [location, products, deals] = await Promise.all([
    db.locations.findUnique({ where: { id: locationId }, select: { id: true, status: true } }),
    db.menu_items.findMany({
      where: { id: { in: lines.filter((l) => l.kind === "product").map((l) => l.id) } },
      select: productFields,
    }),
    db.deals.findMany({
      where: { id: { in: lines.filter((l) => l.kind === "deal").map((l) => l.id) } },
      select: dealFields,
    }),
  ]);

  if (!location || location.status !== "active") {
    throw new NotFoundException("Location not found");
  }

  // Batch the branch overrides too, one query per catalogue type.
  const [productLinks, dealLinks] = await Promise.all([
    db.branch_menu_items.findMany({
      where: {
        location_id: location.id,
        menu_item_id: { in: products.map((product) => product.id) },
      },
      select: { menu_item_id: true, price: true, available: true },
    }),
    db.branch_deals.findMany({
      where: { location_id: location.id, deal_id: { in: deals.map((deal) => deal.id) } },
      select: { deal_id: true, price: true, available: true },
    }),
  ]);

  const productById = new Map(products.map((product) => [product.id, product]));
  const dealById = new Map(deals.map((deal) => [deal.id, deal]));
  const productPriceById = new Map(productLinks.map((link) => [link.menu_item_id, link]));
  const dealPriceById = new Map(dealLinks.map((link) => [link.deal_id, link]));

  const items: QuoteLine[] = [];
  let subtotal = new Prisma.Decimal(0);

  for (const line of lines) {
    const unit = line.kind === "product"
      ? resolveProduct(productById, productPriceById, line, locale)
      : resolveDeal(dealById, dealPriceById, line, locale);
    const lineTotal = unit.amount.mul(line.quantity);
    subtotal = subtotal.add(lineTotal);
    items.push({
      kind: line.kind,
      id: line.id,
      name: unit.name,
      quantity: line.quantity,
      unitPrice: money(unit.amount),
      lineTotal: money(lineTotal),
    });
  }

  const total = money(subtotal);
  return { locationId: location.id, items, subtotal: total, total };
}

type Product = { id: string; name: string; name_ar: string; price: Prisma.Decimal; active: boolean };
type Deal = { id: string; name: string; name_ar: string; price: Prisma.Decimal; active: boolean };
type Link = { price: Prisma.Decimal | null; available: boolean };

function resolveProduct(
  byId: Map<string, Product>,
  pricesById: Map<string, Link>,
  line: QuoteRequestLine,
  locale: string | undefined,
): { name: string; amount: Prisma.Decimal } {
  const product = byId.get(line.id);
  if (!product) throw new NotFoundException("Menu item not found");

  const branch = pricesById.get(product.id);
  if (!product.active || !branch || !branch.available) {
    throw new ItemUnavailableException(`${product.name} is not available at this branch`, { kind: "product", id: product.id });
  }
  return { name: localizedName(locale, product.name, product.name_ar), amount: new Prisma.Decimal(branch.price ?? product.price) };
}

function resolveDeal(
  byId: Map<string, Deal>,
  pricesById: Map<string, Link>,
  line: QuoteRequestLine,
  locale: string | undefined,
): { name: string; amount: Prisma.Decimal } {
  const deal = byId.get(line.id);
  if (!deal) throw new NotFoundException("Deal not found");

  const branch = pricesById.get(deal.id);
  if (!deal.active || !branch || !branch.available) {
    throw new ItemUnavailableException(`${deal.name} is not available at this branch`, { kind: "deal", id: deal.id });
  }
  return { name: localizedName(locale, deal.name, deal.name_ar), amount: new Prisma.Decimal(branch.price ?? deal.price) };
}
