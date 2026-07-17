-- ============================================================
-- Job Applications table
-- ============================================================

-- Enum for application review status
create type application_status as enum ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired');

-- 11. Job Applications
create table if not exists job_applications (
  id              text primary key,
  job_post_id     text not null references job_posts(id) on delete cascade,
  applicant_name  text not null,
  email           text not null,
  phone           text,
  cv_url          text,
  cover_letter    text,
  status          application_status not null default 'pending',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Indexes
create index idx_job_applications_job_post on job_applications(job_post_id);
create index idx_job_applications_status on job_applications(status);

-- Auto-update updated_at trigger
create trigger job_applications_updated_at before update on job_applications
  for each row execute function update_updated_at();

-- Row Level Security
alter table job_applications enable row level security;

-- Anon can insert applications (public form)
create policy "anon can create job_applications"
  on job_applications for insert with check (true);

-- Anon can read own applications (by email match, optional)
-- For now, only admin can read all applications
create policy "admin all job_applications"
  on job_applications for all using ((select private.is_admin()));
