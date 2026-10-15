alter table public.contracts
  drop constraint contracts_client_id_fkey;

alter table public.contracts
  add constraint contracts_client_id_fkey
  foreign key (client_id)
  references public.clients (id)
  on delete cascade;
