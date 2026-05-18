-- Run this in Supabase SQL editor AFTER creating the bucket in the dashboard.
--
-- Step 1: Go to Supabase Dashboard → Storage → New Bucket
--   Name: event-insurance
--   Public bucket: YES (tick the checkbox)
--   Click Create
--
-- Step 2: Run the policies below

CREATE POLICY "anon_upload_event_insurance"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'event-insurance');

CREATE POLICY "public_read_event_insurance"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'event-insurance');

CREATE POLICY "authenticated_all_event_insurance"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'event-insurance')
WITH CHECK (bucket_id = 'event-insurance');
