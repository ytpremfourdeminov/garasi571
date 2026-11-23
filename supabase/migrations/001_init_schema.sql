-- 001_init_schema.sql
-- Garasi 571 PostgreSQL schema based on 40-point car listing research standard

create extension if not exists pgcrypto;

-- Generic updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1. Staff Profiles (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'sales' check (role in ('admin', 'sales')),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- Automatically provision inactive sales profile upon auth.users signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'sales',
    false
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- 2. Cars Inventory (40-point research schema + existing CarUnit compatibility)
create table if not exists public.cars (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  status text not null default 'draft' check (status in ('draft', 'ready', 'booked', 'sold', 'archived')),
  is_featured boolean not null default false,
  featured_order int,
  sort_order int not null default 0,
  brand text not null,
  name text not null,
  short_name text not null,
  year text not null,
  year_sort int not null,
  category text not null check (category in ('keluarga', 'harian', 'hobi-eropa')),
  category_label text not null,
  body_type text,
  seat_capacity smallint,
  color text not null,
  interior_color text,
  transmission text not null,
  transmission_group text not null check (transmission_group in ('manual', 'automatic')),
  fuel_type text not null default 'bensin' check (fuel_type in ('bensin', 'diesel', 'hybrid', 'phev', 'ev')),
  engine_cc int,
  drivetrain text,
  mileage_km int,
  mileage_label text not null,
  mileage_verified boolean not null default false,
  mileage_verification_source text,
  location text not null default 'Surakarta, Jawa Tengah',
  cash_price bigint not null,
  credit_price bigint,
  credit_price_note text,
  payment_mode text not null check (payment_mode in ('cash-credit', 'cash-only')),
  offer_badge text,
  trade_in_available boolean not null default false,
  plate_info text not null,
  plate_area_code text,
  plate_odd_even text,
  tax_status text,
  tax_expiry_date date,
  stnk_5yr_expiry_date date,
  estimated_annual_tax bigint,
  ownership_type text,
  ownership_hand smallint,
  stnk_block_free boolean not null default true,
  vin_engine_matched boolean not null default true,
  usage_history text,
  document_checklist jsonb not null default '{}'::jsonb,
  inspection_summary jsonb not null default '{}'::jsonb,
  imperfections jsonb not null default '[]'::jsonb,
  recent_maintenance text[] not null default '{}'::text[],
  warranty_info text,
  mechanic_check_allowed boolean not null default true,
  ev_specs jsonb,
  video_walkaround_url text,
  creator_insights jsonb,
  highlights text[] not null default '{}'::text[],
  conditions text[] not null default '{}'::text[],
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_cars_updated_at on public.cars;
create trigger set_cars_updated_at
before update on public.cars
for each row
execute function public.set_updated_at();

-- 3. Car Images (Cloudflare R2 storage references + angle tags)
create table if not exists public.car_images (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  r2_key text unique not null,
  url text not null,
  width int not null default 1280,
  height int not null default 1280,
  alt text not null,
  angle_tag text not null default 'lainnya' check (
    angle_tag in ('hero', 'eksterior', 'interior', 'odometer', 'mesin', 'dokumen', 'minus', 'lainnya')
  ),
  sort_order int not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

-- 4. Car Credit Simulations
create table if not exists public.car_credit_simulations (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  label text not null,
  provider text,
  dp bigint not null,
  installment bigint,
  installment_label text not null,
  tenor_years smallint not null,
  note text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 5. Showroom Settings (Singleton id = 1)
create table if not exists public.showroom_settings (
  id smallint primary key default 1 check (id = 1),
  name text not null default 'Garasi 571',
  city text not null default 'Surakarta, Jawa Tengah',
  address text not null default 'Surakarta, Jawa Tengah',
  hours text not null default 'Setiap hari, 08:00 - 16:00 WIB',
  maps_url text not null default 'https://maps.app.goo.gl/4wLS9NRMExMHPaXA9',
  maps_embed_url text not null default 'https://maps.google.com/maps?q=-7.5256103,110.818928&z=16&output=embed',
  instagram_handle text not null default '@garasi.571',
  instagram_url text not null default 'https://www.instagram.com/garasi.571/',
  logo_url text not null default '/images/brand/garasi-571-logo.png',
  updated_at timestamptz not null default now()
);

drop trigger if exists set_showroom_settings_updated_at on public.showroom_settings;
create trigger set_showroom_settings_updated_at
before update on public.showroom_settings
for each row
execute function public.set_updated_at();

-- 6. Sales Contacts
create table if not exists public.sales_contacts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  role text not null,
  phone_display text not null,
  phone_e164 text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_sales_contacts_updated_at on public.sales_contacts;
create trigger set_sales_contacts_updated_at
before update on public.sales_contacts
for each row
execute function public.set_updated_at();

-- 7. Showroom FAQs
create table if not exists public.showroom_faqs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  question text not null,
  answer text not null,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_showroom_faqs_updated_at on public.showroom_faqs;
create trigger set_showroom_faqs_updated_at
before update on public.showroom_faqs
for each row
execute function public.set_updated_at();

-- Indexes for catalog filtering, sorting, and foreign keys
create index if not exists idx_cars_status_sort_order
  on public.cars (status, sort_order);

create index if not exists idx_cars_featured_order
  on public.cars (is_featured, featured_order);

create index if not exists idx_cars_created_by
  on public.cars (created_by);

create index if not exists idx_car_images_car_id_sort_order
  on public.car_images (car_id, sort_order);

create index if not exists idx_car_credit_simulations_car_id_sort_order
  on public.car_credit_simulations (car_id, sort_order);

create index if not exists idx_sales_contacts_active_sort_order
  on public.sales_contacts (is_active, sort_order);

create index if not exists idx_showroom_faqs_published_sort_order
  on public.showroom_faqs (is_published, sort_order);
