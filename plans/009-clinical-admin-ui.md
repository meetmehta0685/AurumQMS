# Plan 009: Redesign patient, doctor, admin, lab, and pharmacy routes

> Invoke the `frontend-design` skill if available. Drift check:
> `git diff --stat cce707b..HEAD -- app/'(dashboard)' components tests`

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: Plans 003, 004, 006, and 007
- **Category**: direction
- **Planned at**: commit `cce707b`, 2026-08-02

## Why this matters

Clinical and admin routes duplicate headers, navigation, cards, colors, loading
states, and status labels. Dense operational tasks need consistent hierarchy,
responsive tables, explicit state transitions, and role-specific home screens
without losing clinical safety signals.

## Scope

**In scope**: every page under `app/(dashboard)`, lab/pharma route content,
role-specific nav definitions, shared clinical/admin presentation components,
and visual/interaction tests.

**Out of scope**: database/API contract changes, new clinical capabilities,
altering medical/legal copy, and decorative animation on safety-critical actions.

## Steps

1. Inventory every route by role, primary task, secondary task, critical states,
   and mobile behavior. Make a migration checklist in the PR/commit notes.
2. Migrate patient routes: home, appointments, queue, records, lab, pharmacy,
   and discharge. Prioritize next action, appointment state, privacy, and clear
   empty/error states.
3. Migrate doctor routes: home, queue, schedule, lab, pharmacy/prescriptions,
   and discharge. Keep call/complete/no-show actions visually distinct and
   require confirmation for irreversible state transitions.
4. Migrate admin routes: home, doctors/users, departments, appointments,
   reports, lab, pharmacy, and discharge. Use responsive data tables on desktop
   and labeled record lists on mobile; filters must remain visible and usable.
5. Migrate standalone lab and pharma portals with work-queue hierarchy,
   ownership/status context, validation, and completion feedback.
6. Remove duplicated page headers/status mappings now served by Plan 007.
   Preserve all business calls and tests from Plans 003–006.
7. Run screenshot checks at 375/768/1280/1440, keyboard and reduced-motion
   checks, role E2E suites, and `npm run verify`.

## Done criteria

- [ ] Every authored route is migrated to the shared visual system.
- [ ] No route recreates the global shell or role status mapping.
- [ ] Tables/forms remain usable at 375px without horizontal page overflow.
- [ ] Critical actions have explicit labels, confirmation, loading, success,
      and error states.
- [ ] All role E2E, accessibility, and verification gates pass.

## STOP conditions

- A route still depends on a known broken domain contract.
- The migration would require suppressing or deleting a workflow test.
- Medical status semantics are ambiguous; stop for domain clarification.

## Maintenance notes

Review visual changes by role workflow, not by component count. Clinical safety,
legibility, and keyboard access outrank decorative novelty.

