create or replace function increment_job_applications(job_id text)
returns void
language plpgsql
security definer
as $$
begin
  update job_posts
  set applications = applications + 1
  where id = job_id;
end;
$$;
