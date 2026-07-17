import { getAdminClient } from "../config/supabase.js";
import {
  InternalServerException,
  NotFoundException,
  BadRequestException,
} from "../utils/app-error.js";
import type { MenuCategory, MenuItem, Deal } from "../types/models.js";

export interface CategoryWithItems extends MenuCategory {
  items: MenuItem[];
}

export async function getFullMenu(): Promise<CategoryWithItems[]> {
  const [categories, items] = await Promise.all([getCategories(), getMenuItems()]);
  return categories.map((cat) => ({
    ...cat,
    items: items.filter((item) => item.category_id === cat.id),
  }));
}

export async function getCategories(): Promise<MenuCategory[]> {
  const { data, error } = await getAdminClient()
    .from("menu_categories")
    .select("*")
    .order("sort_order");

  if (error) throw new InternalServerException("Failed to fetch categories");
  return (data ?? []) as MenuCategory[];
}

export async function getCategoryById(id: string): Promise<MenuCategory> {
  const { data, error } = await getAdminClient()
    .from("menu_categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new NotFoundException("Category not found");
  return data as MenuCategory;
}

export async function createCategory(input: Record<string, unknown>): Promise<MenuCategory> {
  const { data, error } = await getAdminClient()
    .from("menu_categories")
    .insert({ id: crypto.randomUUID(), ...input })
    .select()
    .single();

  if (error) throw new BadRequestException(error.message);
  return data as MenuCategory;
}

export async function updateCategory(id: string, input: Record<string, unknown>): Promise<MenuCategory> {
  const { data, error } = await getAdminClient()
    .from("menu_categories")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new BadRequestException(error.message);
  if (!data) throw new NotFoundException("Category not found");
  return data as MenuCategory;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await getAdminClient()
    .from("menu_categories")
    .delete()
    .eq("id", id);

  if (error) throw new BadRequestException(error.message);
}

export async function getMenuItems(categoryId?: string, activeOnly = true): Promise<MenuItem[]> {
  let query = getAdminClient().from("menu_items").select("*").order("sort_order");

  if (activeOnly) query = query.eq("active", true);
  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, error } = await query;
  if (error) throw new InternalServerException("Failed to fetch menu items");
  return (data ?? []) as MenuItem[];
}

export async function getMenuItemById(id: string): Promise<MenuItem> {
  const { data, error } = await getAdminClient()
    .from("menu_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new NotFoundException("Menu item not found");
  return data as MenuItem;
}

export async function createMenuItem(input: Record<string, unknown>): Promise<MenuItem> {
  const { data, error } = await getAdminClient()
    .from("menu_items")
    .insert({ id: crypto.randomUUID(), ...input })
    .select()
    .single();

  if (error) throw new BadRequestException(error.message);
  return data as MenuItem;
}

export async function updateMenuItem(id: string, input: Record<string, unknown>): Promise<MenuItem> {
  const { data, error } = await getAdminClient()
    .from("menu_items")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new BadRequestException(error.message);
  if (!data) throw new NotFoundException("Menu item not found");
  return data as MenuItem;
}

export async function deleteMenuItem(id: string): Promise<void> {
  const { error } = await getAdminClient().from("menu_items").delete().eq("id", id);
  if (error) throw new BadRequestException(error.message);
}

export async function getDealById(id: string): Promise<Deal> {
  const { data, error } = await getAdminClient()
    .from("deals")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new NotFoundException("Deal not found");
  return data as Deal;
}

export async function getDeals(activeOnly = true): Promise<Deal[]> {
  let query = getAdminClient().from("deals").select("*").order("created_at", { ascending: false });
  if (activeOnly) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) throw new InternalServerException("Failed to fetch deals");
  return (data ?? []) as Deal[];
}

export async function createDeal(input: Record<string, unknown>): Promise<Deal> {
  const { data, error } = await getAdminClient().from("deals").insert({ id: crypto.randomUUID(), ...input } as Record<string, unknown>).select().single();
  if (error) throw new BadRequestException(error.message);
  return data as Deal;
}

export async function updateDeal(id: string, input: Record<string, unknown>): Promise<Deal> {
  const { data, error } = await getAdminClient()
    .from("deals")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new BadRequestException(error.message);
  if (!data) throw new NotFoundException("Deal not found");
  return data as Deal;
}

export async function deleteDeal(id: string): Promise<void> {
  const { error } = await getAdminClient().from("deals").delete().eq("id", id);
  if (error) throw new BadRequestException(error.message);
}
