# Plan 007: Build the shared QMS visual system and application shell

> Invoke the `frontend-design` skill if available. Follow every step and gate.
> Drift check: `git diff --stat cce707b..HEAD -- app/globals.css app/layout.tsx components app/'(dashboard)'/layout.tsx tests`

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: Plans 001 and 002
- **Category**: direction, tech-debt
- **Planned at**: commit `cce707b`, 2026-08-02

## Why this matters

Every page currently assembles its own header, spacing, status colors, loading
state, and navigation. The landing page brands only hospitality while clinical
pages use inconsistent “HealthCare” labels. A shared shell must be established
before migrating dozens of routes.

## Design direction

Create **QMS Operations** with Care Operations and Stay Operations suites.
Use warm ivory/ink foundations, eucalyptus/teal for care, oxidized gold for
hospitality, and vermilion only for urgent/destructive states. Retain Manrope,
Fraunces, and IBM Plex Mono. The memorable element is a precise operational
rail: suite-colored edge marker, live context label, and compact status rhythm.
Motion should explain navigation and state changes, honor
`prefers-reduced-motion`, and never delay task completion.

## Current state

- `app/globals.css:6-190` defines tokens but repeats fallback font families and
  applies decorative global backgrounds.
- `app/layout.tsx:25-28` identifies the whole app as a hospitality platform.
- Route pages repeatedly implement sticky headers and loading skeletons.
- Existing shadcn primitives under `components/ui` should remain low-level
  building blocks, not be rewritten wholesale.

## Scope

**In scope**: global tokens/typography/metadata, shared shell/navigation,
`PageHeader`, `Metric`, `StatusBadge`, `EmptyState`, `ErrorState`, `DataToolbar`,
loading patterns, and focused visual/accessibility tests.

**Out of scope**: migrating every route's content, changing business logic,
adding a new animation dependency, and replacing shadcn primitives wholesale.

## Steps

1. Define semantic tokens for care/stay suites, success/warning/info/urgent,
   surfaces, focus, charts, and density. Ensure WCAG AA text contrast in light
   and dark themes.
2. Build responsive `AppShell` with desktop rail, mobile sheet, role-aware nav,
   suite identity, theme control, notifications slot, user menu, skip link, and
   active-route semantics.
3. Build shared page/data-state components with variants, accessible labels,
   keyboard focus, reduced-motion behavior, and no nested-card default.
4. Integrate shell at the dashboard layout boundary without changing workflow
   content. Update root metadata to QMS Operations.
5. Add Storybook only if already available; otherwise use component tests and a
   dedicated internal showcase route excluded from production navigation.
6. Verify at 375, 768, 1280, and 1440 widths, light/dark, keyboard-only, and
   reduced motion. Run `npm run verify`.

## Done criteria

- [ ] One shell serves every authenticated role with correct navigation.
- [ ] Shared status/data-state components replace no business logic yet.
- [ ] Light/dark contrast and keyboard checks pass.
- [ ] No horizontal overflow at required widths.
- [ ] Full verification passes.

## STOP conditions

- Role navigation contracts from Plan 002 are not stable.
- A shared component requires altering workflow behavior.
- Visual verification reveals a theme that cannot meet AA without changing the
  approved direction; report the conflicting tokens.

## Maintenance notes

Route migrations must consume semantic components; they should not recreate
suite colors or status mappings locally.

