-- Seed Doctors Data
-- Run this after creating profiles for doctor users
-- This script creates sample doctors for testing

-- First, ensure departments exist (run seed-departments.sql first)
-- Then create doctor profiles and doctor records

-- =====================================================
-- SAMPLE DOCTOR DATA (for testing)
-- =====================================================

-- NOTE: Before running this, you need to:
-- 1. Have departments seeded (run seed-departments.sql)
-- 2. Create doctor users via the registration page with role 'doctor'
-- 3. Get the user_id and profile_id for each doctor

-- Example: If you have a doctor user with:
-- user_id = 'abc123...' and profile_id = 'def456...'
-- And Cardiology department_id = 'dept789...'

-- You would run:
-- INSERT INTO doctors (user_id, profile_id, department_id, qualification, experience_years, specialization, bio, consultation_duration, max_patients_per_slot, is_available)
-- VALUES (
--   'abc123...',  -- user_id from auth.users
--   'def456...',  -- profile_id from profiles table
--   'dept789...',  -- department_id from departments table
--   'MBBS, MD Cardiology',
--   10,
--   'Cardiologist',
--   'Experienced cardiologist specializing in heart diseases',
--   20,
--   1,
--   true
-- );

-- =====================================================
-- HELPER QUERIES
-- =====================================================

-- Get all departments with their IDs
-- SELECT id, name FROM departments ORDER BY name;

-- Get all doctor profiles (users with role = 'doctor')
-- SELECT id as profile_id, user_id, full_name, email FROM profiles WHERE role = 'doctor';

-- =====================================================
-- CREATE DOCTOR AVAILABILITY (after creating doctors)
-- =====================================================

-- Example: Set availability for a doctor (Monday to Friday, 9 AM to 5 PM)
-- Replace 'doctor_id_here' with actual doctor ID

-- INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, is_blocked)
-- VALUES 
--   ('doctor_id_here', 1, '09:00', '17:00', false),  -- Monday
--   ('doctor_id_here', 2, '09:00', '17:00', false),  -- Tuesday
--   ('doctor_id_here', 3, '09:00', '17:00', false),  -- Wednesday
--   ('doctor_id_here', 4, '09:00', '17:00', false),  -- Thursday
--   ('doctor_id_here', 5, '09:00', '17:00', false);  -- Friday

-- =====================================================
-- QUICK SETUP: Create a test doctor (if you have the IDs)
-- =====================================================

-- Run this function to automatically create a doctor from an existing profile
-- This is useful for quickly setting up doctors

CREATE OR REPLACE FUNCTION create_doctor_from_profile(
  p_profile_id UUID,
  p_department_name VARCHAR,
  p_qualification VARCHAR DEFAULT 'MBBS',
  p_experience INTEGER DEFAULT 5,
  p_specialization VARCHAR DEFAULT 'General Physician',
  p_duration INTEGER DEFAULT 15
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_dept_id UUID;
  v_doctor_id UUID;
BEGIN
  -- Get user_id from profile
  SELECT user_id INTO v_user_id FROM profiles WHERE id = p_profile_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  -- Get department_id
  SELECT id INTO v_dept_id FROM departments WHERE name = p_department_name;
  
  IF v_dept_id IS NULL THEN
    RAISE EXCEPTION 'Department not found: %', p_department_name;
  END IF;
  
  -- Create doctor
  INSERT INTO doctors (user_id, profile_id, department_id, qualification, experience_years, specialization, consultation_duration, is_available)
  VALUES (v_user_id, p_profile_id, v_dept_id, p_qualification, p_experience, p_specialization, p_duration, true)
  RETURNING id INTO v_doctor_id;
  
  -- Create default availability (Monday to Friday, 9 AM to 5 PM)
  INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, is_blocked)
  VALUES 
    (v_doctor_id, 1, '09:00', '17:00', false),
    (v_doctor_id, 2, '09:00', '17:00', false),
    (v_doctor_id, 3, '09:00', '17:00', false),
    (v_doctor_id, 4, '09:00', '17:00', false),
    (v_doctor_id, 5, '09:00', '17:00', false);
  
  RETURN v_doctor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage example:
-- SELECT create_doctor_from_profile(
--   'profile-uuid-here',
--   'Cardiology',
--   'MBBS, MD Cardiology',
--   10,
--   'Cardiologist',
--   20
-- );
