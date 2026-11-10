-- Run this once in Supabase SQL Editor.
create table if not exists public.wash_status (
  id integer primary key check (id = 1),
  box1_busy boolean not null default false,
  box2_busy boolean not null default false,
  queue_enabled boolean not null default false,
  queue_count integer not null default 0 check (queue_count >= 0),
  note text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.wash_status (id)
values (1)
on conflict (id) do nothing;

-- The service-role key is used only on the server. Do not expose it in frontend code.
alter table public.wash_status enable row level security;
