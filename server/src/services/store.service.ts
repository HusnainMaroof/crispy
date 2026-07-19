import { getAdminClient } from "../config/supabase.js";
import { NotFoundException } from "../utils/app-error.js";
import type { Location, BusinessSettings } from "../types/models.js";

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
