create type public.task_status as enum ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE');
create type public.task_priority as enum ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete cascade,
  service_id uuid references public.services (id) on delete set null,
  title text not null check (char_length(trim(title)) between 2 and 180),
  description text,
  status public.task_status not null default 'TODO',
  priority public.task_priority not null default 'MEDIUM',
  due_date date,
  sort_order integer not null default 0,
  completed_at timestamptz,
  created_by uuid not null references public.profiles (id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint completed_task_has_timestamp check (
    (status = 'DONE' and completed_at is not null)
    or (status <> 'DONE' and completed_at is null)
  )
);

create table public.task_assignees (
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  assigned_at timestamptz not null default now(),
  assigned_by uuid not null references public.profiles (id) on delete restrict,
  primary key (task_id, user_id)
);

create table public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 180),
  storage_bucket text not null default 'task-attachments',
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.task_status_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  from_status public.task_status,
  to_status public.task_status not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now()
);

create index tasks_board_idx on public.tasks (status, sort_order, due_date) where archived_at is null;
create index tasks_client_idx on public.tasks (client_id, status, due_date) where archived_at is null;
create index tasks_due_idx on public.tasks (due_date, status) where archived_at is null and status <> 'DONE';
create index task_assignees_user_idx on public.task_assignees (user_id, task_id);
create index task_attachments_task_idx on public.task_attachments (task_id, created_at desc);
create index task_status_history_task_idx on public.task_status_history (task_id, changed_at desc);

create trigger tasks_touch_updated_at before update on public.tasks
for each row execute function public.touch_updated_at();

create or replace function public.can_manage_task(target_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tasks t
    where t.id = target_task_id
      and (
        public.is_admin()
        or t.created_by = auth.uid()
        or exists (
          select 1 from public.task_assignees ta
          where ta.task_id = t.id and ta.user_id = auth.uid()
        )
        or (t.client_id is not null and public.is_client_member(t.client_id))
      )
  );
$$;

revoke all on function public.can_manage_task(uuid) from public;
grant execute on function public.can_manage_task(uuid) to authenticated;

create or replace function public.record_task_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.task_status_history (task_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger record_task_status_change_trigger
after update of status on public.tasks
for each row execute function public.record_task_status_change();

create trigger audit_tasks after insert or update or delete on public.tasks
for each row execute function public.audit_row_change();

alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_attachments enable row level security;
alter table public.task_status_history enable row level security;

grant usage on type public.task_status to authenticated;
grant usage on type public.task_priority to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.task_assignees to authenticated;
grant select, insert, update, delete on public.task_attachments to authenticated;
grant select on public.task_status_history to authenticated;

create policy tasks_select_active
on public.tasks for select to authenticated
using (public.is_active_user());

create policy tasks_insert_active
on public.tasks for insert to authenticated
with check (
  public.is_active_user()
  and created_by = auth.uid()
  and (client_id is null or public.is_admin() or public.is_client_member(client_id))
);

create policy tasks_update_manager
on public.tasks for update to authenticated
using (public.can_manage_task(id))
with check (
  public.can_manage_task(id)
  and (client_id is null or public.is_admin() or public.is_client_member(client_id))
);

create policy tasks_delete_admin
on public.tasks for delete to authenticated
using (public.is_admin());

create policy task_assignees_select_active
on public.task_assignees for select to authenticated
using (public.is_active_user());

create policy task_assignees_insert_manager
on public.task_assignees for insert to authenticated
with check (public.can_manage_task(task_id) and assigned_by = auth.uid());

create policy task_assignees_delete_manager
on public.task_assignees for delete to authenticated
using (public.can_manage_task(task_id));

create policy task_attachments_select_active
on public.task_attachments for select to authenticated
using (public.is_active_user());

create policy task_attachments_insert_manager
on public.task_attachments for insert to authenticated
with check (uploaded_by = auth.uid() and public.can_manage_task(task_id));

create policy task_attachments_update_manager
on public.task_attachments for update to authenticated
using (public.can_manage_task(task_id))
with check (public.can_manage_task(task_id));

create policy task_attachments_delete_manager
on public.task_attachments for delete to authenticated
using (public.can_manage_task(task_id));

create policy task_status_history_select_active
on public.task_status_history for select to authenticated
using (public.is_active_user());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-attachments',
  'task-attachments',
  false,
  20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.storage_task_id(object_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when (storage.foldername(object_name))[1]
      ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    then ((storage.foldername(object_name))[1])::uuid
    else null
  end;
$$;

revoke all on function public.storage_task_id(text) from public;
grant execute on function public.storage_task_id(text) to authenticated;

create policy task_attachments_storage_select
on storage.objects for select to authenticated
using (
  bucket_id = 'task-attachments'
  and public.is_active_user()
  and exists (
    select 1 from public.task_attachments a
    where a.storage_bucket = bucket_id and a.storage_path = name
  )
);

create policy task_attachments_storage_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'task-attachments'
  and public.storage_task_id(name) is not null
  and public.can_manage_task(public.storage_task_id(name))
);

create policy task_attachments_storage_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'task-attachments'
  and public.storage_task_id(name) is not null
  and public.can_manage_task(public.storage_task_id(name))
);
