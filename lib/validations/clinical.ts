import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const labTestOrderSchema = z.object({
  appointment_id: z.string().uuid('Invalid appointment').optional(),
  medical_record_id: z.string().uuid('Invalid medical record').optional(),
  patient_id: z.string().uuid('Invalid patient'),
  doctor_id: z.string().uuid('Invalid doctor'),
  test_name: z.string().min(2, 'Test name must be at least 2 characters'),
  instructions: z.string().optional(),
  status: z.enum(['ordered', 'sample_collected', 'processing', 'reported', 'cancelled']).optional(),
});

export const labReportSchema = z.object({
  order_id: z.string().uuid('Invalid lab order'),
  patient_id: z.string().uuid('Invalid patient'),
  doctor_id: z.string().uuid('Invalid doctor'),
  report_title: z.string().min(2, 'Report title must be at least 2 characters'),
  report_url: z.string().url('Invalid report URL').optional(),
  report_text: z.string().optional(),
  reported_at: z.string().regex(dateRegex, 'Invalid report date format').optional(),
});

export const pharmacyDispenseSchema = z.object({
  prescription_id: z.string().uuid('Invalid prescription').optional(),
  patient_id: z.string().uuid('Invalid patient'),
  doctor_id: z.string().uuid('Invalid doctor'),
  medicine_name: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  dispense_status: z.enum(['pending', 'dispensed', 'cancelled']).optional(),
  notes: z.string().optional(),
});

export const dischargeSummarySchema = z.object({
  appointment_id: z.string().uuid('Invalid appointment'),
  patient_id: z.string().uuid('Invalid patient'),
  doctor_id: z.string().uuid('Invalid doctor'),
  summary_text: z.string().min(5, 'Summary must be at least 5 characters'),
  discharge_status: z.enum(['draft', 'discharged']).optional(),
});

export type LabTestOrderInput = z.infer<typeof labTestOrderSchema>;
export type LabReportInput = z.infer<typeof labReportSchema>;
export type PharmacyDispenseInput = z.infer<typeof pharmacyDispenseSchema>;
export type DischargeSummaryInput = z.infer<typeof dischargeSummarySchema>;
