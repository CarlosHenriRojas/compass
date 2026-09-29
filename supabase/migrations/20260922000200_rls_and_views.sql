create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and active
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and active
      and role = 'ADMIN'
  );
$$;

create or replace function public.is_client_member(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.client_members cm
    join public.profiles p on p.id = cm.user_id
    where cm.client_id = target_client_id
      and cm.user_id = auth.uid()
      and p.active
  );
$$;

revoke all on function public.is_active_user() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_client_member(uuid) from public;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_client_member(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.client_contacts enable row level security;
alter table public.client_members enable row level security;
alter table public.services enable row level security;
alter table public.client_services enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_financials enable row level security;
alter table public.documents enable row level security;
alter table public.metric_units enable row level security;
alter table public.metrics enable row level security;
alter table public.metric_entries enable row level security;
alter table public.goals enable row level security;
alter table public.weekly_updates enable row level security;
alter table public.weekly_update_results enable row level security;
alter table public.audit_logs enable row level security;

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

grant usage on schema public to authenticated;
grant usage on type public.app_role to authenticated;
grant usage on type public.client_status to authenticated;
grant usage on type public.health_status to authenticated;
grant usage on type public.contract_status to authenticated;
grant usage on type public.goal_status to authenticated;
grant usage on type public.metric_direction to authenticated;
grant usage on type public.document_category to authenticated;

grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.client_contacts to authenticated;
grant select, insert, update, delete on public.client_members to authenticated;
grant select, insert, update, delete on public.services to authenticated;
grant select, insert, update, delete on public.client_services to authenticated;
grant select, insert, update, delete on public.contracts to authenticated;
grant select, insert, update, delete on public.contract_financials to authenticated;
grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, update, delete on public.metric_units to authenticated;
grant select, insert, update, delete on public.metrics to authenticated;
grant select, insert, update, delete on public.metric_entries to authenticated;
grant select, insert, update, delete on public.goals to authenticated;
grant select, insert, update, delete on public.weekly_updates to authenticated;
grant select, insert, update, delete on public.weekly_update_results to authenticated;
grant select on public.audit_logs to authenticated;

create policy profiles_select_active_users
on public.profiles for select
to authenticated
using (public.is_active_user());

create policy clients_select_authenticated
on public.clients for select
to authenticated
using (public.is_active_user() and (archived_at is null or public.is_admin()));

create policy clients_insert_admin
on public.clients for insert
to authenticated
with check (public.is_admin() and created_by = auth.uid());

create policy clients_update_admin
on public.clients for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy clients_delete_admin
on public.clients for delete
to authenticated
using (public.is_admin());

create policy client_contacts_select_authenticated
on public.client_contacts for select
to authenticated
using (public.is_active_user());

create policy client_contacts_write_admin
on public.client_contacts for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy client_members_select_authenticated
on public.client_members for select
to authenticated
using (public.is_active_user());

create policy client_members_write_admin
on public.client_members for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy services_select_authenticated
on public.services for select
to authenticated
using (public.is_active_user() and (active or public.is_admin()));

create policy services_write_admin
on public.services for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy client_services_select_authenticated
on public.client_services for select
to authenticated
using (public.is_active_user());

create policy client_services_write_admin
on public.client_services for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy contracts_select_authenticated
on public.contracts for select
to authenticated
using (public.is_active_user());

create policy contracts_write_admin
on public.contracts for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy contract_financials_admin_only
on public.contract_financials for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy documents_select_allowed
on public.documents for select
to authenticated
using (
  public.is_active_user()
  and (category <> 'CONTRACT' or public.is_admin())
);

create policy documents_insert_allowed
on public.documents for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and (
    public.is_admin()
    or (category <> 'CONTRACT' and public.is_client_member(client_id))
  )
);

create policy documents_update_allowed
on public.documents for update
to authenticated
using (
  public.is_admin()
  or (category <> 'CONTRACT' and public.is_client_member(client_id))
)
with check (
  public.is_admin()
  or (category <> 'CONTRACT' and public.is_client_member(client_id))
);

create policy documents_delete_admin
on public.documents for delete
to authenticated
using (public.is_admin());

create policy metric_units_select_authenticated
on public.metric_units for select
to authenticated
using (public.is_active_user() and (active or public.is_admin()));

create policy metric_units_write_admin
on public.metric_units for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy metrics_select_authenticated
on public.metrics for select
to authenticated
using (public.is_active_user() and (archived_at is null or public.is_admin()));

create policy metrics_write_admin
on public.metrics for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy metric_entries_select_authenticated
on public.metric_entries for select
to authenticated
using (public.is_active_user());

create policy metric_entries_insert_member
on public.metric_entries for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.metrics m
    where m.id = metric_id
      and (public.is_admin() or public.is_client_member(m.client_id))
  )
);

create policy metric_entries_update_admin
on public.metric_entries for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy metric_entries_delete_admin
on public.metric_entries for delete
to authenticated
using (public.is_admin());

create policy goals_select_authenticated
on public.goals for select
to authenticated
using (public.is_active_user());

create policy goals_write_admin
on public.goals for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy weekly_updates_select_authenticated
on public.weekly_updates for select
to authenticated
using (public.is_active_user());

create policy weekly_updates_insert_member
on public.weekly_updates for insert
to authenticated
with check (
  user_id = auth.uid()
  and (public.is_admin() or public.is_client_member(client_id))
);

create policy weekly_updates_update_member
on public.weekly_updates for update
to authenticated
using (public.is_admin() or public.is_client_member(client_id))
with check (
  user_id = auth.uid()
  and (public.is_admin() or public.is_client_member(client_id))
);

create policy weekly_updates_delete_admin
on public.weekly_updates for delete
to authenticated
using (public.is_admin());

create policy weekly_update_results_select_authenticated
on public.weekly_update_results for select
to authenticated
using (
  public.is_active_user()
  and exists (
    select 1 from public.weekly_updates wu where wu.id = weekly_update_id
  )
);

create policy weekly_update_results_insert_member
on public.weekly_update_results for insert
to authenticated
with check (
  exists (
    select 1
    from public.weekly_updates wu
    where wu.id = weekly_update_id
      and (public.is_admin() or public.is_client_member(wu.client_id))
  )
);

create policy weekly_update_results_update_member
on public.weekly_update_results for update
to authenticated
using (
  exists (
    select 1
    from public.weekly_updates wu
    where wu.id = weekly_update_id
      and (public.is_admin() or public.is_client_member(wu.client_id))
  )
)
with check (
  exists (
    select 1
    from public.weekly_updates wu
    where wu.id = weekly_update_id
      and (public.is_admin() or public.is_client_member(wu.client_id))
  )
);

create policy weekly_update_results_delete_admin
on public.weekly_update_results for delete
to authenticated
using (public.is_admin());

create policy audit_logs_select_admin
on public.audit_logs for select
to authenticated
using (public.is_admin());

create or replace function public.set_client_health(
  target_client_id uuid,
  next_health public.health_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (
    public.is_admin()
    or public.is_client_member(target_client_id)
  ) then
    raise exception 'Você não possui permissão para alterar a saúde deste cliente.'
      using errcode = '42501';
  end if;

  update public.clients
  set health_status = next_health
  where id = target_client_id
    and archived_at is null;

  if not found then
    raise exception 'Cliente não encontrado.' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.set_client_health(uuid, public.health_status) from public;
grant execute on function public.set_client_health(uuid, public.health_status) to authenticated;

create or replace view public.latest_metric_entries
with (security_invoker = true)
as
select distinct on (me.metric_id)
  me.id,
  me.metric_id,
  me.value,
  me.observed_at,
  me.source,
  me.created_by,
  me.created_at
from public.metric_entries me
order by me.metric_id, me.observed_at desc, me.created_at desc;

create or replace view public.client_last_updates
with (security_invoker = true)
as
select
  c.id as client_id,
  max(wu.week_end) as last_update_date,
  current_date - coalesce(max(wu.week_end), c.joined_at) as days_without_update,
  (array_agg(wu.priority_next_action order by wu.week_end desc)
    filter (where wu.priority_next_action is not null))[1] as priority_next_action
from public.clients c
left join public.weekly_updates wu on wu.client_id = c.id
where c.archived_at is null
group by c.id, c.joined_at;

grant select on public.latest_metric_entries to authenticated;
grant select on public.client_last_updates to authenticated;
