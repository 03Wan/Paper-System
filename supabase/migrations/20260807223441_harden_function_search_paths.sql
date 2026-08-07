alter function public.update_updated_at_column() set search_path = '';
alter function public.try_fix_mojibake_gbk_utf8(text) set search_path = '';

revoke execute on function public.update_updated_at_column() from public, anon, authenticated;
revoke execute on function public.try_fix_mojibake_gbk_utf8(text) from public, anon, authenticated;

grant execute on function public.update_updated_at_column() to service_role;
grant execute on function public.try_fix_mojibake_gbk_utf8(text) to service_role;
