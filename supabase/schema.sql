-- Hospital Management System Database Schema
-- Run this SQL in Supabase SQL Editor to create all tables

-- =====================================================
-- PROFILES TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

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
DROP POLICY IF EXISTS "Admins can read audit logs" ON audit_logs;

CREATE POLICY "Anyone can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

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
