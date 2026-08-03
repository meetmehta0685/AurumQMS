# Plan 005: Make hospitality allocation and service workflows transactional

> Follow every step and gate. Drift check: `git diff --stat cce707b..HEAD -- app/{guest,staff} supabase/hospitality.sql supabase/migrations lib tests`

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: Plans 001 and 002
- **Category**: bug, security
- **Planned at**: commit `cce707b`, 2026-08-02

## Why this matters

Room assignment performs three independent browser writes and ignores failures
after creating the allocation. Two staff sessions can select the same ready
room because there is no active-room uniqueness rule. Check-in, checkout, room
state, and service requests need explicit server-authoritative transitions.

## Current state

- `app/staff/page.tsx:188-235` selects a ready room, inserts allocation, then
  updates room and reservation separately.
- `supabase/hospitality.sql:116-123` makes reservation unique but not active room.
- `app/guest/page.tsx:171-181` updates reservation fields directly.

## Scope

**In scope**: hospitality migrations/RPCs, guest/staff pages, hospitality types,
validation, and tests.

**Out of scope**: clinical modules, global redesign, payment features, and live
hotel data mutation.

## Steps

1. Add lifecycle tests for preference update, allocate, check in, service
   request, service completion, checkout, and room release, including two
   simultaneous allocations.
2. Add `released_at` or equivalent active-allocation state plus a partial unique
   index preventing more than one active allocation per room. Add RPCs for
   allocation/check-in/checkout/status transition with row locks and role checks.
3. Route guest preference and service-request writes through narrow RPCs; guests
   must never change reservation ownership, dates, or status directly.
4. Refactor staff actions to RPCs and show actionable conflict/error states.
   Remove the unused guest-name state if it remains unused.
5. Add disposable-fixture E2E and run `npm run verify`.

## Done criteria

- [ ] Concurrent staff cannot allocate the same active room.
- [ ] Allocation, room status, and reservation status commit atomically.
- [ ] Checkout releases a room through an explicit transition.
- [ ] Guests can change only documented preferences and create own requests.
- [ ] Hospitality E2E and full verification pass.

## STOP conditions

- Existing production allocation history cannot distinguish active from closed.
- The desired reservation lifecycle is not agreed; stop with the ambiguous
  transitions listed rather than inventing states.

## Maintenance notes

New room or reservation actions must be modeled as lifecycle transitions, not
ad-hoc direct table updates from components.

