-- Ensure notifications table exists
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text not null check (type in ('like', 'comment', 'validation', 'message')),
  content text not null,
  related_id uuid,
  read boolean default false,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table notifications enable row level security;

-- Drop existing policies to ensure clean state
drop policy if exists "Users can view their own notifications" on notifications;
drop policy if exists "Users can update their own notifications" on notifications;
drop policy if exists "Users can create notifications" on notifications;

-- Create Policies

-- 1. View: Users can view their own notifications
create policy "Users can view their own notifications" on notifications
  for select using (auth.uid() = user_id);

-- 2. Update: Users can mark their own notifications as read
create policy "Users can update their own notifications" on notifications
  for update using (auth.uid() = user_id);

-- 3. Insert: Any authenticated user can create a notification (needed for actions.ts)
create policy "Users can create notifications" on notifications
  for insert with check (auth.role() = 'authenticated');
