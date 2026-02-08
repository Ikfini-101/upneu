-- Create confession_reports table for tracking user reports
create table if not exists confession_reports (
  id uuid default uuid_generate_v4() primary key,
  confession_id uuid references confessions(id) on delete cascade not null,
  reporter_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraint: One report per user per confession
  unique(confession_id, reporter_id)
);

-- Indexes for fast counting and queries
create index if not exists idx_confession_reports_confession_id on confession_reports(confession_id);
create index if not exists idx_confession_reports_reporter_id on confession_reports(reporter_id);

-- Add removed flags to confessions table
alter table confessions add column if not exists removed boolean default false;
alter table confessions add column if not exists removed_reason text;
alter table confessions add column if not exists removed_at timestamp with time zone;

-- Index for filtering active confessions
create index if not exists idx_confessions_removed on confessions(removed) where removed = false;

-- Enable RLS on confession_reports
alter table confession_reports enable row level security;

-- Users can view their own reports
create policy "Users can view their own reports"
  on confession_reports for select
  using (auth.uid() = reporter_id);

-- Users can create reports (but only for non-removed confessions)
create policy "Users can create reports"
  on confession_reports for insert
  with check (
    auth.uid() = reporter_id
    and exists (
      select 1 from confessions 
      where id = confession_id 
      and (removed = false or removed is null)
    )
  );

-- No updates or deletes allowed (reports are permanent)
-- This prevents users from removing their reports

-- Update confessions SELECT policy to exclude removed posts
drop policy if exists "Confessions are public" on confessions;
drop policy if exists "Active confessions are public" on confessions;

create policy "Active confessions are public"
  on confessions for select
  using (removed = false or removed is null);
