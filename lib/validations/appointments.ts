import { z } from 'zod';

export const appointmentBookingSchema = z.object({
  doctor_id: z.string().uuid('Invalid doctor'),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  notes: z.string().optional(),
});

export const appointmentRescheduleSchema = z.object({
  appointment_id: z.string().uuid('Invalid appointment'),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
});

export const appointmentCancelSchema = z.object({
  appointment_id: z.string().uuid('Invalid appointment'),
  reason: z.string().optional(),
});

export type AppointmentBookingInput = z.infer<typeof appointmentBookingSchema>;
export type AppointmentRescheduleInput = z.infer<typeof appointmentRescheduleSchema>;
export type AppointmentCancelInput = z.infer<typeof appointmentCancelSchema>;
