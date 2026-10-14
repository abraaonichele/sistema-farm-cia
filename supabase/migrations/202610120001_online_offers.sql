-- Ofertas online: Supabase Auth + Postgres + Storage.
-- Execute este arquivo inteiro uma vez no SQL Editor do projeto Supabase.
-- Ele pode ser executado novamente: tabela, índices, bucket e políticas são recriados/atualizados de forma segura.

create table if not exists public.offers (
  public_id text primary key,
  short_id text not null,
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null default '',
  images jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  active boolean not null default true,
  constraint offers_public_id_format check (public_id ~ '^[a-f0-9]{48}$'),
  constraint offers_short_id_format check (short_id ~ '^[A-Za-z0-9_-]{22}$'),
  constraint offers_title_length check (char_length(title) <= 120),
  constraint offers_images_array check (
    jsonb_typeof(images) = 'array'
    and jsonb_array_length(images) between 1 and 12
  ),
  constraint offers_expiration_after_creation check (expires_at is null or expires_at > created_at)
);

alter table public.offers add column if not exists short_id text;
update public.offers
set short_id = left(
  rtrim(translate(encode(decode(public_id, 'hex'), 'base64'), '+/', '-_'), '='),
  22
)
where short_id is null;
alter table public.offers alter column short_id set not null;

create index if not exists offers_owner_created_idx on public.offers (owner_id, created_at desc);
create index if not exists offers_public_visibility_idx on public.offers (active, expires_at);
create unique index if not exists offers_short_id_uidx on public.offers (short_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'offers_short_id_format'
      and conrelid = 'public.offers'::regclass
  ) then
    alter table public.offers
      add constraint offers_short_id_format check (short_id ~ '^[A-Za-z0-9_-]{22}$');
  end if;
end;
$$;

alter table public.offers enable row level security;
alter table public.offers force row level security;

revoke all on table public.offers from anon, authenticated;
grant select on table public.offers to anon, authenticated;
grant insert (public_id, short_id, owner_id, title, images, expires_at, active) on table public.offers to authenticated;
grant update (title, images, expires_at, active) on table public.offers to authenticated;
grant delete on table public.offers to authenticated;

drop policy if exists "offers_public_read_active" on public.offers;
create policy "offers_public_read_active"
on public.offers
for select
to anon, authenticated
using (active = true and (expires_at is null or expires_at > now()));

drop policy if exists "offers_owner_read" on public.offers;
create policy "offers_owner_read"
on public.offers
for select
to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists "offers_owner_insert" on public.offers;
create policy "offers_owner_insert"
on public.offers
for insert
to authenticated
with check (
  (select auth.uid()) = owner_id
  and short_id ~ '^[A-Za-z0-9_-]{22}$'
  and not exists (
    select 1
    from jsonb_array_elements(images) as image
    where jsonb_typeof(image) <> 'object'
      or (image ->> 'path') is null
      or (image ->> 'path') !~ (
        '^' || owner_id::text || '/' || public_id || '/[0-9]{2}-[a-f0-9]{16}\.(jpg|jpeg|png|webp|gif)$'
      )
      or (image ->> 'order') !~ '^[0-9]{1,2}$'
  )
);

drop policy if exists "offers_owner_update" on public.offers;
create policy "offers_owner_update"
on public.offers
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check (
  (select auth.uid()) = owner_id
  and short_id ~ '^[A-Za-z0-9_-]{22}$'
  and not exists (
    select 1
    from jsonb_array_elements(images) as image
    where jsonb_typeof(image) <> 'object'
      or (image ->> 'path') is null
      or (image ->> 'path') !~ (
        '^' || owner_id::text || '/' || public_id || '/[0-9]{2}-[a-f0-9]{16}\.(jpg|jpeg|png|webp|gif)$'
      )
      or (image ->> 'order') !~ '^[0-9]{1,2}$'
  )
);

drop policy if exists "offers_owner_delete" on public.offers;
create policy "offers_owner_delete"
on public.offers
for delete
to authenticated
using ((select auth.uid()) = owner_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'offer-images',
  'offer-images',
  false,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "offer_images_owner_insert" on storage.objects;
create policy "offer_images_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'offer-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
);

drop policy if exists "offer_images_owner_read" on storage.objects;
create policy "offer_images_owner_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'offer-images'
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "offer_images_public_read_published" on storage.objects;
create policy "offer_images_public_read_published"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'offer-images'
  and exists (
    select 1
    from public.offers as offer
    cross join lateral jsonb_array_elements(offer.images) as image
    where offer.active = true
      and (offer.expires_at is null or offer.expires_at > now())
      and image ->> 'path' = storage.objects.name
  )
);

drop policy if exists "offer_images_owner_update" on storage.objects;
create policy "offer_images_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'offer-images'
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'offer-images'
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "offer_images_owner_delete" on storage.objects;
create policy "offer_images_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'offer-images'
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

notify pgrst, 'reload schema';
