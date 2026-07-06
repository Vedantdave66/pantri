-- Pantri v2 migration: user roles (owner/employee), count attribution, discrepancies.
-- Run this in the Supabase SQL editor AFTER schema.sql. Safe to re-run.

-- ---------- profiles ----------

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text not null check (role in ('owner', 'employee')),
  pin text,
  created_at timestamptz default now()
);

-- Employee PINs must be unique so PIN login can resolve to one account.
create unique index if not exists profiles_pin_unique
  on profiles (pin)
  where pin is not null;

alter table profiles enable row level security;

drop policy if exists "Users read their own profile" on profiles;
create policy "Users read their own profile"
  on profiles
  for select
  using (auth.uid() = id);

-- Backfill: every existing auth user (just the owner at this point)
-- becomes an owner profile.
insert into profiles (id, full_name, role)
select id, coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1)), 'owner'
from auth.users
on conflict (id) do nothing;

-- ---------- count_logs additions ----------

alter table count_logs add column if not exists employee_id uuid references profiles on delete set null;
alter table count_logs add column if not exists employee_name text;
alter table count_logs add column if not exists notes text;

-- ---------- items additions ----------

alter table items add column if not exists expected_quantity numeric;
