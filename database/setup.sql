-- Drop existing tables to ensure clean slate
drop table if exists public.voice_notes cascade;
drop table if exists public.files cascade;
drop table if exists public.cards cascade;
drop table if exists public.referrals cascade;
drop table if exists public.profiles cascade;
drop table if exists public.events cascade;

-- Create `profiles` table if it doesn't exist
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create `cards` table for storing business card data
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  title text,
  company text,
  email text,
  phone text,
  phones text[],
  address text,
  addresses text[],
  city text,
  state text,
  zip text,
  latitude numeric,
  longitude numeric,
  tags text[] default '{}',
  notes text,
  profile_image text,
  card_image text,
  favorited boolean default false,
  last_contacted timestamp with time zone,
  specialty text[] default '{}',
  languages text[] default '{}',
  website text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create `files` table for storing file metadata
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references public.cards(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null,
  url text not null,
  size bigint,
  mime_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create `voice_notes` table for storing voice note metadata
create table if not exists public.voice_notes (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references public.cards(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text,
  url text not null,
  duration integer not null default 0,
  size bigint,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create `referrals` table for storing referral data
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  referrer_id uuid references public.cards(id) on delete cascade,
  recipient_id uuid references public.cards(id) on delete cascade,
  date timestamp with time zone not null,
  case_type text not null,
  outcome text not null check (outcome in ('pending', 'successful', 'unsuccessful')),
  value numeric not null default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  -- Ensure at least one of referrer_id or recipient_id is not null
  constraint check_referral_participants check (
    (referrer_id is not null) or (recipient_id is not null)
  )
);

-- Create `events` table for storing event data
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  location text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  image text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create indexes for better performance
create index if not exists idx_cards_user_id on public.cards(user_id);
create index if not exists idx_cards_favorited on public.cards(favorited);
create index if not exists idx_cards_created_at on public.cards(created_at);

create index if not exists idx_files_card_id on public.files(card_id);
create index if not exists idx_files_user_id on public.files(user_id);
create index if not exists idx_files_created_at on public.files(created_at);

create index if not exists idx_voice_notes_card_id on public.voice_notes(card_id);
create index if not exists idx_voice_notes_user_id on public.voice_notes(user_id);
create index if not exists idx_voice_notes_created_at on public.voice_notes(created_at);

create index if not exists idx_referrals_user_id on public.referrals(user_id);
create index if not exists idx_referrals_referrer_id on public.referrals(referrer_id);
create index if not exists idx_referrals_recipient_id on public.referrals(recipient_id);
create index if not exists idx_referrals_date on public.referrals(date);

-- Create indexes for events
create index if not exists idx_events_user_id on public.events(user_id);
create index if not exists idx_events_start_time on public.events(start_time);

-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.cards enable row level security;
alter table public.files enable row level security;
alter table public.voice_notes enable row level security;
alter table public.referrals enable row level security;
alter table public.events enable row level security;

-- Profiles policies
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
with check ((select auth.uid()) = id);

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select
using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using ((select auth.uid()) = id);

-- Cards policies
drop policy if exists "Users can access their cards" on public.cards;
create policy "Users can access their cards"
  on public.cards
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Files policies
drop policy if exists "Users can insert own files" on public.files;
drop policy if exists "Users can view own files" on public.files;
drop policy if exists "Users can update own files" on public.files;
drop policy if exists "Users can delete own files" on public.files;
drop policy if exists "Users can access their files" on public.files;
create policy "Users can access their files"
  on public.files
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Voice notes policies
drop policy if exists "Users can insert own voice notes" on public.voice_notes;
drop policy if exists "Users can view own voice notes" on public.voice_notes;
drop policy if exists "Users can update own voice notes" on public.voice_notes;
drop policy if exists "Users can delete own voice notes" on public.voice_notes;
drop policy if exists "Users can access their voice notes" on public.voice_notes;
create policy "Users can access their voice notes"
  on public.voice_notes
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Referrals policies
drop policy if exists "Users can access their referrals" on public.referrals;
create policy "Users can access their referrals"
  on public.referrals
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Events Policies:
-- 1. All authenticated users can view all events.
drop policy if exists "All authenticated users can view events" on public.events;
create policy "All authenticated users can view events"
  on public.events for select
  to authenticated
  using (true);

-- 2. Users can insert their own events.
drop policy if exists "Users can insert their own events" on public.events;
create policy "Users can insert their own events"
  on public.events for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- 3. Users can update their own events.
drop policy if exists "Users can update their own events" on public.events;
create policy "Users can update their own events"
  on public.events for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 4. Users can delete their own events.
drop policy if exists "Users can delete their own events" on public.events;
create policy "Users can delete their own events"
  on public.events for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.cards TO anon, authenticated;
GRANT ALL ON public.files TO anon, authenticated;
GRANT ALL ON public.voice_notes TO anon, authenticated;
GRANT ALL ON public.referrals TO anon, authenticated;
GRANT ALL ON public.events TO anon, authenticated;

-- Storage bucket setup (run this separately in Supabase dashboard if needed)
-- Note: Storage bucket creation and policies should be set up through the Supabase dashboard
-- or using the Supabase CLI with proper permissions

-- The following storage setup should be done through Supabase dashboard or CLI:
/*
Storage bucket policies (configure in Supabase dashboard):

1. Create bucket named 'files' with public access
2. Enable RLS on the bucket
3. Add policies for authenticated users:
   - INSERT: bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]
   - SELECT: bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]
   - UPDATE: bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]
   - DELETE: bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]
*/ 