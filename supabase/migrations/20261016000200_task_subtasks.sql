alter table public.tasks
  add column parent_task_id uuid references public.tasks (id) on delete cascade;

alter table public.tasks
  add constraint task_cannot_parent_itself check (parent_task_id is null or parent_task_id <> id);

create index tasks_parent_idx
  on public.tasks (parent_task_id, sort_order, due_date)
  where archived_at is null;
