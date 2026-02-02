import { z } from 'zod';

export const medicalRecordSchema = z.object({
  appointment_id: z.string().uuid('Invalid appointment'),
  diagnosis: z.string().min(5, 'Diagnosis must be at least 5 characters'),
  notes: z.string().optional(),
});

export const prescriptionSchema = z.object({
  medical_record_id: z.string().uuid('Invalid medical record'),
  medicine_name: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
  notes: z.string().optional(),
});

export type MedicalRecordInput = z.infer<typeof medicalRecordSchema>;
export type PrescriptionInput = z.infer<typeof prescriptionSchema>;
