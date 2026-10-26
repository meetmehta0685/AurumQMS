-- Clinical schema: profiles, departments, doctors, appointments, records, lab, pharmacy, discharge

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE profiles (
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

CREATE TRIGGER enforce_profile_role_writes
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_untrusted_profile_role_changes();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

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

-- DEPARTMENTS TABLE
-- =====================================================
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read departments"
  ON departments FOR SELECT
  USING (true);

-- =====================================================
-- DOCTORS TABLE
-- =====================================================
CREATE TABLE doctors (
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
CREATE TABLE doctor_availability (
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
CREATE TABLE appointments (
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
CREATE TABLE medical_records (
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

CREATE POLICY "Patients can read own records"
  ON medical_records FOR SELECT
  USING (patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can create and read records"
  ON medical_records FOR ALL
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- =====================================================
-- PRESCRIPTIONS TABLE
-- =====================================================
CREATE TABLE prescriptions (
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
-- LAB TEST ORDERS TABLE
-- =====================================================
CREATE TABLE lab_test_orders (
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
CREATE TABLE lab_reports (
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
CREATE TABLE pharmacy_dispenses (
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
CREATE TABLE discharge_summaries (
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
