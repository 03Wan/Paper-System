-- Supabase Storage setup for frontend direct upload/download.
-- Browser roles are intentionally denied; only the server-side service role is used.

-- 1) Create/Update bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'files',
  'files',
  false,
  52428800,
  array[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2) Browser roles have no direct object access. The private bucket is accessed
-- exclusively by the server-side service role, which bypasses Storage RLS.
drop policy if exists "files_select_anon" on storage.objects;
drop policy if exists "files_insert_anon" on storage.objects;
drop policy if exists "files_update_anon" on storage.objects;
drop policy if exists "files_delete_anon" on storage.objects;

revoke all on storage.objects from anon, authenticated;
grant all on storage.objects to service_role;
