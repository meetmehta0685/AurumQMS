# QMS Project - Setup and Deployment

This repository is a hybrid Next.js 16 application with two modules in one codebase:

- Hospital queue management workflows (patient, doctor, admin, lab, pharma)
- Hospitality workflows (landing, guest, staff)

This README is the single source of truth for local setup and production deployment.

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase (PostgreSQL, Auth, Row Level Security)
- React Hook Form + Zod, pdf-lib (discharge PDFs)

## Prerequisites

- Node.js 20+ and npm 10+
- Docker (for the local Supabase stack), or a hosted Supabase project

## Local Development

```bash
npm install
npm run db:start      # starts local Supabase, applies supabase/migrations, loads supabase/seed.sql
npx supabase status   # copy "API URL" and "anon key" into .env.local (see .env.example)
npm run dev
```

Open `http://localhost:3000` and use a demo shortcut on the login page.
Every demo account uses the password `password123`:

| Role | Email |
|---|---|
| Patient | `patient@demo.com` |
| Doctor | `doctor@demo.com` |
| Admin | `admin@demo.com` |
| Lab | `lab@demo.com` |
| Pharmacy | `pharma@demo.com` |
| Hotel guest | `guest@demo.com` (reservations `AR-2391`, `AR-4530`, `AR-7812`, last name `Rao`) |
| Hotel staff | `staff@demo.com` |

`npm run db:reset` rebuilds the local database from the migrations and seed.

## Database

- `supabase/migrations/` holds the whole schema, RLS policies, and database functions.
- `supabase/seed.sql` creates the demo accounts and sample data. Use it for local or demo projects only.
- Public signup creates **patient** or **guest** profiles only. The `handle_new_user` trigger enforces this.
  Other roles are assigned by an admin, who changes `profiles.role`.
- Token numbers, slot availability, queue position, and room allocation are computed in the database:
  the `set_token_number` trigger and the `get_booked_times`, `get_queue`, and `allocate_room` functions.
  The browser never computes them from partial data.

## Verify

```bash
npm run lint
npm run typecheck
npm run build
```

## Deployment (Vercel + hosted Supabase)

1. Create a Supabase project, then link it and push the schema:
   `npx supabase link --project-ref <ref>` and `npx supabase db push`.
   Optionally run `supabase/seed.sql` in the SQL editor to get the demo accounts.
2. In Vercel, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to that project's values.
3. In Supabase Auth settings, set the Site URL to the Vercel domain and add `<domain>/callback` as a redirect URL.
4. Deploy.

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
- Protected routes fail closed: if the role can't be verified, the user is sent to `/login`.
- Self-signup is restricted to patient/guest roles.

## Project Structure

- `app/`: pages, route groups, and API routes
- `components/`: shared UI and dashboard components
- `hooks/`: custom hooks
- `lib/`: Supabase clients, roles, validations, utilities
- `supabase/`: config, migrations, and demo seed
- `types/`: shared TypeScript types

## Support Docs

- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- shadcn/ui: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com

## Website: https://aurum-qms.vercel.app
