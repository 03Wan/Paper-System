-- PaperHelper uses a trusted Vercel API with the service role. Browser clients
-- must not access application tables, storage objects, or privileged functions
-- directly through the Supabase anon/authenticated roles.

create table if not exists public.auth_login_attempt (
  key_hash text primary key,
  failure_count integer not null default 0 check (failure_count >= 0),
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz,
  last_attempt_at timestamptz not null default now()
);

alter table public.auth_login_attempt enable row level security;

drop policy if exists "read all users" on public.sys_user;
drop policy if exists "write users for all" on public.sys_user;
drop policy if exists "read all paper" on public.paper;
drop policy if exists "write paper for all" on public.paper;
drop policy if exists "read all file_record" on public.file_record;
drop policy if exists "write file_record for all" on public.file_record;
drop policy if exists "read all format_template" on public.format_template;
drop policy if exists "write format_template for all" on public.format_template;
drop policy if exists "read all format_rule" on public.format_rule;
drop policy if exists "write format_rule for all" on public.format_rule;
drop policy if exists "read all detection_task" on public.detection_task;
drop policy if exists "write detection_task for all" on public.detection_task;
drop policy if exists "read all detection_result" on public.detection_result;
drop policy if exists "write detection_result for all" on public.detection_result;
drop policy if exists "read all system_log" on public.system_log;
drop policy if exists "write system_log for all" on public.system_log;

drop policy if exists "files_select_anon" on storage.objects;
drop policy if exists "files_insert_anon" on storage.objects;
drop policy if exists "files_update_anon" on storage.objects;
drop policy if exists "files_delete_anon" on storage.objects;

revoke all on table
  public.sys_user,
  public.paper,
  public.file_record,
  public.format_template,
  public.format_rule,
  public.detection_task,
  public.detection_result,
  public.system_log,
  public.auth_login_attempt
from anon, authenticated;

revoke all on all sequences in schema public from anon, authenticated;
revoke all on storage.objects from anon, authenticated;

grant all on table
  public.sys_user,
  public.paper,
  public.file_record,
  public.format_template,
  public.format_rule,
  public.detection_task,
  public.detection_result,
  public.system_log,
  public.auth_login_attempt
to service_role;

grant usage, select on all sequences in schema public to service_role;
grant all on storage.objects to service_role;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

comment on table public.auth_login_attempt is
  'Server-only hashed login throttling keys; never exposed to browser roles.';
