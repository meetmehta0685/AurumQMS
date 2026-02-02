import { describe, it, expect } from 'vitest';
import { medicalRecordSchema, prescriptionSchema } from '@/lib/validations/medical';

describe('Medical Validations', () => {
  describe('medicalRecordSchema', () => {
    it('should validate correct medical record', () => {
      const validInput = {
        appointment_id: '123e4567-e89b-12d3-a456-426614174000',
        diagnosis: 'Common cold with mild fever',
        notes: 'Patient advised rest for 2 days',
      };

      const result = medicalRecordSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate medical record without notes', () => {
      const validInput = {
        appointment_id: '123e4567-e89b-12d3-a456-426614174000',
        diagnosis: 'Common cold with mild fever',
      };

      const result = medicalRecordSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject invalid appointment UUID', () => {
      const invalidInput = {
        appointment_id: 'not-valid',
        diagnosis: 'Some diagnosis',
      };

      const result = medicalRecordSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject diagnosis shorter than 5 characters', () => {
      const invalidInput = {
        appointment_id: '123e4567-e89b-12d3-a456-426614174000',
        diagnosis: 'Cold',
      };

      const result = medicalRecordSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Diagnosis must be at least 5 characters');
      }
    });

    it('should accept diagnosis exactly 5 characters', () => {
      const validInput = {
        appointment_id: '123e4567-e89b-12d3-a456-426614174000',
        diagnosis: 'Colds',
      };

      const result = medicalRecordSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe('prescriptionSchema', () => {
    it('should validate correct prescription', () => {
      const validInput = {
        medical_record_id: '123e4567-e89b-12d3-a456-426614174000',
        medicine_name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '5 days',
        notes: 'Take after meals',
      };

      const result = prescriptionSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate prescription without notes', () => {
      const validInput = {
        medical_record_id: '123e4567-e89b-12d3-a456-426614174000',
        medicine_name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '5 days',
      };

      const result = prescriptionSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject invalid medical record UUID', () => {
      const invalidInput = {
        medical_record_id: 'invalid-uuid',
        medicine_name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '5 days',
      };

      const result = prescriptionSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject empty medicine name', () => {
      const invalidInput = {
        medical_record_id: '123e4567-e89b-12d3-a456-426614174000',
        medicine_name: '',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '5 days',
      };

      const result = prescriptionSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject empty dosage', () => {
      const invalidInput = {
        medical_record_id: '123e4567-e89b-12d3-a456-426614174000',
        medicine_name: 'Paracetamol',
        dosage: '',
        frequency: 'Twice daily',
        duration: '5 days',
      };

      const result = prescriptionSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject empty frequency', () => {
      const invalidInput = {
        medical_record_id: '123e4567-e89b-12d3-a456-426614174000',
        medicine_name: 'Paracetamol',
        dosage: '500mg',
        frequency: '',
        duration: '5 days',
      };

      const result = prescriptionSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject empty duration', () => {
      const invalidInput = {
        medical_record_id: '123e4567-e89b-12d3-a456-426614174000',
        medicine_name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '',
      };

      const result = prescriptionSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
});
