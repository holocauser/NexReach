-- Migration: Add events table

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  title text not null,
  description text,
  location text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists idx_events_user_id on public.events(user_id);
create index if not exists idx_events_start_time on public.events(start_time);

alter table public.events enable row level security;
drop policy if exists "Users can access their events" on public.events;
create policy "Users can access their events"
  on public.events
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id); 