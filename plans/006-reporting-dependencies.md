# Plan 006: Correct reporting, dates, performance, and vulnerable dependencies

> Follow every step and gate. Drift check: `git diff --stat cce707b..HEAD -- app/'(dashboard)'/admin components/notifications app/staff package.json package-lock.json next.config.ts lib tests`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: Plans 001, 003, 004, and 005
- **Category**: bug, perf, migration
- **Planned at**: commit `cce707b`, 2026-08-02

## Why this matters

Week/month metrics include unlimited future appointments and Sunday computes the
wrong week start. Many “today” views use UTC dates, which are wrong during early
morning in Asia/Kolkata. Reports also issue query-per-department and
query-per-doctor requests. The pinned Next.js version has high advisories.

## Scope

**In scope**: shared date utilities, report/notification/today call sites,
report aggregation RPCs, dependency manifests/config, and tests.

**Out of scope**: domain-state redesign and visual redesign.

## Steps

1. Introduce one tested business-date utility with an explicit configured
   timezone (default `Asia/Kolkata`, override through server-only config). Replace
   `toISOString().split('T')[0]` date derivations.
2. Correct inclusive week/month start and end boundaries, including Sunday,
   month-end, year-end, and daylight-saving zones in tests.
3. Replace admin N+1 counts with one role-protected aggregate RPC or bounded
   grouped queries. Return typed data and explicit query errors.
4. Upgrade Next.js and directly coupled packages to versions without the high
   advisories reported by `npm audit`. Follow official migration notes and do
   not run force-fix blindly.
5. Run unit, E2E, build, and `npm audit --omit=dev --audit-level=high`.

## Done criteria

- [ ] No authored runtime file derives a business date with UTC string slicing.
- [ ] Week/month metrics have both lower and upper bounds.
- [ ] Report requests are bounded rather than proportional to doctor/department
      count.
- [ ] Production dependency audit reports zero high/critical issues, or every
      remaining issue is documented as unreachable with evidence.
- [ ] Full verification passes.

## STOP conditions

- Upgrade requires a major framework migration beyond this plan's scope.
- Business timezone must vary per tenant but there is no tenant model; stop for
  a product decision.

## Maintenance notes

All reporting periods must use the shared business-date utility and server-side
aggregate boundary.

