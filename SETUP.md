# Hospital Management System - Setup & Implementation Guide

## Project Overview

A comprehensive web-based multispecialty hospital management system built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, and **Supabase**.

### Tech Stack
- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Database & Auth**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime (for token queue updates)
- **Forms**: React Hook Form + Zod validation
- **Notifications**: Resend (email) + optional Twilio (SMS)
- **Icons**: Lucide React
- **UI Components**: shadcn/ui (new-york style)

## Current Implementation Status

### ✅ Completed
1. **Project Setup**
   - Installed all required dependencies
   - Configured Tailwind CSS v4 with CSS variables
   - Set up shadcn/ui components
   - Added 20+ UI components (button, card, form, table, etc.)

2. **Authentication System**
   - Supabase auth client utilities (browser & server)
   - Middleware for session management
   - Sign-up page with role selection (patient, doctor, admin)
   - Sign-in page with email/password validation
   - Auth callback route for OAuth

3. **Type Definitions**
   - Complete TypeScript types for all entities
   - User profiles with role-based access
   - Doctor, Department, Appointment, Token structures
   - Medical Records, Prescriptions, Notifications

4. **Validation Schemas**
   - Zod schemas for auth (sign-up, sign-in)
   - Appointment booking & management validation
   - Medical records and prescription validation

5. **Dashboard Layouts**
   - Patient dashboard with stats and quick actions
   - Doctor dashboard with appointment overview
   - Admin dashboard with hospital management options
   - Protected layout components with role-based access

6. **Landing Page**
   - Professional hero section
   - Feature highlights for all user roles
   - How-it-works section
   - Call-to-action components

## Next Steps - Database Setup

### 1. Create Supabase Project

```bash
# Create account at https://supabase.com
# Create new project and get credentials
```

### 2. Set Environment Variables

Create `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_EMAIL=noreply@hospital.local
```

### 3. Supabase Database Schema

Create the following tables in Supabase SQL Editor:

#### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

#### Departments Table
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read departments"
  ON departments FOR SELECT
  USING (true);
```

#### Doctors Table
```sql
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id),
  qualification VARCHAR(255) NOT NULL,
  experience_years INTEGER NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  bio TEXT,
  consultation_duration INTEGER NOT NULL DEFAULT 15, -- in minutes
  max_patients_per_slot INTEGER NOT NULL DEFAULT 1,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read doctors"
  ON doctors FOR SELECT
  USING (true);

CREATE POLICY "Doctors can update own profile"
  ON doctors FOR UPDATE
  USING (auth.uid() = user_id);
```

#### Doctor Availability Table
```sql
CREATE TABLE doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_blocked BOOLEAN DEFAULT false,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(doctor_id, day_of_week)
);

ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can manage own availability"
  ON doctor_availability FOR ALL
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Patients can read availability"
  ON doctor_availability FOR SELECT
  USING (NOT is_blocked);
```

#### Appointments Table
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  token_number INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(doctor_id, appointment_date, appointment_time)
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can read own appointments"
  ON appointments FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Doctors can read their appointments"
  ON appointments FOR SELECT
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Admins can read all appointments"
  ON appointments FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin'));
```

#### Tokens Table
```sql
CREATE TABLE tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  token_number INTEGER NOT NULL,
  token_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'waiting' 
    CHECK (status IN ('waiting', 'called', 'completed', 'no_show')),
  called_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(doctor_id, token_date, token_number)
);

ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can manage own tokens"
  ON tokens FOR ALL
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Patients can read own tokens"
  ON tokens FOR SELECT
  USING (appointment_id IN (SELECT id FROM appointments WHERE patient_id = auth.uid()));
```

#### Medical Records Table
```sql
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  diagnosis TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can read own records"
  ON medical_records FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Doctors can create records for their appointments"
  ON medical_records FOR INSERT
  WITH CHECK (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));
```

#### Prescriptions Table
```sql
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  medicine_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  duration VARCHAR(100) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can read own prescriptions"
  ON prescriptions FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Doctors can create prescriptions"
  ON prescriptions FOR INSERT
  WITH CHECK (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));
```

#### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL 
    CHECK (type IN ('appointment_confirmation', 'appointment_reminder', 'queue_update', 'prescription', 'system')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());
```

## Project Structure

```
qms/
├── app/
│   ├── (auth)/                 # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   └── callback/
│   ├── (dashboard)/            # Protected dashboard routes
│   │   ├── patient/
│   │   │   ├── page.tsx        # Patient dashboard
│   │   │   ├── appointments/
│   │   │   └── records/
│   │   ├── doctor/
│   │   │   ├── page.tsx        # Doctor dashboard
│   │   │   ├── queue/
│   │   │   └── schedule/
│   │   └── admin/
│   │       ├── page.tsx        # Admin dashboard
│   │       ├── doctors/
│   │       └── departments/
│   ├── api/                    # API routes (if needed)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx               # Landing page
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── forms/                  # Form components
│   ├── dashboard/              # Dashboard components
│   └── queue/                  # Queue components
├── hooks/
│   └── useAuth.ts             # Auth hook
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server client
│   │   └── middleware.ts      # Session middleware
│   ├── utils.ts               # Utilities
│   └── validations/           # Zod schemas
├── types/
│   └── index.ts               # TypeScript types
├── public/
├── middleware.ts              # Next.js middleware
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── components.json
└── package.json
```

## Running the Project

### Development

```bash
# Install dependencies (already done)
npm install

# Create Supabase project and set up database
# Copy environment variables to .env.local

# Run development server
npm run dev

# Open http://localhost:3000
```

### Build & Deploy

```bash
# Build for production
npm run build

# Run production build locally
npm start

# Deploy to Vercel
vercel deploy
```

## Next Features to Implement

### 1. **Appointment Booking System**
   - Doctor listing with filters by specialty
   - Calendar/date picker for availability
   - Slot selection based on doctor schedule
   - Automatic token generation

### 2. **Queue & Token Management**
   - Real-time queue status using Supabase Realtime
   - Token display for current/waiting patients
   - Doctor interface to call next patient
   - Queue position tracking

### 3. **Medical Records**
   - Diagnoses and treatment notes from doctors
   - Prescription management
   - Document uploads (reports, scans)
   - Patient history view

### 4. **Notifications System**
   - Appointment confirmation (email)
   - 24-hour reminder notifications
   - Queue status updates
   - Prescription alerts

### 5. **Admin Panel**
   - Doctor management (add/edit/remove)
   - Department creation and organization
   - System-wide appointment monitoring
   - User management and reports

### 6. **Doctor Profile & Scheduling**
   - Availability management (weekly schedule)
   - Leave/holiday blocking
   - Consultation duration settings
   - Patient list view

## File Locations Reference

| Feature | Location |
|---------|----------|
| Auth Types | [types/index.ts](types/index.ts) |
| Auth Validation | [lib/validations/auth.ts](lib/validations/auth.ts) |
| Appointment Validation | [lib/validations/appointments.ts](lib/validations/appointments.ts) |
| Medical Validation | [lib/validations/medical.ts](lib/validations/medical.ts) |
| Supabase Client | [lib/supabase/client.ts](lib/supabase/client.ts) |
| Auth Hook | [hooks/useAuth.ts](hooks/useAuth.ts) |
| Patient Dashboard | [app/(dashboard)/patient/page.tsx](app/(dashboard)/patient/page.tsx) |
| Doctor Dashboard | [app/(dashboard)/doctor/page.tsx](app/(dashboard)/doctor/page.tsx) |
| Admin Dashboard | [app/(dashboard)/admin/page.tsx](app/(dashboard)/admin/page.tsx) |
| Sign Up | [app/(auth)/register/page.tsx](app/(auth)/register/page.tsx) |
| Sign In | [app/(auth)/login/page.tsx](app/(auth)/login/page.tsx) |

## Important Notes

1. **Row Level Security (RLS)**: All tables have RLS policies configured. Make sure to test permissions thoroughly.

2. **Email Notifications**: Set up Resend account and add API key to environment variables.

3. **Real-time Updates**: Supabase Realtime is included. Subscribe to changes in token and queue tables.

4. **Authentication**: Users are stored in `auth.users` (managed by Supabase) with corresponding `profiles` for role information.

5. **Deployment**: 
   - Use Vercel for Next.js (recommended)
   - Configure environment variables in Vercel dashboard
   - Enable Supabase Edge Functions for scheduled tasks (cron for daily token reset)

## Support & Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [React Hook Form](https://react-hook-form.com)
