import { describe, it, expect } from 'vitest';
import {
  appointmentBookingSchema,
  appointmentRescheduleSchema,
  appointmentCancelSchema,
} from '@/lib/validations/appointments';

describe('Appointment Validations', () => {
  describe('appointmentBookingSchema', () => {
    it('should validate correct appointment booking', () => {
      const validInput = {
        doctor_id: '123e4567-e89b-12d3-a456-426614174000',
        appointment_date: '2026-01-15',
        appointment_time: '10:30',
        notes: 'Regular checkup',
      };

      const result = appointmentBookingSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate booking without notes', () => {
      const validInput = {
        doctor_id: '123e4567-e89b-12d3-a456-426614174000',
        appointment_date: '2026-01-15',
        appointment_time: '10:30',
      };

      const result = appointmentBookingSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject invalid doctor UUID', () => {
      const invalidInput = {
        doctor_id: 'invalid-uuid',
        appointment_date: '2026-01-15',
        appointment_time: '10:30',
      };

      const result = appointmentBookingSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const invalidFormats = [
        '01-15-2026',
        '15/01/2026',
        '2026/01/15',
        'January 15, 2026',
        '2026-1-15',
        '2026-01-5',
      ];

      invalidFormats.forEach((date) => {
        const result = appointmentBookingSchema.safeParse({
          doctor_id: '123e4567-e89b-12d3-a456-426614174000',
          appointment_date: date,
          appointment_time: '10:30',
        });
        expect(result.success).toBe(false);
      });
    });

    it('should accept valid date format YYYY-MM-DD', () => {
      const validDates = ['2026-01-01', '2026-12-31', '2026-06-15'];

      validDates.forEach((date) => {
        const result = appointmentBookingSchema.safeParse({
          doctor_id: '123e4567-e89b-12d3-a456-426614174000',
          appointment_date: date,
          appointment_time: '10:30',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid time format', () => {
      // Note: The regex validates format (HH:mm) but not time validity (e.g., 25:00)
      const invalidFormats = ['10:30 AM', '1:30', '10:3', '10:30:00'];

      invalidFormats.forEach((time) => {
        const result = appointmentBookingSchema.safeParse({
          doctor_id: '123e4567-e89b-12d3-a456-426614174000',
          appointment_date: '2026-01-15',
          appointment_time: time,
        });
        expect(result.success).toBe(false);
      });
    });

    it('should accept valid time format HH:mm', () => {
      const validTimes = ['00:00', '09:30', '12:00', '15:45', '23:59'];

      validTimes.forEach((time) => {
        const result = appointmentBookingSchema.safeParse({
          doctor_id: '123e4567-e89b-12d3-a456-426614174000',
          appointment_date: '2026-01-15',
          appointment_time: time,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('appointmentRescheduleSchema', () => {
    it('should validate correct reschedule input', () => {
      const validInput = {
        appointment_id: '123e4567-e89b-12d3-a456-426614174000',
        appointment_date: '2026-01-20',
        appointment_time: '14:00',
      };

      const result = appointmentRescheduleSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject invalid appointment UUID', () => {
      const invalidInput = {
        appointment_id: 'not-a-uuid',
        appointment_date: '2026-01-20',
        appointment_time: '14:00',
      };

      const result = appointmentRescheduleSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const invalidInput = {
        appointment_id: '123e4567-e89b-12d3-a456-426614174000',
        appointment_date: '20-01-2026',
        appointment_time: '14:00',
      };

      const result = appointmentRescheduleSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject invalid time format', () => {
      const invalidInput = {
        appointment_id: '123e4567-e89b-12d3-a456-426614174000',
        appointment_date: '2026-01-20',
        appointment_time: '2:00 PM',
      };

      const result = appointmentRescheduleSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('appointmentCancelSchema', () => {
    it('should validate correct cancel input', () => {
      const validInput = {
        appointment_id: '123e4567-e89b-12d3-a456-426614174000',
        reason: 'Cannot make it due to emergency',
      };

      const result = appointmentCancelSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate cancel without reason', () => {
      const validInput = {
        appointment_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = appointmentCancelSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject invalid appointment UUID', () => {
      const invalidInput = {
        appointment_id: 'invalid',
        reason: 'Some reason',
      };

      const result = appointmentCancelSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
});
