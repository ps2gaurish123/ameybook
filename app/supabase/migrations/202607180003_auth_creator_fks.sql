-- Explicitly replace creator references; auth schema metadata is not exposed
-- consistently through information_schema on hosted projects.
do $$
declare spec text[];
declare parts text[];
begin
  foreach spec slice 1 in array array[
    ['children','created_by'],
    ['milestone_observations','created_by'],
    ['mchat_screenings','created_by'],
    ['growth_measurements','created_by'],
    ['tracker_preferences','updated_by'],
    ['tracker_entries','created_by'],
    ['vaccination_records','created_by'],
    ['doctor_visits','created_by'],
    ['medical_documents','created_by'],
    ['memory_events','created_by'],
    ['reminders','created_by'],
    ['timeline_events','created_by'],
    ['share_links','created_by']
  ]
  loop
    parts := spec;
    execute format('alter table public.%I drop constraint if exists %I', parts[1], parts[1] || '_' || parts[2] || '_fkey');
    execute format('alter table public.%I alter column %I drop not null', parts[1], parts[2]);
    execute format('alter table public.%I add constraint %I foreign key (%I) references auth.users(id) on delete set null', parts[1], parts[1] || '_' || parts[2] || '_fkey', parts[2]);
  end loop;
end $$;
