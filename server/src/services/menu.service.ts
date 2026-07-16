import { supabase } from "../config/supabase.js";
import { AppError } from "../middleware/error-handler.js";
import type { MenuCategory, MenuItem, Deal } from "../types/models.js";

type DbResult<T> = T[];

export async function getCategories(): Promise<MenuCategory[]> {
  const { data, error } = await supabase
    .from("menu_categories")
    .select("*")
    .order("sort_order");

  if (error) throw new AppError(500, "Failed to fetch categories");
  return (data ?? []) as MenuCategory[];
}

export async function getCategoryById(id: string): Promise<MenuCategory> {
  const { data, error } = await supabase
    .from("menu_categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new AppError(404, "Category not found");
  return data as MenuCategory;
}

export async function createCategory(input: Record<string, unknown>): Promise<MenuCategory> {
  const { data, error } = await supabase
    .from("menu_categories")
    .insert(input)
    .select()
    .single();

  if (error) throw new AppError(400, error.message);
  return data as MenuCategory;
}

export async function updateCategory(id: string, input: Record<string, unknown>): Promise<MenuCategory> {
  const { data, error } = await supabase
    .from("menu_categories")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new AppError(400, error.message);
  if (!data) throw new AppError(404, "Category not found");
  return data as MenuCategory;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from("menu_categories")
    .delete()
    .eq("id", id);

  if (error) throw new AppError(400, error.message);
}

export async function getMenuItems(categoryId?: string): Promise<MenuItem[]> {
  let query = supabase.from("menu_items").select("*").eq("active", true).order("sort_order");

  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, error } = await query;
  if (error) throw new AppError(500, "Failed to fetch menu items");
  return (data ?? []) as MenuItem[];
}

export async function getMenuItemById(id: string): Promise<MenuItem> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new AppError(404, "Menu item not found");
  return data as MenuItem;
}

export async function createMenuItem(input: Record<string, unknown>): Promise<MenuItem> {
  const { data, error } = await supabase
    .from("menu_items")
    .insert(input)
    .select()
    .single();

  if (error) throw new AppError(400, error.message);
  return data as MenuItem;
}

export async function updateMenuItem(id: string, input: Record<string, unknown>): Promise<MenuItem> {
  const { data, error } = await supabase
    .from("menu_items")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new AppError(400, error.message);
  if (!data) throw new AppError(404, "Menu item not found");
  return data as MenuItem;
}

export async function deleteMenuItem(id: string): Promise<void> {
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) throw new AppError(400, error.message);
}

export async function getDeals(activeOnly = true): Promise<Deal[]> {
  let query = supabase.from("deals").select("*").order("created_at", { ascending: false });
  if (activeOnly) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) throw new AppError(500, "Failed to fetch deals");
  return (data ?? []) as Deal[];
}

export async function createDeal(input: Record<string, unknown>): Promise<Deal> {
  const { data, error } = await supabase.from("deals").insert(input).select().single();
  if (error) throw new AppError(400, error.message);
  return data as Deal;
}

export async function updateDeal(id: string, input: Record<string, unknown>): Promise<Deal> {
  const { data, error } = await supabase
    .from("deals")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new AppError(400, error.message);
  if (!data) throw new AppError(404, "Deal not found");
  return data as Deal;
}

export async function deleteDeal(id: string): Promise<void> {
  const { error } = await supabase.from("deals").delete().eq("id", id);
  if (error) throw new AppError(400, error.message);
}
