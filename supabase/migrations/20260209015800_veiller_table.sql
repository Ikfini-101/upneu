create table if not exists veilles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  mask_id uuid references public.masks not null,
  created_at timestamptz default now() not null,
  unique (user_id, mask_id)
);

-- RLS policies
alter table veilles enable row level security;

create policy "Users can view their own veilles" on veilles
  for select using (auth.uid() = user_id);

create policy "Users can create veilles" on veilles
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their veilles" on veilles
  for delete using (auth.uid() = user_id);
