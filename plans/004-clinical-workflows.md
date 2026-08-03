# Plan 004: Complete clinical lab, pharmacy, records, and discharge workflows

> Follow every step and gate. Drift check: `git diff --stat cce707b..HEAD -- app/'(dashboard)'/{doctor,patient,lab,pharma,admin} app/api/discharge supabase lib tests`

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: Plans 001, 002, and 003
- **Category**: bug, security, tech-debt
- **Planned at**: commit `cce707b`, 2026-08-02

## Why this matters

Doctor pages attempt lab-report and pharmacy writes that the shipped RLS denies.
The code also blurs prescription, dispensing, reporting, and discharge roles.
Discharge PDFs can include medicines from unrelated visits. This plan defines
and enforces a coherent visit-bound clinical workflow.

## Current state

- `doctor/laboratory/page.tsx:150` inserts a lab report, but doctors only have
  SELECT policy on `lab_reports` at `schema.sql:820-822`.
- `doctor/pharma/page.tsx:131` inserts `pharmacy_dispenses`, but only pharma and
  admin manage that table at `schema.sql:868-878`.
- `lab/page.tsx:166-177` inserts a report and then updates the order without
  checking the second error or using a transaction.
- `api/discharge/[appointmentId]/route.ts:108-113` fetches medicines by patient
  and doctor, not appointment.

## Scope

**In scope**: clinical schema/RPC migrations, doctor/lab/pharma/patient/admin
clinical pages, discharge API, validations/types, and clinical tests.

**Out of scope**: appointment scheduling internals, hospitality, visual system,
and production data mutation outside a reviewed migration.

## Steps

1. Encode the role contract in tests: doctor orders tests and prescribes; lab
   staff records reports; pharmacy staff dispenses a prescription; patients
   read their own results/dispenses/discharge; admin oversees but does not
   impersonate domain actors. **Verify**: contract tests exist and initially
   expose current failures.
2. Add appointment/visit linkage to prescriptions and dispenses, with safe
   backfill rules. Add transactional RPCs for lab report publication and
   prescription dispensing that validate role, patient, doctor, visit, status,
   and quantity. **Verify**: SQL tests cover wrong-role and cross-visit denial.
3. Remove report creation from the doctor laboratory UI; keep order creation and
   result reading. Refactor doctor pharmacy UI to create prescriptions, not
   dispenses. Refactor lab/pharma portals around their role-specific work queues.
   **Verify**: component tests assert correct actions per role.
4. Make discharge summary generation visit-bound. Check every Supabase error,
   authorize only patient-for-self, assigned doctor, or admin, and paginate PDF
   content rather than drawing below a single page.
   **Verify**: PDF tests cover two visits with different medicines and multi-page
   notes; output contains only selected-visit data.
5. Add browser E2E for doctor order → lab report → patient result and doctor
   prescription → pharmacy dispense → patient medication → discharge PDF using
   disposable fixtures.
6. Run the full verification gate.

## Done criteria

- [ ] No UI offers an action its role cannot perform.
- [ ] Lab publication and dispensing are atomic.
- [ ] Cross-patient and cross-visit writes are denied.
- [ ] Discharge PDFs contain only selected-visit data and paginate safely.
- [ ] All clinical E2E tests pass.

## STOP conditions

- Product ownership wants doctors to publish lab results or self-dispense; stop
  for an explicit role decision before changing policies.
- Legacy records cannot be linked to visits safely.
- PDF tests require real patient data.

## Maintenance notes

Treat the appointment ID as the visit correlation key across clinical tables.
Review any future schema addition for that linkage and for role separation.

