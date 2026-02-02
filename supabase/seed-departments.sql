-- Hospital Departments Seed Data
-- Run this SQL in Supabase SQL Editor to add departments

INSERT INTO departments (name, description) VALUES
  ('Cardiology', 'Diagnosis and treatment of heart and cardiovascular system disorders'),
  ('Dermatology', 'Treatment of skin, hair, and nail conditions'),
  ('Emergency Medicine', '24/7 emergency care and trauma treatment'),
  ('Endocrinology', 'Hormone and metabolic disorder treatment including diabetes'),
  ('Gastroenterology', 'Digestive system and gastrointestinal tract disorders'),
  ('General Medicine', 'Primary care and general health consultations'),
  ('Gynecology', 'Women''s reproductive health and related conditions'),
  ('Nephrology', 'Kidney disease diagnosis and treatment'),
  ('Neurology', 'Brain, spinal cord, and nervous system disorders'),
  ('Oncology', 'Cancer diagnosis, treatment, and management'),
  ('Ophthalmology', 'Eye care, vision problems, and eye surgery'),
  ('Orthopedics', 'Bone, joint, and musculoskeletal conditions'),
  ('Pediatrics', 'Medical care for infants, children, and adolescents'),
  ('Psychiatry', 'Mental health and psychological disorders'),
  ('Pulmonology', 'Lung and respiratory system conditions'),
  ('Radiology', 'Medical imaging and diagnostic services'),
  ('Rheumatology', 'Autoimmune and inflammatory joint diseases'),
  ('Urology', 'Urinary tract and male reproductive system conditions')
ON CONFLICT (name) DO NOTHING;

-- Verify departments were added
SELECT * FROM departments ORDER BY name;
