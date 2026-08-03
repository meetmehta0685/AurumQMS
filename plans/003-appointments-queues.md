# Plan 003: Make appointments and queues server-authoritative

> Follow every step and gate. Drift check: `git diff --stat a62537a..HEAD -- app/'(dashboard)'/patient/appointments/page.tsx app/'(dashboard)'/patient/queue/page.tsx app/'(dashboard)'/doctor/queue/page.tsx supabase/migrations supabase/tests/database lib/validations/appointments.ts types/index.ts tests`

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: Plans 001 and 002
- **Category**: bug, security, tech-debt
- **Planned at**: commit `a62537a`, 2026-08-02

## Why this matters

Patients can only select their own appointments under RLS, yet the browser
tries to calculate global slot occupancy, token allocation, and queue position.
The result is stale slot choices, duplicate tokens, and incorrect queue data.
Booking and queue transitions must become transactional database operations
that expose only safe aggregates.

## Current state

- `patient/appointments/page.tsx:253-265` asks the patient client for all booked
  times, which RLS filters to that patient.
- `patient/appointments/page.tsx:322-340` derives the next token client-side.
- `patient/queue/page.tsx:117-145` derives queue position from rows the patient
  cannot see.
- `schema.sql:268` allows only one appointment per doctor/date/time, while
  `doctors.max_patients_per_slot` claims configurable capacity.
- `doctor/queue/page.tsx:167-190` completes the appointment before optionally
  inserting the medical record and swallows record failure.

## Scope

**In scope**: appointment/queue SQL migrations and RPCs under
`supabase/migrations/**` with pgTAP/integration coverage under
`supabase/tests/database/**`; `app/(dashboard)/patient/appointments/page.tsx`,
`app/(dashboard)/patient/queue/page.tsx`,
`app/(dashboard)/doctor/queue/page.tsx`; `lib/validations/appointments.ts`;
`types/index.ts`; and focused unit/browser tests under `tests/**`. Existing
Supabase config and shared test configuration may be changed only when required
to run the disposable appointment fixtures, and must preserve Plans 001-002.

**Out of scope**: lab/pharmacy/discharge, hospitality, page redesign, and direct
production migration execution.

## Steps

1. Add failing contract tests for slot capacity, concurrent booking, monotonic
   per-doctor/day tokens, cancellation, queue aggregates, and atomic completion.
   **Verify**: tests fail for the documented reasons before implementation.
2. Add SQL RPCs for `get_available_slots`, `book_appointment`,
   `cancel_appointment`, `get_patient_queue_position`, `call_next_patient`,
   `mark_no_show`, and `complete_appointment`. Validate `auth.uid()` and role in
   every function; expose aggregates, never other patient identity.
   Use row/advisory locking so concurrent booking cannot exceed
   `max_patients_per_slot` and token allocation is unique.
   **Verify**: database tests pass under concurrent calls.
3. Replace the unique doctor/date/time constraint with capacity enforcement and
   add a unique doctor/date/token constraint. Provide a safe migration for
   duplicate legacy tokens.
   **Verify**: two consecutive fresh `supabase db reset` runs succeed and the
   second pgTAP run preserves the expected fixture behavior.
4. Refactor patient booking and queue pages to call RPCs and render typed error
   states for full slots, stale selection, and cancellation conflicts.
   **Verify**: component tests cover all states.
5. Refactor doctor queue transitions to RPCs. Persist the called/current state
   so reload does not lose it; medical-record creation and completion must be
   one transaction.
   **Verify**: browser tests exercise booking through completion on disposable
   fixtures.
6. Run `npm run verify` and the domain E2E suite.

## Done criteria

- [ ] Clients never derive token numbers or global occupancy.
- [ ] Capacity greater than one is honored.
- [ ] Concurrent booking cannot overbook or duplicate tokens.
- [ ] Queue position is correct without revealing other patient data.
- [ ] Completion and medical-record creation are atomic.

## STOP conditions

- No disposable database is available for concurrency/migration tests.
- Legacy duplicate data cannot be migrated deterministically.
- Any RPC requires `SECURITY DEFINER` without an explicit `search_path`, role
  check, and revoked public execute privileges.

## Maintenance notes

All future appointment state transitions must go through the RPC boundary; do
not reintroduce direct client table updates.
