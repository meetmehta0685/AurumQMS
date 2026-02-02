import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['patient', 'doctor', 'admin']),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const doctorProfileSchema = z.object({
  qualification: z.string().min(1, 'Qualification is required'),
  specialization: z.string().min(1, 'Specialization is required'),
  experience_years: z.number().min(0, 'Experience cannot be negative'),
  department_id: z.string().uuid('Invalid department'),
  consultation_duration: z.number().min(5, 'Minimum consultation duration is 5 minutes'),
  max_patients_per_slot: z.number().min(1, 'At least 1 patient per slot'),
  bio: z.string().optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type DoctorProfileInput = z.infer<typeof doctorProfileSchema>;
