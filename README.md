# QMS Project - Setup and Deployment

This repository is a hybrid Next.js 16 application with two modules in one codebase:

- Hospital queue management workflows (patient, doctor, admin, lab, pharma)
- Hospitality workflows (landing, guest, staff)

This README is the single source of truth for local setup and production deployment.

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase (PostgreSQL, Auth, Realtime)
- React Hook Form + Zod
- Resend (email notifications)
- Twilio (optional SMS notifications)

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase project
- (Optional) Vercel account for deployment

## Environment Variables

Create `.env.local` in the project root:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_EMAIL=noreply@yourdomain.com

# Optional SMS
# TWILIO_ACCOUNT_SID=your_account_sid
# TWILIO_AUTH_TOKEN=your_auth_token
# TWILIO_PHONE_NUMBER=+1234567890
```

## Database Setup

Use Supabase SQL Editor and run scripts from the `supabase/` folder in this order:

1. `supabase/schema.sql`
2. `supabase/hospitality.sql`
3. Optional seed data as needed:
   - `supabase/seed-departments.sql`
   - `supabase/seed-doctors.sql`
   - `supabase/seed-dummy-doctors.sql`
   - `supabase/seed-clinical-demo.sql`
   - `supabase/seed-denish-pdf.sql`
4. If needed for fixes/hardening:
   - `supabase/fix-profiles-lab-pharma.sql`
   - `supabase/security-hardening.sql`

## Local Development

Install and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verify Before Deploying

```bash
npm run lint
npm run build
```

Both commands should pass before deployment.

## Deployment (Vercel Recommended)

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Add all environment variables from `.env.local` to Vercel Project Settings.
4. Deploy.

CLI option:

```bash
npm run build
npm start
vercel deploy
```

## Routes Overview

Hospital module:

- `/patient`
- `/doctor`
- `/admin`
- `/lab`
- `/pharma`
- `/api/discharge/[appointmentId]`

Hospitality module:

- `/`
- `/guest`
- `/staff`

## Important Notes

- Request interception uses `proxy.ts`.
- Role-based access is enforced in `lib/supabase/middleware.ts` using `lib/auth/roles.ts`.
- Self-signup is restricted to patient/guest roles.
- RLS policies are part of the SQL scripts and must be applied in Supabase.

## Project Structure

- `app/`: pages, route groups, and API routes
- `components/`: shared UI and dashboard components
- `hooks/`: custom hooks
- `lib/`: Supabase clients, roles, validations, utilities
- `supabase/`: SQL schema, seeds, and hardening scripts
- `types/`: shared TypeScript types

## Support Docs

- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- shadcn/ui: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com
