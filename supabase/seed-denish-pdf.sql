-- Seed/prepare discharge PDF data for patient: denish
-- Run in Supabase SQL Editor, then use printed appointment_id in:
-- /api/discharge/<appointment_id>

-- Ensure required clinical tables exist (safe if already present)
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

DO $$
DECLARE
  v_patient_id UUID;
  v_doctor_id UUID;
  v_appointment_id UUID;
  v_medical_record_id UUID;
  v_lab_order_id UUID;
BEGIN
  -- Try to find patient by full_name or email containing 'denish'
  SELECT id INTO v_patient_id
  FROM profiles
  WHERE role = 'patient'
    AND (
      lower(full_name) LIKE '%denish%'
      OR lower(email) LIKE '%denish%'
    )
  ORDER BY created_at
  LIMIT 1;

  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Patient ''denish'' not found in profiles. Verify full_name/email and role=patient.';
  END IF;

  -- Choose first available doctor
  SELECT id INTO v_doctor_id
  FROM doctors
  ORDER BY created_at
  LIMIT 1;

  IF v_doctor_id IS NULL THEN
    RAISE EXCEPTION 'No doctor found. Please create at least one doctor first.';
  END IF;

  -- Use latest appointment for this patient+doctor or create one
  SELECT id INTO v_appointment_id
  FROM appointments
  WHERE patient_id = v_patient_id
    AND doctor_id = v_doctor_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_appointment_id IS NULL THEN
    INSERT INTO appointments (
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      status,
      token_number,
      notes
    ) VALUES (
      v_patient_id,
      v_doctor_id,
      CURRENT_DATE,
      '10:00',
      'completed',
      1,
      'Denish demo appointment for discharge PDF'
    )
    ON CONFLICT (doctor_id, appointment_date, appointment_time)
    DO UPDATE SET
      patient_id = EXCLUDED.patient_id,
      status = 'completed',
      notes = EXCLUDED.notes,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_appointment_id;
  ELSE
    UPDATE appointments
    SET status = 'completed', updated_at = CURRENT_TIMESTAMP
    WHERE id = v_appointment_id;
  END IF;

  -- Medical record
  SELECT id INTO v_medical_record_id
  FROM medical_records
  WHERE appointment_id = v_appointment_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_medical_record_id IS NULL THEN
    INSERT INTO medical_records (
      patient_id,
      doctor_id,
      appointment_id,
      diagnosis,
      notes
    ) VALUES (
      v_patient_id,
      v_doctor_id,
      v_appointment_id,
      'Acute viral upper respiratory infection',
      'Hydration, steam inhalation, and symptomatic treatment advised.'
    )
    RETURNING id INTO v_medical_record_id;
  END IF;

  -- Prescription
  IF NOT EXISTS (
    SELECT 1 FROM prescriptions
    WHERE medical_record_id = v_medical_record_id
      AND medicine_name = 'Paracetamol'
  ) THEN
    INSERT INTO prescriptions (
      medical_record_id,
      patient_id,
      doctor_id,
      medicine_name,
      dosage,
      frequency,
      duration,
      notes
    ) VALUES (
      v_medical_record_id,
      v_patient_id,
      v_doctor_id,
      'Paracetamol',
      '500mg',
      'Twice daily',
      '5 days',
      'After meals'
    );
  END IF;

  -- Lab order/report
  SELECT id INTO v_lab_order_id
  FROM lab_test_orders
  WHERE appointment_id = v_appointment_id
    AND test_name = 'Complete Blood Count'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_lab_order_id IS NULL THEN
    INSERT INTO lab_test_orders (
      appointment_id,
      medical_record_id,
      patient_id,
      doctor_id,
      test_name,
      instructions,
      status
    ) VALUES (
      v_appointment_id,
      v_medical_record_id,
      v_patient_id,
      v_doctor_id,
      'Complete Blood Count',
      'No fasting needed',
      'reported'
    ) RETURNING id INTO v_lab_order_id;
  ELSE
    UPDATE lab_test_orders
    SET status = 'reported', updated_at = CURRENT_TIMESTAMP
    WHERE id = v_lab_order_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM lab_reports
    WHERE order_id = v_lab_order_id
      AND report_title = 'CBC Report'
  ) THEN
    INSERT INTO lab_reports (
      order_id,
      patient_id,
      doctor_id,
      report_title,
      report_text
    ) VALUES (
      v_lab_order_id,
      v_patient_id,
      v_doctor_id,
      'CBC Report',
      'CBC parameters within acceptable range. Mild neutrophilia.'
    );
  END IF;

  -- Pharmacy
  IF NOT EXISTS (
    SELECT 1 FROM pharmacy_dispenses
    WHERE patient_id = v_patient_id
      AND doctor_id = v_doctor_id
      AND medicine_name = 'Paracetamol'
  ) THEN
    INSERT INTO pharmacy_dispenses (
      patient_id,
      doctor_id,
      medicine_name,
      dosage,
      frequency,
      duration,
      quantity,
      dispense_status,
      dispensed_at,
      notes
    ) VALUES (
      v_patient_id,
      v_doctor_id,
      'Paracetamol',
      '500mg',
      'Twice daily',
      '5 days',
      10,
      'dispensed',
      CURRENT_TIMESTAMP,
      'Dispensed for denish demo flow'
    );
  END IF;

  -- Discharge summary
  INSERT INTO discharge_summaries (
    appointment_id,
    patient_id,
    doctor_id,
    summary_text,
    discharge_status,
    discharged_at,
    generated_at
  ) VALUES (
    v_appointment_id,
    v_patient_id,
    v_doctor_id,
    'Patient is clinically stable. Continue medicines, hydration, and review if fever persists beyond 3 days.',
    'discharged',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (appointment_id)
  DO UPDATE SET
    summary_text = EXCLUDED.summary_text,
    discharge_status = 'discharged',
    discharged_at = EXCLUDED.discharged_at,
    generated_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP;

  RAISE NOTICE 'Denish PDF ready. appointment_id=%', v_appointment_id;
  RAISE NOTICE 'Open: /api/discharge/%', v_appointment_id;
END $$;

-- Verify output row quickly
SELECT a.id AS appointment_id, a.status, ds.discharge_status
FROM appointments a
JOIN discharge_summaries ds ON ds.appointment_id = a.id
ORDER BY a.updated_at DESC
LIMIT 5;
