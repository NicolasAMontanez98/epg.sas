-- Esquema de EPG S.A.S. en Supabase.
-- Ejecútelo una vez en el SQL Editor del proyecto. Se puede repetir sin duplicar nada.
-- Solo el servidor (con la secret key) accede a estas tablas: RLS activo y sin políticas bloquea la API pública.

create table if not exists public.settings (
  id int primary key check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  collection text not null check (collection in ('banners', 'services', 'team', 'dates', 'experience', 'infographics')),
  data jsonb not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists items_collection_order_idx on public.items (collection, created_at, position);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text not null unique,
  role text not null check (role in ('empleado', 'cliente')),
  salt text not null,
  hash text not null,
  created_at timestamptz not null default now()
);

alter table public.settings enable row level security;
alter table public.items enable row level security;
alter table public.users enable row level security;

-- Imágenes del panel (fotos del equipo, infografías): lectura pública, escritura solo desde el servidor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', true, 4194304, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
