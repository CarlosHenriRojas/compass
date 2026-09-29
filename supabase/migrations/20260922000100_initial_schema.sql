create extension if not exists citext with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create type public.app_role as enum ('ADMIN', 'COLLABORATOR');
create type public.client_status as enum ('ONBOARDING', 'ACTIVE', 'PAUSED', 'CLOSED');
create type public.health_status as enum ('HEALTHY', 'ATTENTION', 'CRITICAL');
create type public.contract_status as enum ('ACTIVE', 'IN_RENEWAL', 'ENDED', 'PAUSED');
create type public.goal_status as enum ('NOT_STARTED', 'IN_PROGRESS', 'ACHIEVED', 'PAUSED', 'CANCELLED');
create type public.metric_direction as enum ('INCREASE', 'DECREASE', 'NEUTRAL');
create type public.document_category as enum (
  'CONTRACT',
  'BRIEFING',
  'PLANNING',
  'REPORT',
  'CLIENT_MATERIAL',
  'OTHER'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  email extensions.citext not null unique,
  avatar_path text,
  role public.app_role not null default 'COLLABORATOR',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 160),
  legal_name text,
  cnpj varchar(14) unique check (cnpj is null or cnpj ~ '^[0-9]{14}$'),
  segment text,
  city text,
  state char(2) check (state is null or state ~ '^[A-Z]{2}$'),
  website_url text,
  instagram_url text,
  google_business_url text,
  logo_path text,
  status public.client_status not null default 'ONBOARDING',
  health_status public.health_status,
  joined_at date not null default current_date,
  acquisition_source text,
  sold_by_user_id uuid references public.profiles (id) on delete set null,
  general_notes text,
  internal_notes text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint active_client_requires_health check (
    status <> 'ACTIVE' or health_status is not null
  )
);

create table public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  position text,
  phone varchar(20),
  email extensions.citext,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index client_contacts_one_primary_idx
  on public.client_contacts (client_id)
  where is_primary;

create table public.client_members (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  responsibility text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (client_id, user_id)
);

create unique index client_members_one_primary_idx
  on public.client_members (client_id)
  where is_primary;

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) between 2 and 100),
  description text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,
  scope_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, service_id)
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  start_date date not null,
  end_date date,
  automatic_renewal boolean not null default false,
  status public.contract_status not null default 'ACTIVE',
  scope_included text,
  scope_excluded text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_dates_are_valid check (
    end_date is null or end_date >= start_date
  )
);

create unique index contracts_one_current_idx
  on public.contracts (client_id)
  where status in ('ACTIVE', 'IN_RENEWAL');

create table public.contract_financials (
  contract_id uuid primary key references public.contracts (id) on delete cascade,
  monthly_value numeric(12, 2) not null check (monthly_value >= 0),
  billing_day smallint not null check (billing_day between 1 and 31),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  contract_id uuid references public.contracts (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 180),
  category public.document_category not null,
  storage_bucket text not null,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint contract_document_requires_contract check (
    category <> 'CONTRACT' or contract_id is not null
  )
);

create table public.metric_units (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z][a-z0-9_]*$'),
  name text not null unique,
  symbol text not null default '',
  format text not null default 'decimal',
  active boolean not null default true,
  sort_order integer not null default 0
);

create table public.metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  category text,
  unit_id uuid not null references public.metric_units (id) on delete restrict,
  default_direction public.metric_direction not null default 'NEUTRAL',
  baseline_value numeric(18, 4),
  baseline_date date,
  featured boolean not null default false,
  created_by uuid not null references public.profiles (id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint baseline_is_complete check (
    (baseline_value is null and baseline_date is null)
    or (baseline_value is not null and baseline_date is not null)
  )
);

create unique index metrics_active_name_idx
  on public.metrics (client_id, lower(name))
  where archived_at is null;

create table public.metric_entries (
  id uuid primary key default gen_random_uuid(),
  metric_id uuid not null references public.metrics (id) on delete cascade,
  value numeric(18, 4) not null,
  observed_at date not null default current_date,
  source text,
  notes text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  metric_id uuid references public.metrics (id) on delete set null,
  title text not null check (char_length(trim(title)) between 2 and 160),
  description text,
  category text,
  initial_value numeric(18, 4),
  target_value numeric(18, 4),
  manual_current_value numeric(18, 4),
  direction public.metric_direction not null default 'INCREASE',
  start_date date not null default current_date,
  deadline date,
  responsible_user_id uuid references public.profiles (id) on delete set null,
  status public.goal_status not null default 'NOT_STARTED',
  completed_at timestamptz,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goal_dates_are_valid check (
    deadline is null or deadline >= start_date
  ),
  constraint linked_goal_has_no_manual_value check (
    metric_id is null or manual_current_value is null
  )
);

create table public.weekly_updates (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  week_start date not null,
  week_end date not null,
  summary text not null,
  actions_completed text,
  results_summary text,
  blockers text,
  next_steps text,
  priority_next_action text,
  health_status public.health_status,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint update_week_is_valid check (week_end >= week_start),
  unique (client_id, week_start)
);

create table public.weekly_update_results (
  id uuid primary key default gen_random_uuid(),
  weekly_update_id uuid not null references public.weekly_updates (id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 80),
  value text not null check (char_length(trim(value)) between 1 and 80),
  description text,
  sort_order integer not null default 0
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles (id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  request_id uuid,
  created_at timestamptz not null default now()
);

create index clients_status_idx on public.clients (status) where archived_at is null;
create index clients_health_idx on public.clients (health_status) where archived_at is null;
create index clients_name_trgm_idx on public.clients using gin (name extensions.gin_trgm_ops);
create index client_members_user_idx on public.client_members (user_id, client_id);
create index client_services_service_idx on public.client_services (service_id, client_id);
create index contracts_expiration_idx on public.contracts (status, end_date);
create index documents_client_idx on public.documents (client_id, created_at desc);
create index metrics_client_featured_idx on public.metrics (client_id, featured) where archived_at is null;
create index metric_entries_latest_idx on public.metric_entries (metric_id, observed_at desc, created_at desc);
create index goals_pending_idx on public.goals (client_id, status, deadline);
create index weekly_updates_client_idx on public.weekly_updates (client_id, week_start desc);
create index weekly_updates_feed_idx on public.weekly_updates (created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();
create trigger clients_touch_updated_at before update on public.clients
for each row execute function public.touch_updated_at();
create trigger client_contacts_touch_updated_at before update on public.client_contacts
for each row execute function public.touch_updated_at();
create trigger services_touch_updated_at before update on public.services
for each row execute function public.touch_updated_at();
create trigger client_services_touch_updated_at before update on public.client_services
for each row execute function public.touch_updated_at();
create trigger contracts_touch_updated_at before update on public.contracts
for each row execute function public.touch_updated_at();
create trigger contract_financials_touch_updated_at before update on public.contract_financials
for each row execute function public.touch_updated_at();
create trigger metrics_touch_updated_at before update on public.metrics
for each row execute function public.touch_updated_at();
create trigger goals_touch_updated_at before update on public.goals
for each row execute function public.touch_updated_at();
create trigger weekly_updates_touch_updated_at before update on public.weekly_updates
for each row execute function public.touch_updated_at();

create or replace function public.sync_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  assigned_role public.app_role;
  display_name text;
begin
  assigned_role := case
    when not exists (select 1 from public.profiles) then 'ADMIN'::public.app_role
    else 'COLLABORATOR'::public.app_role
  end;

  display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, full_name, email, role)
  values (new.id, display_name, new.email, assigned_role)
  on conflict (id) do update
    set email = excluded.email,
        full_name = case
          when public.profiles.full_name = '' then excluded.full_name
          else public.profiles.full_name
        end,
        updated_at = now();

  return new;
end;
$$;

create trigger sync_auth_user_profile_trigger
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.sync_auth_user_profile();

insert into public.profiles (id, full_name, email, role)
select
  existing_user.id,
  coalesce(
    nullif(trim(existing_user.raw_user_meta_data ->> 'full_name'), ''),
    split_part(existing_user.email, '@', 1)
  ),
  existing_user.email,
  case
    when row_number() over (order by existing_user.created_at, existing_user.id) = 1
      then 'ADMIN'::public.app_role
    else 'COLLABORATOR'::public.app_role
  end
from auth.users existing_user
where existing_user.email is not null
on conflict (id) do nothing;

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_id uuid;
begin
  affected_id := case when tg_op = 'DELETE' then old.id else new.id end;

  insert into public.audit_logs (
    actor_user_id,
    entity_type,
    entity_id,
    action,
    old_data,
    new_data
  )
  values (
    auth.uid(),
    tg_table_name,
    affected_id,
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger audit_clients after insert or update or delete on public.clients
for each row execute function public.audit_row_change();
create trigger audit_contracts after insert or update or delete on public.contracts
for each row execute function public.audit_row_change();
create trigger audit_goals after insert or update or delete on public.goals
for each row execute function public.audit_row_change();
create trigger audit_client_members after insert or update or delete on public.client_members
for each row execute function public.audit_row_change();

create or replace function public.audit_contract_financial_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_id uuid;
begin
  affected_id := case when tg_op = 'DELETE' then old.contract_id else new.contract_id end;

  insert into public.audit_logs (
    actor_user_id,
    entity_type,
    entity_id,
    action,
    old_data,
    new_data
  )
  values (
    auth.uid(),
    tg_table_name,
    affected_id,
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger audit_contract_financials
after insert or update or delete on public.contract_financials
for each row execute function public.audit_contract_financial_change();

insert into public.services (name, description, sort_order) values
  ('Social Media', 'Planejamento e gestão de conteúdo para redes sociais.', 10),
  ('Meta Ads', 'Gestão de campanhas no ecossistema Meta.', 20),
  ('Google Ads', 'Gestão de campanhas na plataforma Google Ads.', 30),
  ('Gestão de Tráfego', 'Estratégia e operação integrada de mídia paga.', 40),
  ('Site', 'Criação, evolução e manutenção de sites.', 50),
  ('Landing Page', 'Criação de páginas focadas em conversão.', 60),
  ('Google Meu Negócio', 'Gestão do Google Business Profile.', 70),
  ('SEO', 'Otimização para mecanismos de busca.', 80),
  ('Branding', 'Estratégia e desenvolvimento de marca.', 90),
  ('Automação', 'Automações de processos e marketing.', 100),
  ('IA / Atendimento', 'Agentes de IA e soluções de atendimento.', 110),
  ('E-mail Marketing', 'Estratégia e operação de e-mail marketing.', 120),
  ('Outro', 'Serviço personalizado fora do catálogo principal.', 999)
on conflict (name) do nothing;

insert into public.metric_units (key, name, symbol, format, sort_order) values
  ('number', 'Número', '', 'decimal', 10),
  ('currency_brl', 'Real brasileiro', 'R$', 'currency', 20),
  ('percentage', 'Percentual', '%', 'percentage', 30),
  ('followers', 'Seguidores', '', 'integer', 40),
  ('leads', 'Leads', '', 'integer', 50),
  ('views', 'Visualizações', '', 'integer', 60),
  ('accesses', 'Acessos', '', 'integer', 70)
on conflict (key) do nothing;
