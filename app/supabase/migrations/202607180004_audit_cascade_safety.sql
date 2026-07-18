-- Account deletion can cascade creator updates after a child row is gone.
-- In that case retain the audit event without an invalid child reference.
create or replace function public.audit_private_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare rid uuid; cid uuid; fid uuid; fields text[];
begin
  rid := coalesce((to_jsonb(new)->>'id')::uuid, (to_jsonb(old)->>'id')::uuid);
  cid := coalesce((to_jsonb(new)->>'child_id')::uuid, (to_jsonb(old)->>'child_id')::uuid);
  if cid is not null then
    select family_id into fid from public.children where id = cid;
    if not found then cid := null; end if;
  end if;
  if tg_op = 'UPDATE' then
    select array_agg(k) into fields from jsonb_each(to_jsonb(new)) n(k,v)
      where to_jsonb(old)->k is distinct from v;
  end if;
  if tg_op = 'DELETE' then cid := null; end if;
  insert into public.audit_logs(family_id, child_id, actor_user_id, action, table_name, record_id, changed_fields)
  values(fid, cid, auth.uid(), lower(tg_op), tg_table_name, rid, fields);
  return coalesce(new, old);
end $$;
