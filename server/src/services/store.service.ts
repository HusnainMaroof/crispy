import { getAdminClient } from "../config/supabase.js";
import { NotFoundException } from "../utils/app-error.js";
import type { Location } from "../types/models.js";

export { getLocations, getSettings } from "./admin.service.js";

export async function getLocationById(id: string): Promise<Location> {
  const { data, error } = await getAdminClient()
    .from("locations")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new NotFoundException("Location not found");
  return data as Location;
}

export type HomepageContent = Record<string, unknown>;

export async function getHomepageContent(): Promise<HomepageContent> {
  const { data, error } = await getAdminClient()
    .from("homepage_content")
    .select("key, content");

  if (error) return {};
  const result: HomepageContent = {};
  for (const row of data ?? []) {
    result[row.key] = row.content;
  }
  return result;
}
