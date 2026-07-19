import { getAdminClient } from "../config/supabase.js";
import {
  BadRequestException,
  NotFoundException,
  InternalServerException,
} from "../utils/app-error.js";
import type { Location, BusinessSettings, JobPost, JobApplication, ContactMessage } from "../types/models.js";

export async function getLocations(): Promise<Location[]> {
  const { data, error } = await getAdminClient()
    .from("locations")
    .select("*")
    .order("sort_order");

  if (error) throw new InternalServerException("Failed to fetch locations");
  return (data ?? []) as Location[];
}

export async function updateLocation(id: string, input: Record<string, unknown>): Promise<Location> {
  const { data, error } = await getAdminClient()
    .from("locations")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new BadRequestException(error.message);
  if (!data) throw new NotFoundException("Location not found");
  return data as Location;
}

export async function createLocation(input: Record<string, unknown>): Promise<Location> {
  const { data, error } = await getAdminClient()
    .from("locations")
    .insert({
      ...input,
      id: crypto.randomUUID(),
      sort_order: 0,
    } as Record<string, unknown>)
    .select()
    .single();

  if (error) throw new BadRequestException(error.message);
  return data as Location;
}

export async function deleteLocation(id: string): Promise<void> {
  const { error } = await getAdminClient().from("locations").delete().eq("id", id);
  if (error) throw new BadRequestException(error.message);
}

export async function getSettings(): Promise<BusinessSettings> {
  const { data, error } = await getAdminClient()
    .from("business_settings")
    .select("*")
    .limit(1)
    .single();

  if (error) throw new InternalServerException("Failed to fetch settings");
  return data as BusinessSettings;
}

export async function updateSettings(input: Record<string, unknown>): Promise<BusinessSettings> {
  const current = await getSettings();
  const { data, error } = await getAdminClient()
    .from("business_settings")
    .update(input)
    .eq("id", current.id)
    .select()
    .single();

  if (error) throw new BadRequestException(error.message);
  return data as BusinessSettings;
}

export async function getJobPosts(filter?: { status?: string }): Promise<JobPost[]> {
  let query = getAdminClient().from("job_posts").select("*").order("created_at", { ascending: false });

  if (filter?.status) query = query.eq("status", filter.status);

  const { data, error } = await query;
  if (error) throw new InternalServerException("Failed to fetch job posts");
  return (data ?? []) as JobPost[];
}

export async function getJobPostById(id: string): Promise<JobPost> {
  const { data, error } = await getAdminClient()
    .from("job_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new NotFoundException("Job post not found");
  return data as JobPost;
}

export async function createJobPost(input: Record<string, unknown>): Promise<JobPost> {
  const { data, error } = await getAdminClient()
    .from("job_posts")
    .insert({ id: crypto.randomUUID(), ...input, applications: 0 } as Record<string, unknown>)
    .select()
    .single();

  if (error) throw new BadRequestException(error.message);
  return data as JobPost;
}

export async function updateJobPost(id: string, input: Record<string, unknown>): Promise<JobPost> {
  const { data, error } = await getAdminClient()
    .from("job_posts")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new BadRequestException(error.message);
  if (!data) throw new NotFoundException("Job post not found");
  return data as JobPost;
}

export async function deleteJobPost(id: string): Promise<void> {
  const { error } = await getAdminClient().from("job_posts").delete().eq("id", id);
  if (error) throw new BadRequestException(error.message);
}

export async function createContactMessage(input: Record<string, unknown>): Promise<ContactMessage> {
  const { data, error } = await getAdminClient()
    .from("contact_messages")
    .insert({ ...input, read: false } as Record<string, unknown>)
    .select()
    .single();

  if (error) throw new BadRequestException(error.message);
  return data as ContactMessage;
}

// ── Job Applications ──────────────────────────────────────────

export async function getJobApplications(filters?: { job_post_id?: string; status?: string }): Promise<JobApplication[]> {
  let query = getAdminClient()
    .from("job_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.job_post_id) query = query.eq("job_post_id", filters.job_post_id);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw new InternalServerException("Failed to fetch job applications");
  return (data ?? []) as JobApplication[];
}

export async function getJobApplicationById(id: string): Promise<JobApplication> {
  const { data, error } = await getAdminClient()
    .from("job_applications")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new NotFoundException("Job application not found");
  return data as JobApplication;
}

export async function createJobApplication(input: Record<string, unknown>): Promise<JobApplication> {
  const { data, error } = await getAdminClient()
    .from("job_applications")
    .insert({ id: crypto.randomUUID(), ...input } as Record<string, unknown>)
    .select()
    .single();

  if (error) throw new BadRequestException(error.message);

  const jobId = input.job_post_id as string;
  if (jobId) {
    try {
      await getAdminClient().rpc("increment_job_applications", { job_id: jobId });
    } catch (e) {
      if (e instanceof Error && e.message?.includes("function not found")) {
        const { data: post } = await getAdminClient()
          .from("job_posts")
          .select("applications")
          .eq("id", jobId)
          .single();
        if (post) {
          await getAdminClient()
            .from("job_posts")
            .update({ applications: (post.applications ?? 0) + 1 })
            .eq("id", jobId);
        }
      }
    }
  }

  return data as JobApplication;
}

export async function updateJobApplication(id: string, input: Record<string, unknown>): Promise<JobApplication> {
  const { data, error } = await getAdminClient()
    .from("job_applications")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new BadRequestException(error.message);
  if (!data) throw new NotFoundException("Job application not found");
  return data as JobApplication;
}

export async function deleteJobApplication(id: string): Promise<void> {
  const { error } = await getAdminClient().from("job_applications").delete().eq("id", id);
  if (error) throw new BadRequestException(error.message);
}
