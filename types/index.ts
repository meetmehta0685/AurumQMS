export type UserRole = 'patient' | 'doctor' | 'admin' | 'guest' | 'staff' | 'lab' | 'pharma';
export type ResourceType = 'provider' | 'room' | 'device';
export type AppointmentModality = 'in_person' | 'telehealth' | 'hybrid';
export type QueueStatus = 'waiting' | 'called' | 'completed' | 'no_show';
export type ConsentType = 'telehealth' | 'treatment' | 'financial' | 'hipaa' | 'custom';

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
  modality?: AppointmentModality;
  location?: string | null;
  overbooked?: boolean;
  no_show_score?: number | null;
  sla_target_minutes?: number | null;
  room_id?: string | null;
  device_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Token {
  id: string;
  appointment_id: string;
  doctor_id: string;
  token_number: number;
  token_date: string; // YYYY-MM-DD
  status: 'waiting' | 'called' | 'completed' | 'no_show';
  called_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  resource_type: ResourceType;
  name: string;
  description: string | null;
  location: string | null;
  capacity: number;
  doctor_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduleTemplate {
  id: string;
  resource_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  slot_duration: number; // minutes
  max_overbook: number;
  modality: AppointmentModality;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentResource {
  appointment_id: string;
  resource_id: string;
}

export interface WaitlistEntry {
  id: string;
  patient_id: string;
  preferred_doctor_id: string | null;
  preferred_department_id: string | null;
  preferred_location: string | null;
  preferred_modality: AppointmentModality;
  desired_date_from: string; // YYYY-MM-DD
  desired_date_to: string; // YYYY-MM-DD
  priority: number;
  status: 'waiting' | 'offered' | 'booked' | 'expired' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface QueueEntry {
  id: string;
  appointment_id: string;
  location: string | null;
  position: number;
  status: QueueStatus;
  wait_started_at: string;
  last_alerted_at: string | null;
  alerts_fired: string[];
  created_at: string;
  updated_at: string;
}

export interface TelehealthSession {
  id: string;
  appointment_id: string;
  room_url: string | null;
  status: 'pending' | 'ready' | 'active' | 'ended' | 'cancelled';
  consent_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Consent {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  consent_type: ConsentType;
  version: string;
  document_url: string | null;
  signed_at: string | null;
  signed_by: string | null;
  justification: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PatientDocument {
  id: string;
  patient_id: string;
  uploaded_by: string;
  document_type: string;
  url: string;
  checksum: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';
  txn_ref: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string | null;
  actor_role: UserRole | null;
  action: string;
  subject_type: string;
  subject_id: string | null;
  attributes: Record<string, unknown> | null;
  justification: string | null;
  hash_prev: string | null;
  created_at: string;
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

export interface LabTestOrder {
  id: string;
  appointment_id: string | null;
  medical_record_id: string | null;
  patient_id: string;
  doctor_id: string;
  test_name: string;
  instructions: string | null;
  status: 'ordered' | 'sample_collected' | 'processing' | 'reported' | 'cancelled';
  ordered_at: string;
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

export interface PharmacyDispense {
  id: string;
  prescription_id: string | null;
  patient_id: string;
  doctor_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  dispense_status: 'pending' | 'dispensed' | 'cancelled';
  dispensed_at: string | null;
  notes: string | null;
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
