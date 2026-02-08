-- Drop existing policy if any (to avoid conflicts)
drop policy if exists "Enable read access for authenticated users" on "public"."masks";
drop policy if exists "Public profiles are viewable by everyone" on "public"."masks";

-- Create a new, definitely working policy
create policy "Public profiles are viewable by everyone"
on "public"."masks"
for select
to authenticated
using (true);
