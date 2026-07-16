import { supabase } from "../config/supabase.js";
import { AppError } from "../middleware/error-handler.js";
import type { Location, BusinessSettings, JobPost, ContactMessage } from "../types/models.js";

export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .order("sort_order");

  if (error) throw new AppError(500, "Failed to fetch locations");
  return (data ?? []) as Location[];
}

export async function updateLocation(id: string, input: Record<string, unknown>): Promise<Location> {
  const { data, error } = await supabase
    .from("locations")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new AppError(400, error.message);
  if (!data) throw new AppError(404, "Location not found");
  return data as Location;
}

export async function getSettings(): Promise<BusinessSettings> {
  const { data, error } = await supabase
    .from("business_settings")
    .select("*")
    .limit(1)
    .single();

  if (error) throw new AppError(500, "Failed to fetch settings");
  return data as BusinessSettings;
}

export async function updateSettings(input: Record<string, unknown>): Promise<BusinessSettings> {
  const current = await getSettings();
  const { data, error } = await supabase
    .from("business_settings")
    .update(input)
    .eq("id", current.id)
    .select()
    .single();

  if (error) throw new AppError(400, error.message);
  return data as BusinessSettings;
}

export async function getJobPosts(filter?: {
  status?: string;
}): Promise<JobPost[]> {
  let query = supabase.from("job_posts").select("*").order("created_at", { ascending: false });

  if (filter?.status) query = query.eq("status", filter.status);

  const { data, error } = await query;
  if (error) throw new AppError(500, "Failed to fetch job posts");
  return (data ?? []) as JobPost[];
}

export async function getJobPostById(id: string): Promise<JobPost> {
  const { data, error } = await supabase
    .from("job_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new AppError(404, "Job post not found");
  return data as JobPost;
}

export async function createJobPost(input: Record<string, unknown>): Promise<JobPost> {
  const { data, error } = await supabase
    .from("job_posts")
    .insert({ ...input, applications: 0 } as Record<string, unknown>)
    .select()
    .single();

  if (error) throw new AppError(400, error.message);
  return data as JobPost;
}

export async function updateJobPost(id: string, input: Record<string, unknown>): Promise<JobPost> {
  const { data, error } = await supabase
    .from("job_posts")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new AppError(400, error.message);
  if (!data) throw new AppError(404, "Job post not found");
  return data as JobPost;
}

export async function deleteJobPost(id: string): Promise<void> {
  const { error } = await supabase.from("job_posts").delete().eq("id", id);
  if (error) throw new AppError(400, error.message);
}

export async function createContactMessage(input: Record<string, unknown>): Promise<ContactMessage> {
  const { data, error } = await supabase
    .from("contact_messages")
    .insert({ ...input, read: false } as Record<string, unknown>)
    .select()
    .single();

  if (error) throw new AppError(400, error.message);
  return data as ContactMessage;
}
