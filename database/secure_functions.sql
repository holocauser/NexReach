-- This script secures the database functions by setting a fixed search_path.
-- This prevents a class of security vulnerabilities.
-- Run this script in your Supabase SQL Editor to apply the changes.

-- 1. Secure the function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- 2. Secure the function to update the 'updated_at' timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer set search_path = public as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

-- 3. Secure the trigger function that uses handle_updated_at
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer set search_path = public as $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$;

-- Apply the triggers to the tables.
-- It's safe to drop and recreate them.

-- Trigger for new users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Triggers for updated_at column
drop trigger if exists handle_updated_at on public.cards;
create trigger handle_updated_at
  before update on public.cards
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_updated_at on public.files;
create trigger handle_updated_at
  before update on public.files
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_updated_at on public.voice_notes;
create trigger handle_updated_at
  before update on public.voice_notes
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_updated_at on public.referrals;
create trigger handle_updated_at
  before update on public.referrals
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_updated_at on public.events;
create trigger handle_updated_at
  before update on public.events
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_updated_at on public.profiles;
create trigger handle_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- 4. Function to decrement attending_count for events
create or replace function public.decrement_attending_count(event_id uuid)
returns void
language plpgsql
security definer set search_path = public as $$
begin
  update public.events 
  set attending_count = greatest(0, attending_count - 1)
  where id = event_id;
end;
$$; 