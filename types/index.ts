export type UserRole = 'patient' | 'doctor' | 'admin' | 'guest' | 'staff' | 'lab' | 'pharma';

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  profile_id: string;
  department_id: string;
  qualification: string;
  experience_years: number;
  specialization: string;
  bio: string | null;
  consultation_duration: number; // in minutes
  max_patients_per_slot: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  is_blocked: boolean;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:mm
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  token_number: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string;
  diagnosis: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: string;
  medical_record_id: string;
  patient_id: string;
  doctor_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabReport {
  id: string;
  order_id: string;
  patient_id: string;
  doctor_id: string;
  report_title: string;
  report_url: string | null;
  report_text: string | null;
  reported_at: string;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DischargeSummary {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  summary_text: string | null;
  discharge_status: 'draft' | 'discharged';
  discharged_at: string | null;
  generated_pdf_url: string | null;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'appointment_confirmation' | 'appointment_reminder' | 'queue_update' | 'prescription' | 'system';
  title: string;
  message: string;
  email: string | null;
  phone: string | null;
  is_sent: boolean;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}
