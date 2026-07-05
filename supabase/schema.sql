-- Pantri schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists pgcrypto;

-- ---------- items ----------

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  unit text not null,
  current_quantity numeric not null default 0,
  reorder_threshold numeric not null default 1,
  category text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists items_user_id_idx on items (user_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists items_set_updated_at on items;
create trigger items_set_updated_at
  before update on items
  for each row
  execute function set_updated_at();

alter table items enable row level security;

drop policy if exists "Users manage their own items" on items;
create policy "Users manage their own items"
  on items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- count_logs ----------

create table if not exists count_logs (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items not null,
  user_id uuid references auth.users not null,
  previous_quantity numeric,
  new_quantity numeric,
  counted_at timestamptz default now()
);

create index if not exists count_logs_item_id_idx on count_logs (item_id);
create index if not exists count_logs_user_id_idx on count_logs (user_id);

alter table count_logs enable row level security;

drop policy if exists "Users manage their own count logs" on count_logs;
create policy "Users manage their own count logs"
  on count_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
