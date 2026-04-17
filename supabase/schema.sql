-- Hospital Management System Database Schema
-- Run this SQL in Supabase SQL Editor to create all tables

-- =====================================================
-- PROFILES TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin', 'guest', 'staff', 'lab', 'pharma')),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backward compatibility for existing databases where `profiles` was created
-- without `user_id`.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS user_id UUID;

UPDATE profiles p
SET user_id = p.id
WHERE p.user_id IS NULL
  AND EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = p.id
  );

CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique
  ON profiles(user_id)
  WHERE user_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_user_id_fkey'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

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

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
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

-- =====================================================
-- DEPARTMENTS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read departments" ON departments;

CREATE POLICY "Anyone can read departments"
  ON departments FOR SELECT
  USING (true);

-- =====================================================
-- DOCTORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id),
  qualification VARCHAR(255) NOT NULL,
  experience_years INTEGER NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  bio TEXT,
  consultation_duration INTEGER NOT NULL DEFAULT 15,
  max_patients_per_slot INTEGER NOT NULL DEFAULT 1,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read doctors" ON doctors;
DROP POLICY IF EXISTS "Doctors can update own profile" ON doctors;
DROP POLICY IF EXISTS "Admins can manage doctors" ON doctors;

CREATE POLICY "Anyone can read doctors"
  ON doctors FOR SELECT
  USING (true);

CREATE POLICY "Doctors can update own profile"
  ON doctors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage doctors"
  ON doctors FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- DOCTOR AVAILABILITY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_blocked BOOLEAN DEFAULT false,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(doctor_id, day_of_week)
);

ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read availability" ON doctor_availability;
DROP POLICY IF EXISTS "Doctors can manage own availability" ON doctor_availability;
DROP POLICY IF EXISTS "Admins can manage all availability" ON doctor_availability;

CREATE POLICY "Anyone can read availability"
  ON doctor_availability FOR SELECT
  USING (true);

CREATE POLICY "Doctors can manage own availability"
  ON doctor_availability FOR ALL
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all availability"
  ON doctor_availability FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- APPOINTMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  token_number INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(doctor_id, appointment_date, appointment_time)
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can read own appointments" ON appointments;
DROP POLICY IF EXISTS "Patients can create appointments" ON appointments;
DROP POLICY IF EXISTS "Patients can update own appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors can read their appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors can update their appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON appointments;

CREATE POLICY "Patients can read own appointments"
  ON appointments FOR SELECT
  USING (patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Patients can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Patients can update own appointments"
  ON appointments FOR UPDATE
  USING (patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can read their appointments"
  ON appointments FOR SELECT
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can update their appointments"
  ON appointments FOR UPDATE
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all appointments"
  ON appointments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- MEDICAL RECORDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  appointment_id UUID REFERENCES appointments(id),
  diagnosis TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can read own records" ON medical_records;
DROP POLICY IF EXISTS "Doctors can create and read records" ON medical_records;

CREATE POLICY "Patients can read own records"
  ON medical_records FOR SELECT
  USING (patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can create and read records"
  ON medical_records FOR ALL
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- =====================================================
-- PRESCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  medicine_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(255) NOT NULL,
  duration VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can read own prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Doctors can manage own prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Admins can manage prescriptions" ON prescriptions;

CREATE POLICY "Patients can read own prescriptions"
  ON prescriptions FOR SELECT
  USING (patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can manage own prescriptions"
  ON prescriptions FOR ALL
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage prescriptions"
  ON prescriptions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- TOKENS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  token_number INTEGER NOT NULL,
  token_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'waiting' 
    CHECK (status IN ('waiting', 'called', 'completed', 'no_show')),
  called_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(doctor_id, token_date, token_number)
);

ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read tokens" ON tokens;
DROP POLICY IF EXISTS "Doctors can manage own tokens" ON tokens;

CREATE POLICY "Anyone can read tokens"
  ON tokens FOR SELECT
  USING (true);

CREATE POLICY "Doctors can manage own tokens"
  ON tokens FOR ALL
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- =====================================================
-- RESOURCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('provider', 'room', 'device')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity >= 1),
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read resources" ON resources;
DROP POLICY IF EXISTS "Admins can manage resources" ON resources;

CREATE POLICY "Anyone can read resources"
  ON resources FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage resources"
  ON resources FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- SCHEDULE TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration INTEGER NOT NULL DEFAULT 15 CHECK (slot_duration > 0),
  max_overbook INTEGER NOT NULL DEFAULT 0 CHECK (max_overbook >= 0),
  modality VARCHAR(20) NOT NULL DEFAULT 'in_person' CHECK (modality IN ('in_person', 'telehealth', 'hybrid')),
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(resource_id, day_of_week)
);

ALTER TABLE schedule_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read schedule templates" ON schedule_templates;
DROP POLICY IF EXISTS "Admins can manage schedule templates" ON schedule_templates;

CREATE POLICY "Anyone can read schedule templates"
  ON schedule_templates FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage schedule templates"
  ON schedule_templates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- APPOINTMENT ENHANCEMENTS
-- =====================================================
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS modality VARCHAR(20) NOT NULL DEFAULT 'in_person' CHECK (modality IN ('in_person', 'telehealth', 'hybrid')),
  ADD COLUMN IF NOT EXISTS location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS overbooked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS no_show_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS sla_target_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS device_id UUID REFERENCES resources(id) ON DELETE SET NULL;

-- =====================================================
-- APPOINTMENT RESOURCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS appointment_resources (
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  PRIMARY KEY (appointment_id, resource_id)
);

ALTER TABLE appointment_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can read appointment resources" ON appointment_resources;
DROP POLICY IF EXISTS "Doctors can read appointment resources" ON appointment_resources;
DROP POLICY IF EXISTS "Admins can manage appointment resources" ON appointment_resources;

CREATE POLICY "Patients can read appointment resources"
  ON appointment_resources FOR SELECT
  USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Doctors can read appointment resources"
  ON appointment_resources FOR SELECT
  USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage appointment resources"
  ON appointment_resources FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- WAITLIST TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  preferred_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  preferred_location VARCHAR(255),
  preferred_modality VARCHAR(20) NOT NULL DEFAULT 'in_person' CHECK (preferred_modality IN ('in_person', 'telehealth', 'hybrid')),
  desired_date_from DATE NOT NULL,
  desired_date_to DATE NOT NULL,
  priority SMALLINT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'offered', 'booked', 'expired', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can manage own waitlist entries" ON waitlist_entries;
DROP POLICY IF EXISTS "Doctors can view waitlist entries" ON waitlist_entries;
DROP POLICY IF EXISTS "Admins can manage waitlist entries" ON waitlist_entries;

CREATE POLICY "Patients can manage own waitlist entries"
  ON waitlist_entries FOR ALL
  USING (patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can view waitlist entries"
  ON waitlist_entries FOR SELECT
  USING (
    preferred_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    OR preferred_department_id IN (
      SELECT department_id FROM doctors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage waitlist entries"
  ON waitlist_entries FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- QUEUE ENTRIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS queue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  location VARCHAR(255),
  position INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'completed', 'no_show')),
  wait_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_alerted_at TIMESTAMP,
  alerts_fired TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can read own queue entries" ON queue_entries;
DROP POLICY IF EXISTS "Doctors can read queue entries" ON queue_entries;
DROP POLICY IF EXISTS "Admins can manage queue entries" ON queue_entries;

CREATE POLICY "Patients can read own queue entries"
  ON queue_entries FOR SELECT
  USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Doctors can read queue entries"
  ON queue_entries FOR SELECT
  USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage queue entries"
  ON queue_entries FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- CONSENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  consent_type VARCHAR(50) NOT NULL,
  version VARCHAR(50) NOT NULL DEFAULT 'v1',
  document_url TEXT,
  signed_at TIMESTAMP,
  signed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  justification TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can manage own consents" ON consents;
DROP POLICY IF EXISTS "Doctors can view appointment consents" ON consents;
DROP POLICY IF EXISTS "Admins can manage consents" ON consents;

CREATE POLICY "Patients can manage own consents"
  ON consents FOR ALL
  USING (patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can view appointment consents"
  ON consents FOR SELECT
  USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage consents"
  ON consents FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- PATIENT DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  document_type VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  checksum TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can manage own documents" ON patient_documents;
DROP POLICY IF EXISTS "Admins can manage patient documents" ON patient_documents;

CREATE POLICY "Patients can manage own documents"
  ON patient_documents FOR ALL
  USING (patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage patient documents"
  ON patient_documents FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- TELEHEALTH SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS telehealth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  room_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'active', 'ended', 'cancelled')),
  consent_id UUID REFERENCES consents(id) ON DELETE SET NULL,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE telehealth_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can read own telehealth sessions" ON telehealth_sessions;
DROP POLICY IF EXISTS "Doctors can read telehealth sessions" ON telehealth_sessions;
DROP POLICY IF EXISTS "Admins can manage telehealth sessions" ON telehealth_sessions;

CREATE POLICY "Patients can read own telehealth sessions"
  ON telehealth_sessions FOR SELECT
  USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Doctors can read telehealth sessions"
  ON telehealth_sessions FOR SELECT
  USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage telehealth sessions"
  ON telehealth_sessions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'captured', 'failed', 'refunded')),
  txn_ref VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can read own payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage payments" ON payments;

CREATE POLICY "Patients can read own payments"
  ON payments FOR SELECT
  USING (patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage payments"
  ON payments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- LAB TEST ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lab_test_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  medical_record_id UUID REFERENCES medical_records(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  test_name VARCHAR(255) NOT NULL,
  instructions TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'ordered'
    CHECK (status IN ('ordered', 'sample_collected', 'processing', 'reported', 'cancelled')),
  ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE lab_test_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can read own lab orders" ON lab_test_orders;
DROP POLICY IF EXISTS "Doctors can manage own lab orders" ON lab_test_orders;
DROP POLICY IF EXISTS "Admins can manage lab orders" ON lab_test_orders;
DROP POLICY IF EXISTS "Lab staff can manage lab orders" ON lab_test_orders;

CREATE POLICY "Patients can read own lab orders"
  ON lab_test_orders FOR SELECT
  USING (patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can manage own lab orders"
  ON lab_test_orders FOR ALL
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Lab staff can manage lab orders"
  ON lab_test_orders FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'lab')
  );

CREATE POLICY "Admins can manage lab orders"
  ON lab_test_orders FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- LAB REPORTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lab_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES lab_test_orders(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  report_title VARCHAR(255) NOT NULL,
  report_url TEXT,
  report_text TEXT,
  reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE lab_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can read own lab reports" ON lab_reports;
DROP POLICY IF EXISTS "Doctors can manage own lab reports" ON lab_reports;
DROP POLICY IF EXISTS "Admins can manage lab reports" ON lab_reports;
DROP POLICY IF EXISTS "Doctors can read own lab reports" ON lab_reports;
DROP POLICY IF EXISTS "Lab staff can manage lab reports" ON lab_reports;

CREATE POLICY "Patients can read own lab reports"
  ON lab_reports FOR SELECT
  USING (patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can read own lab reports"
  ON lab_reports FOR SELECT
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Lab staff can manage lab reports"
  ON lab_reports FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'lab')
  );

CREATE POLICY "Admins can manage lab reports"
  ON lab_reports FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- PHARMACY DISPENSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS pharmacy_dispenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  medicine_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(255) NOT NULL,
  duration VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  dispense_status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (dispense_status IN ('pending', 'dispensed', 'cancelled')),
  dispensed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE pharmacy_dispenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can read own pharmacy dispenses" ON pharmacy_dispenses;
DROP POLICY IF EXISTS "Doctors can manage own pharmacy dispenses" ON pharmacy_dispenses;
DROP POLICY IF EXISTS "Admins can manage pharmacy dispenses" ON pharmacy_dispenses;
DROP POLICY IF EXISTS "Pharma staff can manage pharmacy dispenses" ON pharmacy_dispenses;

CREATE POLICY "Patients can read own pharmacy dispenses"
  ON pharmacy_dispenses FOR SELECT
  USING (patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Pharma staff can manage pharmacy dispenses"
  ON pharmacy_dispenses FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'pharma')
  );

CREATE POLICY "Admins can manage pharmacy dispenses"
  ON pharmacy_dispenses FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- DISCHARGE SUMMARIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS discharge_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  summary_text TEXT,
  discharge_status VARCHAR(30) NOT NULL DEFAULT 'draft'
    CHECK (discharge_status IN ('draft', 'discharged')),
  discharged_at TIMESTAMP,
  generated_pdf_url TEXT,
  generated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE discharge_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can read own discharge summaries" ON discharge_summaries;
DROP POLICY IF EXISTS "Doctors can manage own discharge summaries" ON discharge_summaries;
DROP POLICY IF EXISTS "Admins can manage discharge summaries" ON discharge_summaries;

CREATE POLICY "Patients can read own discharge summaries"
  ON discharge_summaries FOR SELECT
  USING (patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can manage own discharge summaries"
  ON discharge_summaries FOR ALL
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage discharge summaries"
  ON discharge_summaries FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID,
  actor_role VARCHAR(20),
  action VARCHAR(255) NOT NULL,
  subject_type VARCHAR(100) NOT NULL,
  subject_id UUID,
  attributes JSONB,
  justification TEXT,
  hash_prev TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can read audit logs" ON audit_logs;

CREATE POLICY "Authenticated users can insert own audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND COALESCE(actor_user_id, auth.uid()) = auth.uid()
    AND COALESCE(actor_role, public.current_profile_role()) = public.current_profile_role()
  );

CREATE POLICY "Admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- VERIFY TABLES CREATED
-- =====================================================
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
