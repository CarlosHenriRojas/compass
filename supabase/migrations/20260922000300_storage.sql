insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'documents',
    'documents',
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
  ),
  (
    'client-assets',
    'client-assets',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.storage_client_id(object_name text)
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

revoke all on function public.storage_client_id(text) from public;
grant execute on function public.storage_client_id(text) to authenticated;

create policy documents_storage_select
on storage.objects for select
to authenticated
using (
  bucket_id = 'documents'
  and public.is_active_user()
  and exists (
    select 1
    from public.documents d
    where d.storage_bucket = bucket_id
      and d.storage_path = name
      and (d.category <> 'CONTRACT' or public.is_admin())
  )
);

create policy documents_storage_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'documents'
  and public.storage_client_id(name) is not null
  and (
    public.is_admin()
    or (
      coalesce((storage.foldername(name))[2], '') <> 'contracts'
      and public.is_client_member(public.storage_client_id(name))
    )
  )
);

create policy documents_storage_update
on storage.objects for update
to authenticated
using (
  bucket_id = 'documents'
  and public.storage_client_id(name) is not null
  and (
    public.is_admin()
    or (
      coalesce((storage.foldername(name))[2], '') <> 'contracts'
      and public.is_client_member(public.storage_client_id(name))
    )
  )
)
with check (
  bucket_id = 'documents'
  and public.storage_client_id(name) is not null
  and (
    public.is_admin()
    or (
      coalesce((storage.foldername(name))[2], '') <> 'contracts'
      and public.is_client_member(public.storage_client_id(name))
    )
  )
);

create policy documents_storage_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'documents'
  and (
    public.is_admin()
    or (
      public.storage_client_id(name) is not null
      and coalesce((storage.foldername(name))[2], '') <> 'contracts'
      and public.is_client_member(public.storage_client_id(name))
    )
  )
);

create policy client_assets_storage_select
on storage.objects for select
to authenticated
using (
  bucket_id = 'client-assets'
  and public.is_active_user()
);

create policy client_assets_storage_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'client-assets'
  and public.is_admin()
);

create policy client_assets_storage_update
on storage.objects for update
to authenticated
using (bucket_id = 'client-assets' and public.is_admin())
with check (bucket_id = 'client-assets' and public.is_admin());

create policy client_assets_storage_delete
on storage.objects for delete
to authenticated
using (bucket_id = 'client-assets' and public.is_admin());
