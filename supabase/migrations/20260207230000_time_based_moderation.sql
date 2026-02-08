-- ============================================================
-- COMPLETE TIME-BASED MODERATION SYSTEM
-- Combines confession_reports table creation + 4-tier logic
-- ============================================================

-- ============================================
-- 1. CREATE CONFESSION_REPORTS TABLE
-- ============================================

create table if not exists confession_reports (
  id uuid default uuid_generate_v4() primary key,
  confession_id uuid references confessions(id) on delete cascade not null,
  reporter_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at_ms bigint default extract(epoch from timezone('utc'::text, now())) * 1000 not null,
  
  -- Constraint: One report per user per confession
  unique(confession_id, reporter_id)
);

-- Indexes for fast queries
create index if not exists idx_confession_reports_confession_id 
  on confession_reports(confession_id);
  
create index if not exists idx_confession_reports_reporter_id 
  on confession_reports(reporter_id);
  
create index if not exists idx_confession_reports_time 
  on confession_reports(confession_id, created_at_ms desc);

-- Enable RLS
alter table confession_reports enable row level security;

-- RLS Policies
create policy "Users can view their own reports"
  on confession_reports for select
  using (auth.uid() = reporter_id);

create policy "Users can create reports"
  on confession_reports for insert
  with check (auth.uid() = reporter_id);

-- ============================================
-- 2. CREATE MODERATION STATUS ENUM
-- ============================================

drop type if exists moderation_status cascade;

create type moderation_status as enum (
  'active',
  'hidden_pending_review',         -- R1: 4 reports in 30s
  'removed_high_risk',              -- R2: 10 reports in 5min
  'auto_deleted_mass_reports',      -- R3: 100 reports in 1h
  'auto_deleted_absolute_threshold' -- R4: 1000+ reports total
);

-- ============================================
-- 3. UPDATE CONFESSIONS TABLE
-- ============================================

-- Add new moderation columns
alter table confessions 
  add column if not exists moderation_status moderation_status default 'active';

alter table confessions 
  add column if not exists moderation_triggered_at timestamp with time zone;

alter table confessions 
  add column if not exists moderation_rule varchar(10);

alter table confessions 
  add column if not exists total_reports_at_trigger integer;

-- Index for filtering
create index if not exists idx_confessions_moderation_status 
  on confessions(moderation_status);

-- ============================================
-- 4. CREATE MODERATION_LOGS TABLE
-- ============================================

create table if not exists moderation_logs (
  id uuid default uuid_generate_v4() primary key,
  confession_id uuid references confessions(id) on delete cascade not null,
  triggered_at timestamp with time zone default timezone('utc'::text, now()) not null,
  rule_triggered varchar(10) not null, -- 'R1', 'R2', 'R3', 'R4', 'LEGACY', 'MANUAL_RESTORE'
  status_applied moderation_status not null,
  total_reports integer not null,
  time_window_seconds integer, -- NULL for R4
  metadata jsonb
);

-- Indexes for admin dashboard
create index if not exists idx_moderation_logs_confession 
  on moderation_logs(confession_id);

create index if not exists idx_moderation_logs_triggered_at 
  on moderation_logs(triggered_at desc);

create index if not exists idx_moderation_logs_rule 
  on moderation_logs(rule_triggered);

-- Enable RLS (admin only)
alter table moderation_logs enable row level security;

create policy "Authenticated users can view moderation logs"
  on moderation_logs for select
  using (auth.uid() is not null);

-- ============================================
-- 5. UPDATE CONFESSIONS RLS POLICY
-- ============================================

drop policy if exists "Confessions are public" on confessions;
drop policy if exists "Active confessions are public" on confessions;

create policy "Active confessions are public"
  on confessions for select
  using (moderation_status = 'active' or moderation_status is null);

-- ============================================
-- VERIFICATION (commented out - uncomment to test)
-- ============================================

-- Check tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('confession_reports', 'moderation_logs');

-- Check enum values
-- SELECT enum_range(NULL::moderation_status);

-- Check confession columns
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'confessions' AND column_name LIKE 'moderation%';
