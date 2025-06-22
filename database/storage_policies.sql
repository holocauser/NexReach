-- Storage bucket setup for ScanCard app
-- This file should be run with proper permissions (service_role key or through Supabase dashboard)

-- Create storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('files', 'files', true)
on conflict (id) do nothing;

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Storage policies for authenticated users
drop policy if exists "Authenticated users can upload files" on storage.objects;
create policy "Authenticated users can upload files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'files' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Authenticated users can view their files" on storage.objects;
create policy "Authenticated users can view their files"
on storage.objects for select
to authenticated
using (bucket_id = 'files' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Authenticated users can update their files" on storage.objects;
create policy "Authenticated users can update their files"
on storage.objects for update
to authenticated
using (bucket_id = 'files' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Authenticated users can delete their files" on storage.objects;
create policy "Authenticated users can delete their files"
on storage.objects for delete
to authenticated
using (bucket_id = 'files' and auth.uid()::text = (storage.foldername(name))[1]); 