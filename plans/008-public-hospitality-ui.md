# Plan 008: Redesign public, authentication, legal, guest, and staff routes

> Invoke the `frontend-design` skill if available. Drift check:
> `git diff --stat cce707b..HEAD -- app/page.tsx app/'(auth)' app/{guest,staff,privacy,terms} components tests`

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: Plans 005 and 007
- **Category**: direction
- **Planned at**: commit `cce707b`, 2026-08-02

## Why this matters

Public pages currently present hospitality as the entire product and include
implementation-oriented copy. Auth pages do not clearly explain public versus
provisioned roles. Guest/staff screens need the same trustworthy operational
language and responsive system as the rest of QMS.

## Scope

**In scope**: `/`, `/login`, `/register`, `/privacy`, `/terms`, `/guest`,
`/staff`, and public/hospitality-specific shared components/tests.

**Out of scope**: clinical/admin routes, business logic changes, invented live
metrics, stock imagery, and decorative video.

## Steps

1. Redesign landing around QMS Operations and its two suites. Remove claims such
   as static fake counts and copy that talks about “the UI” or “your theme”.
   Present role entry points and trust/privacy information plainly.
2. Redesign login/register with clear self-service roles, provisioned-role
   guidance, visible validation, password affordances, pending-email state, and
   accessible recovery links if implemented by Plan 002.
3. Restyle legal pages with readable measure, sticky table of contents on large
   screens, semantic headings, and print-safe styles. Do not change legal text.
4. Migrate guest and staff pages to the shared shell/components while preserving
   the transactional contracts from Plan 005. Emphasize current reservation,
   active requests, arrivals, room readiness, and conflict states.
5. Add screenshot/interaction tests at mobile and desktop, light and dark, then
   run the full gate.

## Done criteria

- [ ] Public identity represents both product suites accurately.
- [ ] No fabricated operational metric or implementation-focused copy remains.
- [ ] Auth role expectations are unambiguous.
- [ ] Guest/staff workflows remain fully covered and responsive.
- [ ] Accessibility and full verification pass.

## STOP conditions

- Legal text changes are required; request explicit approval.
- A page redesign needs an unfinished backend contract from Plan 005.
- Visual polish would reduce form clarity or data density.

## Maintenance notes

Public copy must describe user outcomes and real capabilities, never internal
component/framework decisions.

