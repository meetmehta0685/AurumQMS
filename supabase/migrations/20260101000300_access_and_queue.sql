-- Table privileges, missing RLS policies, and server-side queue logic.

-- =====================================================
-- PRIVILEGES (RLS policies decide which rows each role can touch)
-- =====================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON departments, doctors, doctor_availability TO anon;

-- =====================================================
-- MISSING POLICIES
-- =====================================================
-- Doctor names are shown to patients when booking and in the queue.
CREATE POLICY "Authenticated can read doctor profiles"
  ON profiles FOR SELECT
  USING (role = 'doctor' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage departments"
  ON departments FOR ALL
  USING (public.current_profile_role() = 'admin')
  WITH CHECK (public.current_profile_role() = 'admin');

CREATE POLICY "Doctors can manage own pharmacy dispenses"
  ON pharmacy_dispenses FOR ALL
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()))
  WITH CHECK (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can insert own lab reports"
  ON lab_reports FOR INSERT
  WITH CHECK (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- =====================================================
-- SLOTS: a cancelled appointment frees its slot
-- =====================================================
ALTER TABLE appointments
  DROP CONSTRAINT appointments_doctor_id_appointment_date_appointment_time_key;

CREATE UNIQUE INDEX appointments_active_slot_uniq
  ON appointments (doctor_id, appointment_date, appointment_time)
  WHERE status IN ('pending', 'confirmed');

-- =====================================================
-- TOKENS: assigned by the database, sequential per doctor per day
-- =====================================================
CREATE OR REPLACE FUNCTION public.assign_token_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Serialize token allocation for this doctor/day.
  PERFORM pg_advisory_xact_lock(hashtext(NEW.doctor_id::text || NEW.appointment_date::text));

  SELECT COALESCE(MAX(token_number), 0) + 1 INTO NEW.token_number
  FROM appointments
  WHERE doctor_id = NEW.doctor_id AND appointment_date = NEW.appointment_date;

  RETURN NEW;
END;
$$;

CREATE TRIGGER set_token_number
  BEFORE INSERT ON appointments
  FOR EACH ROW EXECUTE FUNCTION public.assign_token_number();

-- =====================================================
-- READ HELPERS: patients can't see other patients' rows, so expose
-- only the anonymous aggregates the booking and queue screens need.
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_booked_times(p_doctor_id UUID, p_date DATE)
RETURNS SETOF TIME
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT appointment_time FROM appointments
  WHERE doctor_id = p_doctor_id
    AND appointment_date = p_date
    AND status IN ('pending', 'confirmed');
$$;

CREATE OR REPLACE FUNCTION public.get_queue(p_doctor_id UUID, p_date DATE)
RETURNS TABLE (token_number INTEGER, status VARCHAR)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.token_number, a.status FROM appointments a
  WHERE a.doctor_id = p_doctor_id
    AND a.appointment_date = p_date
    AND a.status IN ('pending', 'confirmed', 'completed')
  ORDER BY a.token_number;
$$;

REVOKE ALL ON FUNCTION public.get_booked_times(UUID, DATE), public.get_queue(UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booked_times(UUID, DATE), public.get_queue(UUID, DATE) TO authenticated;
