-- Security hardening patch for an existing Supabase project.
-- Run this in the Supabase SQL editor for the active environment.

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('patient', 'doctor', 'admin', 'guest', 'staff', 'lab', 'pharma'));

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_profile_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.prevent_untrusted_profile_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.user_id = auth.uid() AND NEW.role NOT IN ('patient', 'guest') THEN
      RAISE EXCEPTION 'Self-service profile creation is limited to patient and guest roles';
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
    AND OLD.user_id = auth.uid()
    AND public.current_profile_role() <> 'admin'
    AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Only admins can change profile roles';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_role_writes ON profiles;

CREATE TRIGGER enforce_profile_role_writes
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_untrusted_profile_role_changes();

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Clinical staff can read patient profiles" ON profiles;
DROP POLICY IF EXISTS "Dispensing staff can read doctor profiles" ON profiles;
DROP POLICY IF EXISTS "Operations can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role IN ('patient', 'guest'));

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clinical staff can read patient profiles"
  ON profiles FOR SELECT
  USING (
    role = 'patient'
    AND public.current_profile_role() IN ('doctor', 'lab', 'pharma')
  );

CREATE POLICY "Dispensing staff can read doctor profiles"
  ON profiles FOR SELECT
  USING (
    role = 'doctor'
    AND public.current_profile_role() IN ('lab', 'pharma')
  );

CREATE POLICY "Operations can read all profiles"
  ON profiles FOR SELECT
  USING (public.current_profile_role() IN ('admin', 'staff'));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND role = public.current_profile_role()
  );

CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  USING (public.current_profile_role() = 'admin')
  WITH CHECK (public.current_profile_role() = 'admin');

DROP POLICY IF EXISTS "Anyone can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert own audit logs" ON audit_logs;

CREATE POLICY "Authenticated users can insert own audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND COALESCE(actor_user_id, auth.uid()) = auth.uid()
    AND COALESCE(actor_role, public.current_profile_role()) = public.current_profile_role()
  );