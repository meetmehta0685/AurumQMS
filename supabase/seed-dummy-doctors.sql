-- Dummy Doctor Users for Testing
-- Run this SQL in Supabase SQL Editor
-- This creates dummy doctor users with profiles, doctor records, and availability

-- =====================================================
-- STEP 1: Create auth users for doctors using Supabase Auth API
-- =====================================================
-- NOTE: You need to create users first via Supabase Dashboard or Auth API
-- Go to Authentication > Users > Add User and create these users:
-- Email: dr.sharma@healthcare.com, Password: Doctor123!
-- Email: dr.patel@healthcare.com, Password: Doctor123!
-- Email: dr.kumar@healthcare.com, Password: Doctor123!
-- Email: dr.singh@healthcare.com, Password: Doctor123!
-- Email: dr.wilson@healthcare.com, Password: Doctor123!
-- Email: dr.anderson@healthcare.com, Password: Doctor123!

-- After creating users, run this script to create profiles and doctor records

-- =====================================================
-- ALTERNATIVE: Use this function to create everything at once
-- =====================================================

-- First, let's get department IDs
DO $$
DECLARE
    cardiology_id UUID;
    dermatology_id UUID;
    neurology_id UUID;
    orthopedics_id UUID;
    pediatrics_id UUID;
    general_id UUID;
    
    -- Auth user IDs (these will be created by the auth system)
    user1_id UUID;
    user2_id UUID;
    user3_id UUID;
    user4_id UUID;
    user5_id UUID;
    user6_id UUID;
    
    -- Profile IDs
    profile1_id UUID;
    profile2_id UUID;
    profile3_id UUID;
    profile4_id UUID;
    profile5_id UUID;
    profile6_id UUID;
    
    -- Doctor IDs
    doctor1_id UUID;
    doctor2_id UUID;
    doctor3_id UUID;
    doctor4_id UUID;
    doctor5_id UUID;
    doctor6_id UUID;
BEGIN
    -- Get department IDs
    SELECT id INTO cardiology_id FROM departments WHERE name = 'Cardiology';
    SELECT id INTO dermatology_id FROM departments WHERE name = 'Dermatology';
    SELECT id INTO neurology_id FROM departments WHERE name = 'Neurology';
    SELECT id INTO orthopedics_id FROM departments WHERE name = 'Orthopedics';
    SELECT id INTO pediatrics_id FROM departments WHERE name = 'Pediatrics';
    SELECT id INTO general_id FROM departments WHERE name = 'General Medicine';
    
    RAISE NOTICE 'Department IDs found: Cardiology=%, Neurology=%, General=%', cardiology_id, neurology_id, general_id;
END $$;

-- =====================================================
-- STEP 2: If you already created auth users, get their IDs and run this:
-- =====================================================

-- Query to find your doctor auth users:
-- SELECT id, email FROM auth.users WHERE email LIKE 'dr.%';

-- =====================================================
-- MANUAL INSERT TEMPLATE (Replace UUIDs with actual values)
-- =====================================================

-- Replace 'YOUR_USER_ID_HERE' with actual user IDs from auth.users table
-- Replace 'YOUR_DEPT_ID_HERE' with actual department IDs

/*
-- Create profiles for doctors
INSERT INTO profiles (user_id, role, full_name, email, phone) VALUES
('YOUR_USER_ID_1', 'doctor', 'Dr. Rajesh Sharma', 'dr.sharma@healthcare.com', '+91-9876543210'),
('YOUR_USER_ID_2', 'doctor', 'Dr. Priya Patel', 'dr.patel@healthcare.com', '+91-9876543211'),
('YOUR_USER_ID_3', 'doctor', 'Dr. Amit Kumar', 'dr.kumar@healthcare.com', '+91-9876543212'),
('YOUR_USER_ID_4', 'doctor', 'Dr. Neha Singh', 'dr.singh@healthcare.com', '+91-9876543213'),
('YOUR_USER_ID_5', 'doctor', 'Dr. John Wilson', 'dr.wilson@healthcare.com', '+91-9876543214'),
('YOUR_USER_ID_6', 'doctor', 'Dr. Sarah Anderson', 'dr.anderson@healthcare.com', '+91-9876543215');
*/

-- =====================================================
-- QUICK SOLUTION: Create test doctors using existing profiles
-- =====================================================

-- If you have existing users registered as doctors, convert them:
-- Run this query to find profiles with role 'doctor' that don't have doctor records yet:

SELECT p.id as profile_id, p.user_id, p.full_name, p.email 
FROM profiles p 
LEFT JOIN doctors d ON d.profile_id = p.id 
WHERE p.role = 'doctor' AND d.id IS NULL;

-- =====================================================
-- EASIEST APPROACH: Use Supabase Dashboard to create auth users
-- Then run this script with the actual IDs
-- =====================================================

-- STEP 1: Go to Supabase Dashboard > Authentication > Users
-- STEP 2: Click "Add user" and create these 6 doctors:

-- Doctor 1: dr.sharma@healthcare.com / Doctor123!
-- Doctor 2: dr.patel@healthcare.com / Doctor123!  
-- Doctor 3: dr.kumar@healthcare.com / Doctor123!
-- Doctor 4: dr.singh@healthcare.com / Doctor123!
-- Doctor 5: dr.wilson@healthcare.com / Doctor123!
-- Doctor 6: dr.anderson@healthcare.com / Doctor123!

-- STEP 3: After creating users, run this query to get their IDs:
SELECT id, email, created_at FROM auth.users WHERE email LIKE 'dr.%' ORDER BY email;

-- STEP 4: Copy the IDs and update the INSERT statements below, then run them:

-- =====================================================
-- COMPLETE INSERT SCRIPT (Update the user IDs first!)
-- =====================================================

-- After you create auth users, replace the placeholder UUIDs below with real ones
-- Then uncomment and run this entire block:

/*
DO $$
DECLARE
    -- Replace these with actual user IDs from auth.users
    user1_id UUID := 'REPLACE_WITH_dr.sharma_USER_ID';
    user2_id UUID := 'REPLACE_WITH_dr.patel_USER_ID';
    user3_id UUID := 'REPLACE_WITH_dr.kumar_USER_ID';
    user4_id UUID := 'REPLACE_WITH_dr.singh_USER_ID';
    user5_id UUID := 'REPLACE_WITH_dr.wilson_USER_ID';
    user6_id UUID := 'REPLACE_WITH_dr.anderson_USER_ID';
    
    -- Department IDs
    cardiology_id UUID;
    dermatology_id UUID;
    neurology_id UUID;
    orthopedics_id UUID;
    pediatrics_id UUID;
    general_id UUID;
    
    -- Profile IDs (generated)
    profile1_id UUID;
    profile2_id UUID;
    profile3_id UUID;
    profile4_id UUID;
    profile5_id UUID;
    profile6_id UUID;
    
    -- Doctor IDs (generated)
    doctor1_id UUID;
    doctor2_id UUID;
    doctor3_id UUID;
    doctor4_id UUID;
    doctor5_id UUID;
    doctor6_id UUID;
BEGIN
    -- Get department IDs
    SELECT id INTO cardiology_id FROM departments WHERE name = 'Cardiology';
    SELECT id INTO dermatology_id FROM departments WHERE name = 'Dermatology';
    SELECT id INTO neurology_id FROM departments WHERE name = 'Neurology';
    SELECT id INTO orthopedics_id FROM departments WHERE name = 'Orthopedics';
    SELECT id INTO pediatrics_id FROM departments WHERE name = 'Pediatrics';
    SELECT id INTO general_id FROM departments WHERE name = 'General Medicine';
    
    -- Create profiles
    INSERT INTO profiles (user_id, role, full_name, email, phone) 
    VALUES (user1_id, 'doctor', 'Rajesh Sharma', 'dr.sharma@healthcare.com', '+91-9876543210')
    RETURNING id INTO profile1_id;
    
    INSERT INTO profiles (user_id, role, full_name, email, phone) 
    VALUES (user2_id, 'doctor', 'Priya Patel', 'dr.patel@healthcare.com', '+91-9876543211')
    RETURNING id INTO profile2_id;
    
    INSERT INTO profiles (user_id, role, full_name, email, phone) 
    VALUES (user3_id, 'doctor', 'Amit Kumar', 'dr.kumar@healthcare.com', '+91-9876543212')
    RETURNING id INTO profile3_id;
    
    INSERT INTO profiles (user_id, role, full_name, email, phone) 
    VALUES (user4_id, 'doctor', 'Neha Singh', 'dr.singh@healthcare.com', '+91-9876543213')
    RETURNING id INTO profile4_id;
    
    INSERT INTO profiles (user_id, role, full_name, email, phone) 
    VALUES (user5_id, 'doctor', 'John Wilson', 'dr.wilson@healthcare.com', '+91-9876543214')
    RETURNING id INTO profile5_id;
    
    INSERT INTO profiles (user_id, role, full_name, email, phone) 
    VALUES (user6_id, 'doctor', 'Sarah Anderson', 'dr.anderson@healthcare.com', '+91-9876543215')
    RETURNING id INTO profile6_id;
    
    -- Create doctors
    INSERT INTO doctors (user_id, profile_id, department_id, qualification, experience_years, specialization, bio, consultation_duration, max_patients_per_slot, is_available)
    VALUES (user1_id, profile1_id, cardiology_id, 'MBBS, MD Cardiology, DM', 15, 'Interventional Cardiology', 'Senior cardiologist with expertise in complex heart procedures', 20, 1, true)
    RETURNING id INTO doctor1_id;
    
    INSERT INTO doctors (user_id, profile_id, department_id, qualification, experience_years, specialization, bio, consultation_duration, max_patients_per_slot, is_available)
    VALUES (user2_id, profile2_id, dermatology_id, 'MBBS, MD Dermatology', 10, 'Cosmetic Dermatology', 'Specialist in skin conditions and cosmetic procedures', 15, 1, true)
    RETURNING id INTO doctor2_id;
    
    INSERT INTO doctors (user_id, profile_id, department_id, qualification, experience_years, specialization, bio, consultation_duration, max_patients_per_slot, is_available)
    VALUES (user3_id, profile3_id, neurology_id, 'MBBS, DM Neurology', 12, 'Neurology', 'Expert in neurological disorders and stroke management', 25, 1, true)
    RETURNING id INTO doctor3_id;
    
    INSERT INTO doctors (user_id, profile_id, department_id, qualification, experience_years, specialization, bio, consultation_duration, max_patients_per_slot, is_available)
    VALUES (user4_id, profile4_id, orthopedics_id, 'MBBS, MS Orthopedics', 8, 'Sports Medicine', 'Orthopedic surgeon specializing in sports injuries', 20, 1, true)
    RETURNING id INTO doctor4_id;
    
    INSERT INTO doctors (user_id, profile_id, department_id, qualification, experience_years, specialization, bio, consultation_duration, max_patients_per_slot, is_available)
    VALUES (user5_id, profile5_id, pediatrics_id, 'MBBS, MD Pediatrics', 14, 'Pediatric Care', 'Experienced pediatrician with focus on child development', 15, 1, true)
    RETURNING id INTO doctor5_id;
    
    INSERT INTO doctors (user_id, profile_id, department_id, qualification, experience_years, specialization, bio, consultation_duration, max_patients_per_slot, is_available)
    VALUES (user6_id, profile6_id, general_id, 'MBBS, MD Internal Medicine', 18, 'General Medicine', 'Senior physician for comprehensive health consultations', 15, 1, true)
    RETURNING id INTO doctor6_id;
    
    -- Create availability for all doctors (Monday to Friday, 9 AM to 5 PM)
    INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, is_blocked) VALUES
    -- Dr. Sharma
    (doctor1_id, 1, '09:00', '17:00', false),
    (doctor1_id, 2, '09:00', '17:00', false),
    (doctor1_id, 3, '09:00', '17:00', false),
    (doctor1_id, 4, '09:00', '17:00', false),
    (doctor1_id, 5, '09:00', '17:00', false),
    -- Dr. Patel
    (doctor2_id, 1, '10:00', '18:00', false),
    (doctor2_id, 2, '10:00', '18:00', false),
    (doctor2_id, 3, '10:00', '18:00', false),
    (doctor2_id, 4, '10:00', '18:00', false),
    (doctor2_id, 5, '10:00', '18:00', false),
    -- Dr. Kumar
    (doctor3_id, 1, '09:00', '16:00', false),
    (doctor3_id, 2, '09:00', '16:00', false),
    (doctor3_id, 3, '09:00', '16:00', false),
    (doctor3_id, 4, '09:00', '16:00', false),
    (doctor3_id, 5, '09:00', '16:00', false),
    -- Dr. Singh
    (doctor4_id, 1, '08:00', '15:00', false),
    (doctor4_id, 2, '08:00', '15:00', false),
    (doctor4_id, 3, '08:00', '15:00', false),
    (doctor4_id, 4, '08:00', '15:00', false),
    (doctor4_id, 5, '08:00', '15:00', false),
    -- Dr. Wilson
    (doctor5_id, 1, '09:00', '17:00', false),
    (doctor5_id, 2, '09:00', '17:00', false),
    (doctor5_id, 3, '09:00', '17:00', false),
    (doctor5_id, 4, '09:00', '17:00', false),
    (doctor5_id, 5, '09:00', '17:00', false),
    (doctor5_id, 6, '09:00', '13:00', false), -- Saturday half day
    -- Dr. Anderson
    (doctor6_id, 1, '08:00', '16:00', false),
    (doctor6_id, 2, '08:00', '16:00', false),
    (doctor6_id, 3, '08:00', '16:00', false),
    (doctor6_id, 4, '08:00', '16:00', false),
    (doctor6_id, 5, '08:00', '16:00', false),
    (doctor6_id, 6, '08:00', '12:00', false); -- Saturday half day
    
    RAISE NOTICE 'Successfully created 6 doctors with their profiles and availability!';
END $$;
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check all doctors with their profiles and departments:
SELECT 
    d.id as doctor_id,
    p.full_name,
    p.email,
    dept.name as department,
    d.specialization,
    d.qualification,
    d.is_available
FROM doctors d
JOIN profiles p ON d.profile_id = p.id
JOIN departments dept ON d.department_id = dept.id
ORDER BY dept.name, p.full_name;

-- Check doctor availability:
SELECT 
    p.full_name as doctor_name,
    da.day_of_week,
    CASE da.day_of_week 
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END as day_name,
    da.start_time,
    da.end_time,
    da.is_blocked
FROM doctor_availability da
JOIN doctors d ON da.doctor_id = d.id
JOIN profiles p ON d.profile_id = p.id
ORDER BY p.full_name, da.day_of_week;
