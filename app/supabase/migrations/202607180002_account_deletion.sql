-- Allow account deletion without blocking records that belong to a shared family.
-- Ownership cascades still remove a user's own family and all child records.
do $$
declare r record;
begin
  for r in
    select tc.table_name, kcu.column_name, tc.constraint_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name and tc.constraint_schema = kcu.constraint_schema
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_name = tc.constraint_name and ccu.constraint_schema = tc.constraint_schema
    where tc.constraint_type = 'FOREIGN KEY'
      and tc.table_schema = 'public'
      and ccu.table_schema = 'auth' and ccu.table_name = 'users'
      and kcu.column_name in ('created_by', 'updated_by')
  loop
    execute format('alter table public.%I drop constraint %I', r.table_name, r.constraint_name);
    execute format('alter table public.%I alter column %I drop not null', r.table_name, r.column_name);
    execute format('alter table public.%I add constraint %I foreign key (%I) references auth.users(id) on delete set null', r.table_name, r.constraint_name, r.column_name);
  end loop;
end $$;

-- Avoid retaining a parent identifier on a child deletion audit row after the child is gone.
create or replace function public.audit_private_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare rid uuid; cid uuid; fid uuid; fields text[];
begin
  rid := coalesce((to_jsonb(new)->>'id')::uuid, (to_jsonb(old)->>'id')::uuid);
  cid := coalesce((to_jsonb(new)->>'child_id')::uuid, (to_jsonb(old)->>'child_id')::uuid);
  if cid is not null then select family_id into fid from public.children where id = cid; end if;
  if tg_op = 'UPDATE' then
    select array_agg(k) into fields from jsonb_each(to_jsonb(new)) n(k,v)
      where to_jsonb(old)->k is distinct from v;
  end if;
  if tg_op = 'DELETE' then cid := null; end if;
  insert into public.audit_logs(family_id, child_id, actor_user_id, action, table_name, record_id, changed_fields)
  values(fid, cid, auth.uid(), lower(tg_op), tg_table_name, rid, fields);
  return coalesce(new, old);
end $$;
