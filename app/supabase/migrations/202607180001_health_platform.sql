-- Thousand Days health-record foundation (OCR intentionally excluded).
-- All child data is private by default and protected with family membership RLS.

create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.family_role as enum ('parent', 'caregiver', 'doctor');
create type public.member_status as enum ('invited', 'active', 'revoked');
create type public.milestone_status as enum ('not_observed', 'emerging', 'achieved', 'concern');
create type public.record_source as enum ('parent', 'caregiver', 'doctor', 'imported');
create type public.share_status as enum ('active', 'revoked', 'expired');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_path text,
  timezone text not null default 'Asia/Kolkata',
  locale text not null default 'en-IN',
  privacy_consent_at timestamptz,
  medical_disclaimer_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.families (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My family',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email citext,
  role public.family_role not null default 'caregiver',
  status public.member_status not null default 'invited',
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (family_id, user_id),
  unique (family_id, invited_email)
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  full_name text not null,
  photo_path text,
  date_of_birth date not null,
  gender text,
  blood_group text,
  birth_weight_kg numeric(5,2),
  birth_length_cm numeric(5,2),
  gestational_age_weeks numeric(4,1),
  premature boolean not null default false,
  allergies text[] not null default '{}',
  medical_conditions text[] not null default '{}',
  pediatrician_name text,
  pediatrician_phone text,
  pediatrician_email text,
  emergency_contact_name text,
  emergency_contact_phone text,
  father_height_cm numeric(5,2),
  mother_height_cm numeric(5,2),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.milestone_definitions (
  id uuid primary key default gen_random_uuid(),
  age_months integer not null check (age_months between 0 and 60),
  category text not null check (category in ('movement', 'language', 'social', 'cognitive')),
  title text not null,
  guidance text,
  source_name text,
  source_url text,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table public.milestone_observations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  definition_id uuid references public.milestone_definitions(id) on delete set null,
  custom_title text,
  category text not null,
  status public.milestone_status not null default 'not_observed',
  observed_on date,
  notes text,
  doctor_comment text,
  media_paths text[] not null default '{}',
  source public.record_source not null default 'parent',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (definition_id is not null or custom_title is not null)
);

create table public.screening_instruments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  version text,
  copyright_notice text,
  license_status text not null default 'permission_required',
  official_url text not null,
  min_age_months integer,
  max_age_months integer,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.screening_questions (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid not null references public.screening_instruments(id) on delete cascade,
  item_number integer not null,
  prompt text not null,
  risk_answer boolean,
  follow_up jsonb,
  unique (instrument_id, item_number)
);

create table public.mchat_screenings (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  instrument_id uuid references public.screening_instruments(id) on delete restrict,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'cancelled')),
  raw_score integer check (raw_score between 0 and 20),
  follow_up_score integer check (follow_up_score between 0 and 20),
  risk_band text check (risk_band in ('low', 'moderate', 'high')),
  screening_date date not null default current_date,
  observations text,
  clinician_summary text,
  source_url text not null default 'https://www.mchatscreen.com/',
  disclaimer_accepted_at timestamptz,
  completed_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mchat_answers (
  id uuid primary key default gen_random_uuid(),
  screening_id uuid not null references public.mchat_screenings(id) on delete cascade,
  question_id uuid references public.screening_questions(id) on delete restrict,
  item_number integer not null,
  answer boolean not null,
  follow_up_answer boolean,
  is_risk_response boolean,
  notes text,
  answered_at timestamptz not null default now(),
  unique (screening_id, item_number)
);

create table public.growth_measurements (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  measured_at timestamptz not null,
  weight_kg numeric(6,3),
  length_height_cm numeric(6,2),
  head_circumference_cm numeric(6,2),
  measurement_position text check (measurement_position in ('recumbent', 'standing')),
  source public.record_source not null default 'parent',
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (weight_kg is not null or length_height_cm is not null or head_circumference_cm is not null)
);

create table public.tracker_preferences (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  tracker_type text not null,
  enabled boolean not null default true,
  display_order integer not null default 0,
  settings jsonb not null default '{}',
  updated_by uuid not null references auth.users(id) on delete restrict,
  updated_at timestamptz not null default now(),
  unique (child_id, tracker_type)
);

create table public.tracker_entries (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  tracker_type text not null check (tracker_type in ('feeding','sleep','diaper','stool','medication','temperature','illness','allergy','dental','screen_time','mood','other')),
  event_at timestamptz not null,
  end_at timestamptz,
  title text,
  value_number numeric,
  value_unit text,
  details jsonb not null default '{}',
  notes text,
  source public.record_source not null default 'parent',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vaccination_records (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  vaccine_name text not null,
  dose_label text,
  recommended_age text,
  due_date date,
  administered_on date,
  brand_name text,
  batch_number text,
  expiry_date date,
  provider_name text,
  provider_signature_path text,
  status text not null default 'due' check (status in ('due','scheduled','given','deferred','not_applicable')),
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.doctor_visits (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  visit_at timestamptz not null,
  clinician_name text,
  facility text,
  reason text,
  observations text,
  diagnosis text,
  plan text,
  follow_up_date date,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medical_documents (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  category text not null default 'other',
  document_date date not null default current_date,
  title text not null,
  notes text,
  version integer not null default 1,
  replaces_document_id uuid references public.medical_documents(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memory_events (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  event_date date not null,
  category text not null default 'memory',
  title text not null,
  caption text,
  media_paths text[] not null default '{}',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  reminder_type text not null,
  title text not null,
  due_at timestamptz not null,
  recurrence_rule text,
  linked_record_type text,
  linked_record_id uuid,
  completed_at timestamptz,
  dismissed_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  event_at timestamptz not null,
  event_type text not null,
  title text not null,
  summary text,
  linked_table text,
  linked_record_id uuid,
  metadata jsonb not null default '{}',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  token_hash text not null unique,
  label text,
  permissions jsonb not null default '{"profile":true,"growth":true,"vaccines":true,"milestones":true,"screenings":true,"visits":true}',
  status public.share_status not null default 'active',
  expires_at timestamptz not null,
  max_views integer,
  view_count integer not null default 0,
  last_viewed_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  family_id uuid references public.families(id) on delete set null,
  child_id uuid references public.children(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id uuid,
  changed_fields text[],
  occurred_at timestamptz not null default now(),
  ip_hint text,
  user_agent text
);

create index children_family_idx on public.children(family_id);
create index family_members_user_idx on public.family_members(user_id, status);
create index milestone_observations_child_date_idx on public.milestone_observations(child_id, observed_on desc);
create index growth_child_date_idx on public.growth_measurements(child_id, measured_at desc);
create index tracker_entries_child_date_idx on public.tracker_entries(child_id, event_at desc);
create index vaccination_child_due_idx on public.vaccination_records(child_id, due_date);
create index documents_child_date_idx on public.medical_documents(child_id, document_date desc);
create index memories_child_date_idx on public.memory_events(child_id, event_date desc);
create index reminders_child_due_idx on public.reminders(child_id, due_at) where completed_at is null and dismissed_at is null;
create index timeline_child_date_idx on public.timeline_events(child_id, event_at desc);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare new_family_id uuid;
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  insert into public.families (owner_user_id, name) values (new.id, 'My family') returning id into new_family_id;
  insert into public.family_members (family_id, user_id, role, status, joined_at)
    values (new_family_id, new.id, 'parent', 'active', now());
  update public.family_members
    set user_id = new.id, status = 'active', joined_at = now()
    where invited_email = new.email::citext and user_id is null and status = 'invited';
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_family_member(target_family uuid, allowed_roles public.family_role[] default array['parent','caregiver','doctor']::public.family_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.family_members fm
    where fm.family_id = target_family and fm.user_id = auth.uid()
      and fm.status = 'active' and fm.role = any(allowed_roles)
  );
$$;

create or replace function public.can_access_child(target_child uuid, allowed_roles public.family_role[] default array['parent','caregiver','doctor']::public.family_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.children c
    where c.id = target_child and public.is_family_member(c.family_id, allowed_roles)
  );
$$;

create or replace function public.current_user_family_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select family_id from public.family_members where user_id = auth.uid() and status = 'active';
$$;

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
  insert into public.audit_logs(family_id, child_id, actor_user_id, action, table_name, record_id, changed_fields)
  values(fid, cid, auth.uid(), lower(tg_op), tg_table_name, rid, fields);
  return coalesce(new, old);
end $$;

do $$ declare t text; begin
  foreach t in array array['profiles','families','children','milestone_observations','mchat_screenings','growth_measurements','tracker_entries','vaccination_records','doctor_visits','medical_documents','memory_events','reminders']
  loop execute format('create trigger %I_touch before update on public.%I for each row execute procedure public.touch_updated_at()', t, t); end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['children','milestone_observations','mchat_screenings','growth_measurements','tracker_entries','vaccination_records','doctor_visits','medical_documents','memory_events','reminders','share_links']
  loop execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute procedure public.audit_private_change()', t, t); end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.children enable row level security;
alter table public.milestone_definitions enable row level security;
alter table public.milestone_observations enable row level security;
alter table public.screening_instruments enable row level security;
alter table public.screening_questions enable row level security;
alter table public.mchat_screenings enable row level security;
alter table public.mchat_answers enable row level security;
alter table public.growth_measurements enable row level security;
alter table public.tracker_preferences enable row level security;
alter table public.tracker_entries enable row level security;
alter table public.vaccination_records enable row level security;
alter table public.doctor_visits enable row level security;
alter table public.medical_documents enable row level security;
alter table public.memory_events enable row level security;
alter table public.reminders enable row level security;
alter table public.timeline_events enable row level security;
alter table public.share_links enable row level security;
alter table public.audit_logs enable row level security;

create policy profile_self on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy families_read on public.families for select using (public.is_family_member(id));
create policy families_owner_update on public.families for update using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy members_read on public.family_members for select using (public.is_family_member(family_id));
create policy members_parent_write on public.family_members for all using (public.is_family_member(family_id, array['parent']::public.family_role[])) with check (public.is_family_member(family_id, array['parent']::public.family_role[]));
create policy children_read on public.children for select using (public.is_family_member(family_id));
create policy children_insert on public.children for insert with check (public.is_family_member(family_id, array['parent','caregiver']::public.family_role[]) and created_by = auth.uid());
create policy children_update on public.children for update using (public.is_family_member(family_id, array['parent','caregiver']::public.family_role[])) with check (public.is_family_member(family_id, array['parent','caregiver']::public.family_role[]));
create policy children_delete on public.children for delete using (public.is_family_member(family_id, array['parent']::public.family_role[]));
create policy definitions_read on public.milestone_definitions for select to authenticated using (active);
create policy instruments_read on public.screening_instruments for select to authenticated using (true);
create policy questions_read on public.screening_questions for select to authenticated using (exists(select 1 from public.screening_instruments i where i.id=instrument_id and i.active));

do $$ declare t text; begin
  foreach t in array array['milestone_observations','mchat_screenings','growth_measurements','tracker_preferences','tracker_entries','vaccination_records','doctor_visits','medical_documents','memory_events','reminders','timeline_events','share_links']
  loop
    execute format('create policy %I_child_read on public.%I for select using (public.can_access_child(child_id))', t, t);
    execute format('create policy %I_child_insert on public.%I for insert with check (public.can_access_child(child_id, array[''parent'',''caregiver'']::public.family_role[]) and %s)', t, t, case when t='tracker_preferences' then 'updated_by = auth.uid()' else 'created_by = auth.uid()' end);
    execute format('create policy %I_child_update on public.%I for update using (public.can_access_child(child_id, array[''parent'',''caregiver'']::public.family_role[])) with check (public.can_access_child(child_id, array[''parent'',''caregiver'']::public.family_role[]))', t, t);
    execute format('create policy %I_child_delete on public.%I for delete using (public.can_access_child(child_id, array[''parent'']::public.family_role[]))', t, t);
  end loop;
end $$;

create policy answers_read on public.mchat_answers for select using (exists(select 1 from public.mchat_screenings s where s.id=screening_id and public.can_access_child(s.child_id)));
create policy answers_write on public.mchat_answers for all using (exists(select 1 from public.mchat_screenings s where s.id=screening_id and public.can_access_child(s.child_id, array['parent','caregiver']::public.family_role[]))) with check (exists(select 1 from public.mchat_screenings s where s.id=screening_id and public.can_access_child(s.child_id, array['parent','caregiver']::public.family_role[])));
create policy audit_parent_read on public.audit_logs for select using (public.is_family_member(family_id, array['parent']::public.family_role[]));

insert into public.screening_instruments(code,title,version,copyright_notice,license_status,official_url,min_age_months,max_age_months,active)
values ('MCHAT-R-F','Modified Checklist for Autism in Toddlers, Revised with Follow-Up','2025','© 2009 Robins, Fein & Barton. Reproduction in software requires permission.','permission_required','https://www.mchatscreen.com/mchat-rf/',16,30,false);

insert into public.milestone_definitions(age_months,category,title,guidance,source_name,source_url,sort_order) values
  (2,'social','Responds to familiar people','Record what you observe; a single entry is not a diagnosis.','CDC Learn the Signs','https://www.cdc.gov/ncbddd/actearly/milestones/',1),
  (4,'movement','Holds head steadier with support','Discuss loss of a previously acquired skill promptly.','CDC Learn the Signs','https://www.cdc.gov/ncbddd/actearly/milestones/',1),
  (6,'language','Takes turns making sounds','Use the notes field to add examples for your clinician.','CDC Learn the Signs','https://www.cdc.gov/ncbddd/actearly/milestones/',1),
  (9,'cognitive','Looks for an object that moved out of sight','Children develop at different rates.','CDC Learn the Signs','https://www.cdc.gov/ncbddd/actearly/milestones/',1),
  (12,'movement','Pulls up or moves with support','Record emerging skills as well as achieved skills.','CDC Learn the Signs','https://www.cdc.gov/ncbddd/actearly/milestones/',1),
  (18,'language','Uses words or meaningful gestures','Raise concerns with the child’s clinician.','CDC Learn the Signs','https://www.cdc.gov/ncbddd/actearly/milestones/',1),
  (24,'social','Notices when others are upset','Use this tracker alongside routine developmental screening.','CDC Learn the Signs','https://www.cdc.gov/ncbddd/actearly/milestones/',1),
  (30,'cognitive','Uses objects in pretend play','Save a note or media example if helpful.','CDC Learn the Signs','https://www.cdc.gov/ncbddd/actearly/milestones/',1),
  (36,'language','Has back-and-forth conversations','Seek review for regression or persistent concerns.','CDC Learn the Signs','https://www.cdc.gov/ncbddd/actearly/milestones/',1),
  (48,'movement','Manages age-appropriate movement tasks','Ask a clinician if movement seems asymmetric.','CDC Learn the Signs','https://www.cdc.gov/ncbddd/actearly/milestones/',1),
  (60,'cognitive','Sustains attention in an age-appropriate activity','Review development in context, not from one item alone.','CDC Learn the Signs','https://www.cdc.gov/ncbddd/actearly/milestones/',1);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
  ('child-media','child-media',false,52428800,array['image/jpeg','image/png','image/heic','image/heif','video/mp4','video/quicktime']),
  ('medical-documents','medical-documents',false,26214400,array['application/pdf','image/jpeg','image/png','image/heic','image/heif'])
on conflict (id) do update set public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

create policy child_media_read on storage.objects for select to authenticated using (bucket_id='child-media' and public.can_access_child(((storage.foldername(name))[1])::uuid));
create policy child_media_insert on storage.objects for insert to authenticated with check (bucket_id='child-media' and public.can_access_child(((storage.foldername(name))[1])::uuid,array['parent','caregiver']::public.family_role[]));
create policy child_media_update on storage.objects for update to authenticated using (bucket_id='child-media' and public.can_access_child(((storage.foldername(name))[1])::uuid,array['parent','caregiver']::public.family_role[]));
create policy child_media_delete on storage.objects for delete to authenticated using (bucket_id='child-media' and public.can_access_child(((storage.foldername(name))[1])::uuid,array['parent']::public.family_role[]));
create policy docs_read on storage.objects for select to authenticated using (bucket_id='medical-documents' and public.can_access_child(((storage.foldername(name))[1])::uuid));
create policy docs_insert on storage.objects for insert to authenticated with check (bucket_id='medical-documents' and public.can_access_child(((storage.foldername(name))[1])::uuid,array['parent','caregiver']::public.family_role[]));
create policy docs_update on storage.objects for update to authenticated using (bucket_id='medical-documents' and public.can_access_child(((storage.foldername(name))[1])::uuid,array['parent','caregiver']::public.family_role[]));
create policy docs_delete on storage.objects for delete to authenticated using (bucket_id='medical-documents' and public.can_access_child(((storage.foldername(name))[1])::uuid,array['parent']::public.family_role[]));
