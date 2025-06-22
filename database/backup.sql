-- ScanCard Database Backup
-- Generated on: $(date)
-- This file contains a complete backup of the database schema and data

-- ========================================
-- DATABASE SCHEMA BACKUP
-- ========================================

-- Drop existing tables to ensure clean slate
drop table if exists public.voice_notes cascade;
drop table if exists public.files cascade;
drop table if exists public.cards cascade;
drop table if exists public.referrals cascade;
drop table if exists public.profiles cascade;

-- Create `profiles` table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create `cards` table for storing business card data
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
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
  user_id uuid references auth.users(id) not null,
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
  user_id uuid references auth.users(id) not null,
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
  user_id uuid references auth.users(id) not null,
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

-- ========================================
-- INDEXES BACKUP
-- ========================================

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

-- ========================================
-- ROW LEVEL SECURITY BACKUP
-- ========================================

-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.cards enable row level security;
alter table public.files enable row level security;
alter table public.voice_notes enable row level security;
alter table public.referrals enable row level security;

-- ========================================
-- POLICIES BACKUP
-- ========================================

-- Profiles policies
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id);

-- Cards policies
drop policy if exists "Users can access their cards" on public.cards;
create policy "Users can access their cards"
  on public.cards
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Files policies
drop policy if exists "Users can access their files" on public.files;
create policy "Users can access their files"
  on public.files
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Voice notes policies
drop policy if exists "Users can access their voice notes" on public.voice_notes;
create policy "Users can access their voice notes"
  on public.voice_notes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Referrals policies
drop policy if exists "Users can access their referrals" on public.referrals;
create policy "Users can access their referrals"
  on public.referrals
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ========================================
-- PERMISSIONS BACKUP
-- ========================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.cards TO anon, authenticated;
GRANT ALL ON public.files TO anon, authenticated;
GRANT ALL ON public.voice_notes TO anon, authenticated;
GRANT ALL ON public.referrals TO anon, authenticated;

-- ========================================
-- DATA BACKUP (if any exists)
-- ========================================

-- Note: To backup actual data, you would need to export it separately
-- using pg_dump or Supabase's data export feature

-- Example data export commands (run separately):
-- pg_dump --data-only --table=public.profiles your_database_url > profiles_backup.sql
-- pg_dump --data-only --table=public.cards your_database_url > cards_backup.sql
-- pg_dump --data-only --table=public.files your_database_url > files_backup.sql
-- pg_dump --data-only --table=public.voice_notes your_database_url > voice_notes_backup.sql
-- pg_dump --data-only --table=public.referrals your_database_url > referrals_backup.sql

-- ========================================
-- STORAGE BACKUP REFERENCE
-- ========================================

-- Storage bucket setup is handled separately in storage_policies.sql
-- Make sure to also backup your storage bucket configuration and policies 