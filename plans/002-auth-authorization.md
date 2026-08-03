# Plan 002: Make authentication, roles, and authorization coherent

> Follow every step and gate. Touch only Scope. Stop on any STOP condition.
> Drift check: `git diff --stat 1742326..HEAD -- lib/auth lib/validations/auth.ts lib/supabase hooks/useAuth.ts app/'(auth)' app/'(dashboard)'/admin app/api/admin supabase README.md tests`

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `plans/001-verification-baseline.md`
- **Category**: security, bug
- **Planned at**: commit `1742326`, 2026-08-02

## Why this matters

The UI advertises self-signup for every role while the database allows only
patient and guest. Elevated registration can create an auth user, ignore the
profile-policy failure, and strand the account. Authorization is spread across
middleware, client hooks, pages, and RLS. This plan creates one explicit role
model and a secure admin provisioning path.

## Current state

- `lib/auth/roles.ts:3-11` names every role as self-service.
- `app/(auth)/register/page.tsx:45-53` renders every role.
- `supabase/schema.sql:120-122` permits self-created profiles only for patient
  and guest.
- `app/(auth)/register/page.tsx:105-115` suppresses policy failures and displays
  success.
- `lib/supabase/middleware.ts:84-88` fails open when Supabase throws.
- `README.md:116` says self-signup is restricted to patient/guest.

## Scope

**In scope**: `lib/auth/**`, `lib/validations/auth.ts`,
`lib/supabase/{middleware,server,admin}.ts`,
`hooks/useAuth.ts`, auth pages/callback, `app/api/admin/users/**`, a focused
admin user-provisioning UI at `app/(dashboard)/admin/users/**`, the navigation
entry in `app/(dashboard)/admin/page.tsx`, `supabase/config.toml`,
`supabase/migrations/**`, `supabase/tests/database/**`, `.env.example`, README,
and auth tests. A baseline migration may be generated mechanically from the
existing `supabase/schema.sql` followed by `supabase/hospitality.sql` so a fresh
local Supabase instance reproduces the shipped schema before hardening runs.

**Out of scope**: appointment/clinical/hospitality behavior, global redesign,
live user creation during tests, and any service-role secret value.

## Steps

1. Define `SELF_SERVICE_ROLES = ['patient','guest']`, `STAFF_ROLES`, and shared
   `UserRole` guards in one module. Update unit tests first.
   **Verify**: `npm test -- roles` passes.
2. Restrict registration tabs and validation to patient/guest. Treat profile
   creation failure as failure unless email confirmation means the callback
   must create it; make callback idempotent and never trust elevated
   `user_metadata.role`. **Verify**: registration tests cover both roles and
   rejection of elevated roles.
3. Add a server-only Supabase admin client using
   `SUPABASE_SERVICE_ROLE_KEY`. Build an admin-authenticated API that invites or
   creates doctor/staff/lab/pharma accounts and writes profiles atomically from
   the caller's perspective. If profile creation fails after an auth invite,
   perform a compensating deletion of the invited auth user. Verify the caller
   with `auth.getUser()` and an admin profile before calling any admin API.
   Never expose the key to client code, error bodies, or logs.
   **Verify**: mocked route tests return 401, 403, validation 400, and success.
4. Add `app/(dashboard)/admin/users/page.tsx` as the provisioning surface and
   link it from the admin dashboard. Connect doctor invitations to the existing
   doctor approval/profile workflow. Show explicit invite success, validation,
   authorization, and retryable failure states.
   **Verify**: component tests cover submit/error/success without live calls.
5. Add a fresh local Supabase configuration plus a baseline migration built
   from the existing schema scripts. Add a hardening migration that enforces
   immutable self-service roles and limits
   patient appointment updates and guest reservation updates to allowed state
   transitions/fields through RPCs or triggers. Remove redundant permissive
   policies. Make middleware fail closed for protected routes.
   Add pgTAP tests under `supabase/tests/database/` for patient/guest allowed and
   denied writes plus role immutability.
   **Verify**: with Docker running, `npx --yes supabase@2.111.0 start`,
   `npx --yes supabase@2.111.0 db reset`, and
   `npx --yes supabase@2.111.0 test db` all succeed locally. Never link or apply
   these migrations to the configured remote project in this plan.
6. Document the provisioning flow and required server-only env name.
   **Verify**: `npm run verify` exits 0.

## Done criteria

- [ ] Only patient and guest appear in public signup.
- [ ] Elevated metadata cannot create an elevated profile.
- [ ] Admin provisioning requires server-verified admin identity.
- [ ] Protected middleware failures do not render protected pages.
- [ ] Authorization tests and the full verification gate pass.

## STOP conditions

- No disposable Supabase environment exists for policy tests.
- Local Supabase cannot reproduce `schema.sql` followed by `hospitality.sql`
  without changing the meaning of either script.
- Provisioning requires placing the service-role key in a `NEXT_PUBLIC_*` var.
- Existing production account semantics cannot be inferred without migration
  data; report the required decision rather than rewriting users.

## Maintenance notes

All new roles must be added to the centralized role model, route matrix, RLS
tests, provisioning UI, and navigation in the same change.
