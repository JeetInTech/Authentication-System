/*
  # Add username and display name fields to profiles

  1. Changes
    - Add username column (unique)
    - Add display_name column
    - Add constraints for username format
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS display_name text;

-- Add constraint for username format (alphanumeric and underscores only, 3-30 chars)
ALTER TABLE profiles 
ADD CONSTRAINT username_format 
CHECK (username ~* '^[a-zA-Z0-9_]{3,30}$');

-- Update existing policies to include new fields
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Update the handle_new_user function to include default values for new fields
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email,
    username,
    display_name
  )
  VALUES (
    new.id, 
    new.email,
    LOWER(SPLIT_PART(new.email, '@', 1)), -- Default username from email
    SPLIT_PART(new.email, '@', 1) -- Default display name from email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;