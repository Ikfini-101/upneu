-- Allow authenticated users to view other users' masks (pseudonyms/avatars)
-- This is essential for:
-- 1. Displaying names in the feed
-- 2. Searching users in messaging
-- 3. Displaying conversation partners

create policy "Enable read access for authenticated users"
on "public"."masks"
as permissive
for select
to authenticated
using (true);
