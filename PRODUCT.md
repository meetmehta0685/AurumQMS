# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary users are people operating or receiving care through a quality
management system: patients, doctors, administrators, laboratory technicians,
and pharmacy staff. The product also serves hotel guests and hospitality staff
through a separate stay-operations suite.

## Product Purpose

AURUM QMS brings care operations and stay operations into one role-aware
web application. It supports appointments, queues, patient records,
laboratory orders and reports, pharmacy fulfillment, discharge workflows,
room allocation, reservations, and guest service requests. Success means each
role can find its current work, understand status, and complete the next
operational action with confidence.

## Positioning

The product's distinct mechanism is a shared operational state across clinical
and hospitality workflows: role-specific workspaces expose the same dependable
status, routing, and audit vocabulary while keeping each user's task focused.

## Operating Context

Users work in authenticated role workspaces with Supabase-backed data and
role-aware access. Clinical users work with appointments, queues, records,
diagnostics, pharmacy, and discharge. Hospitality users work with
reservations, rooms, allocations, and concierge requests. The application is
used on desktop and mobile web surfaces.

## Capabilities and Constraints

- Next.js App Router with React Server Components where applicable.
- Supabase authentication, profiles, relational data, and row-level security.
- Roles: patient, doctor, admin, lab, pharma, guest, and staff.
- Existing workflows and business behavior must remain intact during visual
  redesign.
- UI must be composed from shadcn/ui primitives and semantic global design
  tokens; route-level raw color systems are not part of the target system.
- Existing iconography uses Lucide.

## Brand Commitments

The product identity is AURUM QMS, with the Care Operations and Stay
Operations suites. Existing legal routes, authentication flows, and the
product's workflow terminology remain part of the product truth.

## Evidence on Hand

- `plans/007-design-system-shell.md` defines the shared shell direction and
  scope.
- `plans/README.md` records the role and workflow map.
- `app/` contains the active route and workflow implementations.
- `supabase/` contains the schema, seed data, and security policies.

## Product Principles

- Put the current task and next action in view.
- Make operational status easy to scan and hard to misread.
- Keep role boundaries clear without fragmenting the product vocabulary.
- Preserve familiar web affordances and accessible interaction patterns.
- Favor dependable, legible information over decorative complexity.

## Accessibility & Inclusion

The web application should maintain keyboard-visible focus, semantic labels,
screen-reader names for icon-only controls, responsive layouts without
horizontal overflow, and sufficient contrast in light and dark themes.
