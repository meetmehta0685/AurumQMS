import { describe, it, expect } from 'vitest';
import type {
  UserRole,
  Profile,
  Department,
  Doctor,
  Appointment,
  Token,
  MedicalRecord,
  Prescription,
} from '@/types';

describe('Type Definitions', () => {
  describe('UserRole', () => {
    it('should only allow valid user roles', () => {
      const validRoles: UserRole[] = ['patient', 'doctor', 'admin'];
      expect(validRoles).toHaveLength(3);
      expect(validRoles).toContain('patient');
      expect(validRoles).toContain('doctor');
      expect(validRoles).toContain('admin');
    });
  });

  describe('Profile', () => {
    it('should have correct structure', () => {
      const profile: Profile = {
        id: '123',
        user_id: '456',
        role: 'patient',
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      expect(profile.role).toBe('patient');
      expect(profile.phone).toBe('+1234567890');
    });

    it('should allow null for optional fields', () => {
      const profile: Profile = {
        id: '123',
        user_id: '456',
        role: 'doctor',
        full_name: 'Dr. Jane',
        email: 'jane@example.com',
        phone: null,
        avatar_url: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      expect(profile.phone).toBeNull();
      expect(profile.avatar_url).toBeNull();
    });
  });

  describe('Department', () => {
    it('should have correct structure', () => {
      const department: Department = {
        id: 'dept-123',
        name: 'Cardiology',
        description: 'Heart and cardiovascular system',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      expect(department.name).toBe('Cardiology');
    });

    it('should allow null description', () => {
      const department: Department = {
        id: 'dept-123',
        name: 'General',
        description: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      expect(department.description).toBeNull();
    });
  });

  describe('Doctor', () => {
    it('should have correct structure', () => {
      const doctor: Doctor = {
        id: 'doc-123',
        user_id: 'user-456',
        profile_id: 'profile-789',
        department_id: 'dept-123',
        qualification: 'MBBS, MD',
        experience_years: 10,
        specialization: 'Cardiology',
        bio: 'Experienced heart specialist',
        consultation_duration: 30,
        max_patients_per_slot: 5,
        is_available: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      expect(doctor.consultation_duration).toBe(30);
      expect(doctor.is_available).toBe(true);
    });
  });

  describe('Appointment', () => {
    it('should have correct structure', () => {
      const appointment: Appointment = {
        id: 'appt-123',
        patient_id: 'patient-456',
        doctor_id: 'doctor-789',
        appointment_date: '2026-01-15',
        appointment_time: '10:30',
        status: 'pending',
        token_number: 1,
        notes: 'Regular checkup',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      expect(appointment.status).toBe('pending');
    });

    it('should have valid status values', () => {
      const statuses: Appointment['status'][] = ['pending', 'confirmed', 'completed', 'cancelled'];
      expect(statuses).toHaveLength(4);
    });
  });

  describe('Token', () => {
    it('should have correct structure', () => {
      const token: Token = {
        id: 'token-123',
        appointment_id: 'appt-456',
        doctor_id: 'doctor-789',
        token_number: 5,
        token_date: '2026-01-15',
        status: 'waiting',
        called_at: null,
        completed_at: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      expect(token.status).toBe('waiting');
      expect(token.token_number).toBe(5);
    });

    it('should have valid status values', () => {
      const statuses: Token['status'][] = ['waiting', 'called', 'completed', 'no_show'];
      expect(statuses).toHaveLength(4);
    });
  });

  describe('MedicalRecord', () => {
    it('should have correct structure', () => {
      const record: MedicalRecord = {
        id: 'record-123',
        patient_id: 'patient-456',
        doctor_id: 'doctor-789',
        appointment_id: 'appt-123',
        diagnosis: 'Common cold',
        notes: 'Rest recommended',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      expect(record.diagnosis).toBe('Common cold');
    });
  });

  describe('Prescription', () => {
    it('should have correct structure', () => {
      const prescription: Prescription = {
        id: 'presc-123',
        medical_record_id: 'record-456',
        patient_id: 'patient-789',
        doctor_id: 'doctor-123',
        medicine_name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '5 days',
        notes: 'Take after meals',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      expect(prescription.medicine_name).toBe('Paracetamol');
      expect(prescription.dosage).toBe('500mg');
    });
  });
});
