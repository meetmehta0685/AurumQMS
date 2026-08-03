# Plan 001: Establish a trustworthy verification baseline

> **Executor instructions**: Follow this plan step by step. Run every
> verification command before moving on. Touch only the files listed in Scope.
> If a STOP condition occurs, stop and report. Do not update
> `plans/README.md`; the reviewer owns the index.
>
> **Drift check (run first)**:
> `git diff --stat cce707b..HEAD -- package.json package-lock.json tests .github playwright.config.ts vitest.config.ts`
> Also inspect the primary working tree with
> `git -C /Users/meetmehta/Desktop/project/qms diff -- package.json package-lock.json`.
> Preserve its user-owned `pptxgenjs` changes while adding test tooling.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests, dx
- **Planned at**: commit `cce707b`, 2026-08-02

## Why this matters

The production build and TypeScript pass, but lint fails and the only test
constructs a fake driver that never opens the application. Later plans change
RLS, transactional workflows, and nearly every page; they need a one-command
baseline that catches real regressions without modifying live healthcare or
hospitality data.

## Current state

- `package.json:5-10` has `build`, `lint`, and
  `test:selenium:fake`, but no typecheck, unit-test, E2E, or aggregate verify
  command.
- `tests/selenium/fake-login.selenium.test.js:1-4` explicitly describes itself
  as fake and creates its own `FakeWebDriver`.
- `npm run lint` currently fails on the CommonJS `require` in that fake test.
- The primary working tree has user-owned uncommitted `pptxgenjs` changes in
  `package.json` and `package-lock.json`; they must survive this plan.
- Existing route/auth helpers in `lib/auth/roles.ts` and schemas in
  `lib/validations/*.ts` are good unit-test seams.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `npm install` | exit 0 and lockfile updated |
| Unit tests | `npm test` | exit 0, all Vitest tests pass |
| Browser smoke | `npm run test:e2e` | exit 0, all public/guard smoke tests pass |
| Typecheck | `npm run typecheck` | exit 0, no errors |
| Lint | `npm run lint` | exit 0 |
| Build | `npm run build` | exit 0 |
| Full gate | `npm run verify` | exit 0 |

## Scope

**In scope**:

- `package.json`, `package-lock.json`
- `vitest.config.ts`, `playwright.config.ts`
- `tests/unit/**`, `tests/e2e/**`
- delete `tests/selenium/fake-login.selenium.test.js`
- `.github/workflows/ci.yml`
- `.gitignore` only if Playwright artifacts need ignored entries

**Out of scope**:

- Application runtime code under `app/`, `components/`, `hooks/`, and `lib/`
- Supabase SQL and any live Supabase mutation
- Presentation scripts and generated artifacts
- Any primary-working-tree change or merge

## Git workflow

- Branch: `codex/001-verification-baseline`
- Commit once with `test: establish real verification baseline`.
- Do not push or merge.

## Steps

### Step 1: Replace the fake runner with real test tooling

Add Vitest, jsdom, Testing Library packages, and `@playwright/test` as dev
dependencies. Preserve `pptxgenjs` from the primary working tree. Add scripts:
`typecheck`, `test`, `test:watch`, `test:e2e`, and `verify`. `verify` must run
lint, typecheck, unit tests, and build; keep E2E separate for CI after build.
Delete the fake Selenium file.

**Verify**: `npm ls vitest @playwright/test @testing-library/react` → all are
installed with exit 0.

### Step 2: Add deterministic unit coverage

Configure Vitest with the `@/` alias and jsdom. Add tests for:

- `lib/auth/roles.ts`: every protected prefix, unknown route, every home route,
  and fallback to patient.
- `lib/validations/auth.ts`: valid inputs, malformed email, short password, and
  every currently accepted role. Do not change the current role behavior here;
  Plan 002 will change the expectations.
- `lib/validations/appointments.ts`: valid date/time and invalid formats.

Tests must import production modules and assert returned values; no snapshots.

**Verify**: `npm test` → all tests pass and at least 15 assertions execute.

### Step 3: Add non-mutating browser smoke tests

Configure Playwright to start `npm run dev` on port 3100. Add tests that:

- Load `/`, `/login`, `/register`, `/privacy`, and `/terms` and assert one
  route-specific heading on each.
- Submit empty login and registration forms and assert validation text.
- Request `/patient`, `/doctor`, `/admin`, `/lab`, `/pharma`, `/guest`, and
  `/staff` while signed out and assert redirection to `/login`.

Do not create users, log in, or send any state-changing request. If local env
files are required for browser rendering, link them from the primary working
tree for verification only; never commit or print their values.

**Verify**: `npm run test:e2e` → all smoke tests pass with no retries required.

### Step 4: Add CI and a single local gate

Add a GitHub Actions workflow for Node 20 using `npm ci`, Playwright Chromium
installation, `npm run verify`, and `npm run test:e2e`. Cache npm downloads.
Ensure test reports, traces, and screenshots are ignored.

**Verify**: `npm run verify && npm run test:e2e` → exit 0.

## Test plan

- Unit: route authorization mappings and Zod boundary validation.
- Browser: public route render, client validation, and signed-out guards.
- No test may contain production-like credentials or mutate Supabase.

## Done criteria

- [ ] Fake Selenium file and script are gone.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and
      `npm run test:e2e` all exit 0.
- [ ] `npm run verify` exits 0.
- [ ] CI runs the same gates.
- [ ] User-owned `pptxgenjs` manifest/lockfile changes remain present.
- [ ] No file outside Scope is modified.

## STOP conditions

- The primary working tree's package changes cannot be preserved cleanly.
- Browser smoke tests require creating or mutating a live account.
- A public page fails because the configured Supabase project is unavailable;
  report the route and error rather than weakening the test.
- Any application runtime file appears necessary to make tests pass.

## Maintenance notes

Every later plan must extend these tests before changing a workflow. Keep E2E
fixtures non-destructive until a disposable local Supabase environment is added.

