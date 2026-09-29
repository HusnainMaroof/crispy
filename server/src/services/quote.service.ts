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

export async function quoteCart(locationId: string, lines: QuoteRequestLine[], locale?: string): Promise<Quote> {
  const db = getPrisma();
  const location = await db.locations.findUnique({ where: { id: locationId } });
  if (!location || location.status !== "active") {
    throw new NotFoundException("Location not found");
  }

  const items: QuoteLine[] = [];
  let subtotal = new Prisma.Decimal(0);

  for (const line of lines) {
    const unit = line.kind === "product"
      ? await productPrice(location.id, line, locale)
      : await dealPrice(location.id, line, locale);
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

async function productPrice(locationId: string, line: QuoteRequestLine, locale?: string): Promise<{ name: string; amount: Prisma.Decimal }> {
  const db = getPrisma();
  const product = await db.menu_items.findUnique({ where: { id: line.id } });
  if (!product) throw new NotFoundException("Menu item not found");

  const branch = await db.branch_menu_items.findUnique({
    where: { location_id_menu_item_id: { location_id: locationId, menu_item_id: product.id } },
  });
  if (!product.active || !branch || !branch.available) {
    throw new ItemUnavailableException(`${product.name} is not available at this branch`, { kind: "product", id: product.id });
  }
  return { name: localizedName(locale, product.name, product.name_ar), amount: new Prisma.Decimal(branch.price ?? product.price) };
}

async function dealPrice(locationId: string, line: QuoteRequestLine, locale?: string): Promise<{ name: string; amount: Prisma.Decimal }> {
  const db = getPrisma();
  const deal = await db.deals.findUnique({ where: { id: line.id } });
  if (!deal) throw new NotFoundException("Deal not found");

  const branch = await db.branch_deals.findUnique({
    where: { location_id_deal_id: { location_id: locationId, deal_id: deal.id } },
  });
  if (!deal.active || !branch || !branch.available) {
    throw new ItemUnavailableException(`${deal.name} is not available at this branch`, { kind: "deal", id: deal.id });
  }
  return { name: localizedName(locale, deal.name, deal.name_ar), amount: new Prisma.Decimal(branch.price ?? deal.price) };
}
