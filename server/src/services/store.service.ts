import { getAdminClient } from "../config/supabase.js";
import { InternalServerException, NotFoundException } from "../utils/app-error.js";
import type { Location, BusinessSettings } from "../types/models.js";

export async function getLocations(): Promise<Location[]> {
  const { data, error } = await getAdminClient()
    .from("locations")
    .select("*")
    .order("sort_order");

  if (error) throw new InternalServerException("Failed to fetch locations");
  return (data ?? []) as Location[];
}

export async function getLocationById(id: string): Promise<Location> {
  const { data, error } = await getAdminClient()
    .from("locations")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new NotFoundException("Location not found");
  return data as Location;
}

export async function getSettings(): Promise<BusinessSettings> {
  const { data, error } = await getAdminClient()
    .from("business_settings")
    .select("*")
    .single();

  if (error) throw new InternalServerException("Failed to fetch settings");
  return data as BusinessSettings;
}
