-- 002_rls_policies.sql
-- Row Level Security (RLS) policies for anon, sales, and admin roles

-- Enable RLS on all 7 tables
alter table public.profiles enable row level security;
alter table public.cars enable row level security;
alter table public.car_images enable row level security;
alter table public.car_credit_simulations enable row level security;
alter table public.showroom_settings enable row level security;
alter table public.sales_contacts enable row level security;
alter table public.showroom_faqs enable row level security;

-- Helper function in private schema returning 'admin' | 'sales' | null ONLY when profiles.is_active = true
create schema if not exists private;
grant usage on schema private to anon, authenticated;

create or replace function private.current_staff_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
    and p.is_active = true
  limit 1;
$$;

revoke all on function private.current_staff_role() from public;
grant execute on function private.current_staff_role() to anon, authenticated;

-- ============================================================================
-- 1. profiles
-- - sales: SELECT own profile
-- - admin: SELECT & UPDATE all profiles
-- ============================================================================
drop policy if exists profiles_select_policy on public.profiles;
create policy profiles_select_policy
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or (select private.current_staff_role()) = 'admin'
);

drop policy if exists profiles_update_policy on public.profiles;
create policy profiles_update_policy
on public.profiles
for update
to authenticated
using ((select private.current_staff_role()) = 'admin')
with check ((select private.current_staff_role()) = 'admin');

-- ============================================================================
-- 2. cars
-- - anon: SELECT status in ('ready', 'booked', 'sold')
-- - sales: SELECT all, INSERT, UPDATE (including setting status = 'archived')
-- - admin: Full CRUD (including DELETE permanently)
-- ============================================================================
drop policy if exists cars_select_policy on public.cars;
create policy cars_select_policy
on public.cars
for select
using (
  status in ('ready', 'booked', 'sold')
  or (select private.current_staff_role()) in ('sales', 'admin')
);

drop policy if exists cars_insert_policy on public.cars;
create policy cars_insert_policy
on public.cars
for insert
to authenticated
with check ((select private.current_staff_role()) in ('sales', 'admin'));

drop policy if exists cars_update_policy on public.cars;
create policy cars_update_policy
on public.cars
for update
to authenticated
using ((select private.current_staff_role()) in ('sales', 'admin'))
with check ((select private.current_staff_role()) in ('sales', 'admin'));

drop policy if exists cars_delete_policy on public.cars;
create policy cars_delete_policy
on public.cars
for delete
to authenticated
using ((select private.current_staff_role()) = 'admin');

-- ============================================================================
-- 3. car_images
-- - anon: SELECT when parent car is publicly visible
-- - sales & admin: Full CRUD
-- ============================================================================
drop policy if exists car_images_select_policy on public.car_images;
create policy car_images_select_policy
on public.car_images
for select
using (
  (select private.current_staff_role()) in ('sales', 'admin')
  or exists (
    select 1
    from public.cars c
    where c.id = car_images.car_id
      and c.status in ('ready', 'booked', 'sold')
  )
);

drop policy if exists car_images_insert_policy on public.car_images;
create policy car_images_insert_policy
on public.car_images
for insert
to authenticated
with check ((select private.current_staff_role()) in ('sales', 'admin'));

drop policy if exists car_images_update_policy on public.car_images;
create policy car_images_update_policy
on public.car_images
for update
to authenticated
using ((select private.current_staff_role()) in ('sales', 'admin'))
with check ((select private.current_staff_role()) in ('sales', 'admin'));

drop policy if exists car_images_delete_policy on public.car_images;
create policy car_images_delete_policy
on public.car_images
for delete
to authenticated
using ((select private.current_staff_role()) in ('sales', 'admin'));

-- ============================================================================
-- 4. car_credit_simulations
-- - anon: SELECT when parent car is publicly visible
-- - sales & admin: Full CRUD
-- ============================================================================
drop policy if exists car_credit_simulations_select_policy on public.car_credit_simulations;
create policy car_credit_simulations_select_policy
on public.car_credit_simulations
for select
using (
  (select private.current_staff_role()) in ('sales', 'admin')
  or exists (
    select 1
    from public.cars c
    where c.id = car_credit_simulations.car_id
      and c.status in ('ready', 'booked', 'sold')
  )
);

drop policy if exists car_credit_simulations_insert_policy on public.car_credit_simulations;
create policy car_credit_simulations_insert_policy
on public.car_credit_simulations
for insert
to authenticated
with check ((select private.current_staff_role()) in ('sales', 'admin'));

drop policy if exists car_credit_simulations_update_policy on public.car_credit_simulations;
create policy car_credit_simulations_update_policy
on public.car_credit_simulations
for update
to authenticated
using ((select private.current_staff_role()) in ('sales', 'admin'))
with check ((select private.current_staff_role()) in ('sales', 'admin'));

drop policy if exists car_credit_simulations_delete_policy on public.car_credit_simulations;
create policy car_credit_simulations_delete_policy
on public.car_credit_simulations
for delete
to authenticated
using ((select private.current_staff_role()) in ('sales', 'admin'));

-- ============================================================================
-- 5. showroom_settings
-- - anon & sales: SELECT
-- - admin: Full CRUD
-- ============================================================================
drop policy if exists showroom_settings_select_policy on public.showroom_settings;
create policy showroom_settings_select_policy
on public.showroom_settings
for select
using (true);

drop policy if exists showroom_settings_insert_policy on public.showroom_settings;
create policy showroom_settings_insert_policy
on public.showroom_settings
for insert
to authenticated
with check ((select private.current_staff_role()) = 'admin');

drop policy if exists showroom_settings_update_policy on public.showroom_settings;
create policy showroom_settings_update_policy
on public.showroom_settings
for update
to authenticated
using ((select private.current_staff_role()) = 'admin')
with check ((select private.current_staff_role()) = 'admin');

drop policy if exists showroom_settings_delete_policy on public.showroom_settings;
create policy showroom_settings_delete_policy
on public.showroom_settings
for delete
to authenticated
using ((select private.current_staff_role()) = 'admin');

-- ============================================================================
-- 6. sales_contacts
-- - anon: SELECT is_active = true
-- - sales: SELECT all
-- - admin: Full CRUD
-- ============================================================================
drop policy if exists sales_contacts_select_policy on public.sales_contacts;
create policy sales_contacts_select_policy
on public.sales_contacts
for select
using (
  is_active = true
  or (select private.current_staff_role()) in ('sales', 'admin')
);

drop policy if exists sales_contacts_insert_policy on public.sales_contacts;
create policy sales_contacts_insert_policy
on public.sales_contacts
for insert
to authenticated
with check ((select private.current_staff_role()) = 'admin');

drop policy if exists sales_contacts_update_policy on public.sales_contacts;
create policy sales_contacts_update_policy
on public.sales_contacts
for update
to authenticated
using ((select private.current_staff_role()) = 'admin')
with check ((select private.current_staff_role()) = 'admin');

drop policy if exists sales_contacts_delete_policy on public.sales_contacts;
create policy sales_contacts_delete_policy
on public.sales_contacts
for delete
to authenticated
using ((select private.current_staff_role()) = 'admin');

-- ============================================================================
-- 7. showroom_faqs
-- - anon: SELECT is_published = true
-- - sales & admin: Full CRUD
-- ============================================================================
drop policy if exists showroom_faqs_select_policy on public.showroom_faqs;
create policy showroom_faqs_select_policy
on public.showroom_faqs
for select
using (
  is_published = true
  or (select private.current_staff_role()) in ('sales', 'admin')
);

drop policy if exists showroom_faqs_insert_policy on public.showroom_faqs;
create policy showroom_faqs_insert_policy
on public.showroom_faqs
for insert
to authenticated
with check ((select private.current_staff_role()) in ('sales', 'admin'));

drop policy if exists showroom_faqs_update_policy on public.showroom_faqs;
create policy showroom_faqs_update_policy
on public.showroom_faqs
for update
to authenticated
using ((select private.current_staff_role()) in ('sales', 'admin'))
with check ((select private.current_staff_role()) in ('sales', 'admin'));

drop policy if exists showroom_faqs_delete_policy on public.showroom_faqs;
create policy showroom_faqs_delete_policy
on public.showroom_faqs
for delete
to authenticated
using ((select private.current_staff_role()) in ('sales', 'admin'));
