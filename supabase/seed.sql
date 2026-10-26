-- Demo data for local development and portfolio demos.
-- Every demo account uses the password: password123
--   patient@demo.com, doctor@demo.com, admin@demo.com, lab@demo.com,
--   pharma@demo.com, guest@demo.com, staff@demo.com

-- =====================================================
-- DEMO USERS (one per role)
-- =====================================================
DO $$
DECLARE
  r RECORD;
  uid UUID;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('patient', 'Priya Nair'),
      ('doctor',  'Arjun Sharma'),
      ('admin',   'Asha Admin'),
      ('lab',     'Leena Lab'),
      ('pharma',  'Paresh Pharma'),
      ('guest',   'Gautam Rao'),
      ('staff',   'Sana Staff')
    ) AS t(role, full_name)
  LOOP
    uid := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      r.role || '@demo.com', crypt('password123', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', r.full_name),
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), uid, uid::text,
      jsonb_build_object('sub', uid::text, 'email', r.role || '@demo.com', 'email_verified', true),
      'email', now(), now(), now()
    );

    -- handle_new_user() created a patient profile; assign the real role.
    UPDATE public.profiles SET role = r.role WHERE user_id = uid;
  END LOOP;
END $$;

-- =====================================================
-- DEPARTMENTS
-- =====================================================
INSERT INTO departments (name, description) VALUES
  ('Cardiology', 'Heart and cardiovascular care'),
  ('Dermatology', 'Skin, hair, and nail conditions'),
  ('General Medicine', 'Primary care and general consultations'),
  ('Neurology', 'Brain, spinal cord, and nervous system'),
  ('Orthopedics', 'Bone, joint, and musculoskeletal care'),
  ('Pediatrics', 'Care for infants, children, and adolescents');

-- =====================================================
-- DOCTOR, AVAILABILITY, AND CLINICAL HISTORY
-- =====================================================
DO $$
DECLARE
  doctor_user UUID;
  doctor_profile UUID;
  patient_profile UUID;
  doc_id UUID;
  past_appt UUID;
  record_id UUID;
  rx_id UUID;
  lab_order UUID;
BEGIN
  SELECT user_id, id INTO doctor_user, doctor_profile FROM profiles WHERE email = 'doctor@demo.com';
  SELECT id INTO patient_profile FROM profiles WHERE email = 'patient@demo.com';

  INSERT INTO doctors (user_id, profile_id, department_id, qualification, experience_years,
                       specialization, bio, consultation_duration, max_patients_per_slot)
  VALUES (doctor_user, doctor_profile, (SELECT id FROM departments WHERE name = 'Cardiology'),
          'MBBS, MD Cardiology', 12, 'Cardiologist',
          'Focuses on preventive cardiology and hypertension management.', 15, 1)
  RETURNING id INTO doc_id;

  -- Monday to Saturday, 09:00-17:00
  INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time)
  SELECT doc_id, d, '09:00', '17:00' FROM generate_series(1, 6) AS d;

  -- A completed visit with a record, prescription, lab work, and discharge draft
  INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status, token_number, notes)
  VALUES (patient_profile, doc_id, CURRENT_DATE - 7, '10:00', 'completed', 1, 'Chest discomfort on exertion')
  RETURNING id INTO past_appt;

  INSERT INTO medical_records (patient_id, doctor_id, appointment_id, diagnosis, notes)
  VALUES (patient_profile, doc_id, past_appt, 'Stage 1 hypertension',
          'Advised low-sodium diet and 30 minutes of daily walking.')
  RETURNING id INTO record_id;

  INSERT INTO prescriptions (medical_record_id, patient_id, doctor_id, medicine_name, dosage, frequency, duration)
  VALUES (record_id, patient_profile, doc_id, 'Amlodipine', '5 mg', 'Once daily', '30 days')
  RETURNING id INTO rx_id;

  INSERT INTO pharmacy_dispenses (prescription_id, patient_id, doctor_id, medicine_name, dosage, frequency, duration, quantity)
  VALUES (rx_id, patient_profile, doc_id, 'Amlodipine', '5 mg', 'Once daily', '30 days', 30);

  INSERT INTO lab_test_orders (appointment_id, medical_record_id, patient_id, doctor_id, test_name, instructions, status)
  VALUES (past_appt, record_id, patient_profile, doc_id, 'Lipid Profile', 'Fasting for 10 hours', 'reported')
  RETURNING id INTO lab_order;

  INSERT INTO lab_reports (order_id, patient_id, doctor_id, report_title, report_text)
  VALUES (lab_order, patient_profile, doc_id, 'Lipid Profile',
          'Total cholesterol 212 mg/dL, LDL 138 mg/dL, HDL 44 mg/dL, triglycerides 160 mg/dL.');

  INSERT INTO lab_test_orders (appointment_id, medical_record_id, patient_id, doctor_id, test_name, instructions, status)
  VALUES (past_appt, record_id, patient_profile, doc_id, 'ECG', 'Resting 12-lead ECG', 'ordered');

  INSERT INTO discharge_summaries (appointment_id, patient_id, doctor_id, summary_text)
  VALUES (past_appt, patient_profile, doc_id,
          'Patient reviewed for exertional chest discomfort. Started on Amlodipine 5 mg. Review in 4 weeks.');

  -- Today's queue
  INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status, token_number, notes)
  VALUES (patient_profile, doc_id, CURRENT_DATE, '11:00', 'confirmed', 1, 'Follow-up blood pressure check');
END $$;

-- =====================================================
-- HOSPITALITY
-- =====================================================
INSERT INTO room_types (name, description, capacity, base_rate) VALUES
  ('Deluxe Suite', 'Spacious suite with city view', 2, 240.00),
  ('Executive King', 'Premium king room with lounge access', 2, 180.00),
  ('Garden Villa', 'Private villa with garden access', 4, 420.00);

INSERT INTO rooms (room_number, floor, room_type_id, status) VALUES
  ('118', 1, (SELECT id FROM room_types WHERE name = 'Executive King'), 'ready'),
  ('204', 2, (SELECT id FROM room_types WHERE name = 'Executive King'), 'cleaning'),
  ('305', 3, (SELECT id FROM room_types WHERE name = 'Deluxe Suite'), 'ready'),
  ('402', 4, (SELECT id FROM room_types WHERE name = 'Deluxe Suite'), 'ready'),
  ('418', 4, (SELECT id FROM room_types WHERE name = 'Deluxe Suite'), 'maintenance'),
  ('512', 5, (SELECT id FROM room_types WHERE name = 'Executive King'), 'ready'),
  ('801', 8, (SELECT id FROM room_types WHERE name = 'Garden Villa'), 'ready'),
  ('912', 9, (SELECT id FROM room_types WHERE name = 'Garden Villa'), 'out_of_service');

INSERT INTO reservations (reservation_code, guest_profile_id, last_name, arrival_date, departure_date,
                          room_type_id, status, early_check_in, preference_notes)
SELECT code, p.id, 'Rao', arrival, departure, (SELECT id FROM room_types WHERE name = rt), st, early, notes
FROM profiles p,
  (VALUES
    ('AR-2391', CURRENT_DATE, CURRENT_DATE + 2, 'Deluxe Suite', 'confirmed', true, 'Quiet room, extra pillows'),
    ('AR-4530', CURRENT_DATE, CURRENT_DATE + 3, 'Executive King', 'pending', false, 'Late arrival after 10 PM'),
    ('AR-7812', CURRENT_DATE + 1, CURRENT_DATE + 4, 'Garden Villa', 'pending', false, NULL)
  ) AS v(code, arrival, departure, rt, st, early, notes)
WHERE p.email = 'guest@demo.com';
