/*
  # Configure storage policies for avatars

  1. Security
    - Allow authenticated users to upload their own avatars
    - Allow public read access to avatars
    - Allow users to update and delete their own avatars
*/

-- Policies for objects in the 'avatars' bucket
CREATE POLICY "Avatar uploads require authentication"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = SPLIT_PART(name, '/', 1)
);

CREATE POLICY "Users can update own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = SPLIT_PART(name, '/', 1)
)
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = SPLIT_PART(name, '/', 1)
);

CREATE POLICY "Users can delete own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = SPLIT_PART(name, '/', 1)
);

CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');