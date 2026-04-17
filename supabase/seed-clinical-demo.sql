-- Clinical demo seed for Lab + Pharma + Discharge PDF testing
-- Run this in Supabase SQL Editor after schema.sql

-- Bootstrap required clinical tables for environments where schema.sql
-- was not fully applied yet.

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
  v_discharge_id UUID;
BEGIN
  -- Pick one patient and one doctor from existing data
  SELECT id INTO v_patient_id
  FROM profiles
  WHERE role = 'patient'
  ORDER BY created_at
  LIMIT 1;

  SELECT id INTO v_doctor_id
  FROM doctors
  ORDER BY created_at
  LIMIT 1;

  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'No patient profile found. Create at least one patient user first.';
  END IF;

  IF v_doctor_id IS NULL THEN
    RAISE EXCEPTION 'No doctor found. Create at least one doctor first.';
  END IF;

  -- Use an existing appointment if possible; otherwise create/update one completed appointment
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
      '09:00',
      'completed',
      1,
      'Demo appointment for PDF testing'
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
    SET status = 'completed',
        updated_at = CURRENT_TIMESTAMP
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
      'Viral fever with mild dehydration',
      'Advised oral hydration, rest for 3 days, and follow-up if symptoms persist.'
    )
    RETURNING id INTO v_medical_record_id;
  END IF;

  -- Prescription demo row
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
      'Take after food'
    );
  END IF;

  -- Lab test order + report demo rows
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
    )
    RETURNING id INTO v_lab_order_id;
  ELSE
    UPDATE lab_test_orders
    SET status = 'reported',
        updated_at = CURRENT_TIMESTAMP
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
      'Hemoglobin and WBC values within normal range. Mild inflammatory markers noted.'
    );
  END IF;

  -- Pharmacy dispense demo row
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
      'Demo dispense for discharge PDF testing'
    );
  END IF;

  -- Discharge summary row (upsert by unique appointment_id)
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
    'Patient clinically stable at discharge. Continue prescribed medication and hydration. Follow up after 5 days if symptoms persist.',
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
    updated_at = CURRENT_TIMESTAMP
  RETURNING id INTO v_discharge_id;

  RAISE NOTICE 'Demo data ready. appointment_id=% discharge_id=%', v_appointment_id, v_discharge_id;
  RAISE NOTICE 'Open PDF endpoint: /api/discharge/%', v_appointment_id;
END $$;

-- Helpful check query
SELECT
  a.id AS appointment_id,
  a.status AS appointment_status,
  ds.discharge_status,
  ds.generated_at
FROM appointments a
LEFT JOIN discharge_summaries ds ON ds.appointment_id = a.id
ORDER BY a.created_at DESC
LIMIT 5;
