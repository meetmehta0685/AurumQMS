-- Fix existing profile issues causing login errors like:
-- "Cannot coerce the result to a single JSON object"
-- Run in Supabase SQL Editor once.

-- 1) Ensure role constraint supports lab/pharma
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('patient', 'doctor', 'admin', 'guest', 'staff', 'lab', 'pharma'));

-- 2) Ensure user_id exists and is populated where possible
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS user_id UUID;

UPDATE profiles p
SET user_id = p.id
WHERE p.user_id IS NULL
  AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);

-- 3) Remove duplicate profiles for same user_id (keep earliest)
DELETE FROM profiles p
USING profiles p2
WHERE p.user_id IS NOT NULL
  AND p2.user_id IS NOT NULL
  AND p.user_id = p2.user_id
  AND p.created_at > p2.created_at;

-- 4) Add uniqueness/index on user_id
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique
  ON profiles(user_id)
  WHERE user_id IS NOT NULL;

-- 5) Ensure FK exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_fkey'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Verification
SELECT user_id, COUNT(*)
FROM profiles
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1;
