import { describe, it, expect } from 'vitest';
import { signUpSchema, signInSchema, doctorProfileSchema } from '@/lib/validations/auth';

describe('Auth Validations', () => {
  describe('signUpSchema', () => {
    it('should validate a correct signup input', () => {
      const validInput = {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'John Doe',
        role: 'patient' as const,
      };

      const result = signUpSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidInput = {
        email: 'invalid-email',
        password: 'password123',
        full_name: 'John Doe',
        role: 'patient' as const,
      };

      const result = signUpSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });

    it('should reject password shorter than 6 characters', () => {
      const invalidInput = {
        email: 'test@example.com',
        password: '12345',
        full_name: 'John Doe',
        role: 'patient' as const,
      };

      const result = signUpSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 6 characters');
      }
    });

    it('should reject name shorter than 2 characters', () => {
      const invalidInput = {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'J',
        role: 'patient' as const,
      };

      const result = signUpSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name must be at least 2 characters');
      }
    });

    it('should reject invalid role', () => {
      const invalidInput = {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'John Doe',
        role: 'invalid_role',
      };

      const result = signUpSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should accept all valid roles', () => {
      const roles = ['patient', 'doctor', 'admin'] as const;

      roles.forEach((role) => {
        const input = {
          email: 'test@example.com',
          password: 'password123',
          full_name: 'John Doe',
          role,
        };

        const result = signUpSchema.safeParse(input);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('signInSchema', () => {
    it('should validate correct signin input', () => {
      const validInput = {
        email: 'test@example.com',
        password: 'anypassword',
      };

      const result = signInSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidInput = {
        email: 'not-an-email',
        password: 'password',
      };

      const result = signInSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const invalidInput = {
        email: 'test@example.com',
        password: '',
      };

      const result = signInSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password is required');
      }
    });
  });

  describe('doctorProfileSchema', () => {
    it('should validate correct doctor profile', () => {
      const validInput = {
        qualification: 'MBBS, MD',
        specialization: 'Cardiology',
        experience_years: 10,
        department_id: '123e4567-e89b-12d3-a456-426614174000',
        consultation_duration: 30,
        max_patients_per_slot: 5,
        bio: 'Experienced cardiologist',
      };

      const result = doctorProfileSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject empty qualification', () => {
      const invalidInput = {
        qualification: '',
        specialization: 'Cardiology',
        experience_years: 10,
        department_id: '123e4567-e89b-12d3-a456-426614174000',
        consultation_duration: 30,
        max_patients_per_slot: 5,
      };

      const result = doctorProfileSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject negative experience years', () => {
      const invalidInput = {
        qualification: 'MBBS',
        specialization: 'Cardiology',
        experience_years: -5,
        department_id: '123e4567-e89b-12d3-a456-426614174000',
        consultation_duration: 30,
        max_patients_per_slot: 5,
      };

      const result = doctorProfileSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject consultation duration less than 5 minutes', () => {
      const invalidInput = {
        qualification: 'MBBS',
        specialization: 'Cardiology',
        experience_years: 10,
        department_id: '123e4567-e89b-12d3-a456-426614174000',
        consultation_duration: 3,
        max_patients_per_slot: 5,
      };

      const result = doctorProfileSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject max_patients_per_slot less than 1', () => {
      const invalidInput = {
        qualification: 'MBBS',
        specialization: 'Cardiology',
        experience_years: 10,
        department_id: '123e4567-e89b-12d3-a456-426614174000',
        consultation_duration: 30,
        max_patients_per_slot: 0,
      };

      const result = doctorProfileSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID for department_id', () => {
      const invalidInput = {
        qualification: 'MBBS',
        specialization: 'Cardiology',
        experience_years: 10,
        department_id: 'not-a-uuid',
        consultation_duration: 30,
        max_patients_per_slot: 5,
      };

      const result = doctorProfileSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should allow optional bio to be undefined', () => {
      const validInput = {
        qualification: 'MBBS',
        specialization: 'Cardiology',
        experience_years: 10,
        department_id: '123e4567-e89b-12d3-a456-426614174000',
        consultation_duration: 30,
        max_patients_per_slot: 5,
      };

      const result = doctorProfileSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });
});
