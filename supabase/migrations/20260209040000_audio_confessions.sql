-- 1. Alter Confessions Table
ALTER TABLE confessions 
ADD COLUMN audio_url TEXT,
ADD COLUMN audio_duration INTEGER,
ADD COLUMN confession_type TEXT DEFAULT 'text' CHECK (confession_type IN ('text', 'audio'));

-- 2. Create Storage Bucket for Audio
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio-confessions', 'audio-confessions', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies (RLS)
-- Allow authenticated users to upload their own audio
CREATE POLICY "Confessions Audio Insert" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'audio-confessions' AND auth.uid() = owner);

-- Allow public access to read audio files (for feed playback)
CREATE POLICY "Confessions Audio Select" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'audio-confessions');
