# Implementation plan

This plan defines the intended path from the current scaffold to the MVP. It is intentionally forward-looking: use GitHub issues for task execution and do not treat this document as a progress tracker.

## Phase 1: Baseline cleanup and CI

- **Goal**: Make the scaffold reliable enough for feature work.
- **Deliverables**:
  - README and env template that match the scaffold.
  - Canonical route names documented consistently.
  - Pull-request CI that runs the same baseline checks as local verification.
  - Issue board cleanup so duplicate or overlapping work is explicit.
- **Dependencies**: Existing scaffold.
- **Exit criteria**:
  - `npm run verify` passes locally.
  - CI runs lint, typecheck, unit tests, and build on pull requests.
  - E2E test integration is documented as a later focused task.

## Phase 2: Auth and database foundation

- **Goal**: Establish user identity, database schema, and per-user data isolation.
- **Deliverables**:
  - Supabase environment validation.
  - Browser-safe and server-only Supabase helpers.
  - SQL migrations for `movies`, `watchlist_items`, and `calendar_tokens`.
  - RLS policies for user-owned data.
  - Sign-in/sign-out flow and protected pages/routes.
- **Dependencies**: Phase 1 baseline.
- **Exit criteria**:
  - Authenticated routes reject anonymous users.
  - Users can only access their own watchlist/token rows.
  - Service-role credentials are never exposed to the client.

## Phase 3: TMDb movie search

- **Goal**: Let authenticated users search for movies using TMDb without exposing TMDb credentials.
- **Deliverables**:
  - Server-side TMDb wrapper for search and details.
  - Normalized movie metadata types.
  - Search endpoint and `/search` UI.
  - Loading, empty, and error states.
- **Dependencies**: Phase 2 auth/database baseline.
- **Exit criteria**:
  - Movie search returns normalized titles and release dates when available.
  - TMDb errors are handled cleanly.
  - Tests use mocked TMDb responses.

## Phase 4: Watchlist MVP

- **Goal**: Let users save, view, and remove movies in a persistent private watchlist.
- **Deliverables**:
  - Authenticated watchlist API operations.
  - Movie metadata cache upsert when adding a movie.
  - `/watchlist` page with remove actions.
  - Duplicate-add handling.
- **Dependencies**: Phase 3 TMDb integration.
- **Exit criteria**:
  - Users can manage only their own saved movies.
  - Duplicate watchlist entries are prevented by constraints and app logic.
  - Watchlist UI reflects successful add/remove operations.

## Phase 5: Calendar feed MVP

- **Goal**: Provide a private iCalendar feed for each user's watchlist.
- **Deliverables**:
  - One active unguessable calendar token per user.
  - Token rotation that invalidates the previous token.
  - Deterministic iCalendar generator.
  - Public tokenized calendar feed route returning `text/calendar`.
- **Dependencies**: Phase 4 watchlist functionality.
- **Exit criteria**:
  - Valid tokens return an iOS-compatible `.ics` feed.
  - Invalid tokens return `404`.
  - Feed events use stable UIDs independent of token value.
  - Movies without release dates are skipped for MVP.

## Phase 6: Release-date refresh

- **Goal**: Keep cached release dates current without querying TMDb on every calendar request.
- **Deliverables**:
  - Protected scheduled refresh endpoint.
  - Vercel Cron configuration.
  - Refresh logic for tracked movies.
  - Logging for refresh failures and rate-limit responses.
- **Dependencies**: Phase 5 feed endpoint.
- **Exit criteria**:
  - Authorized scheduler calls refresh release dates.
  - Unauthorized calls are rejected.
  - Calendar output reflects refreshed cached dates.

## Phase 7: Deployment

- **Goal**: Deploy the MVP safely on Vercel and Supabase.
- **Deliverables**:
  - Production Supabase project setup notes.
  - Vercel deployment and environment-variable instructions.
  - Post-deploy smoke checks.
  - Security reminders for secrets and public calendar URLs.
- **Dependencies**: Phases 1-6.
- **Exit criteria**:
  - A maintainer can deploy using documented steps.
  - No secrets are committed to the repository.

## Phase 8: Hardening and polish

- **Goal**: Improve confidence, security, and user experience after the MVP path is functional.
- **Deliverables**:
  - Unit tests for utility logic and iCalendar formatting.
  - Integration tests for mocked Supabase and TMDb boundaries.
  - Playwright coverage for main user flows.
  - Error handling, accessibility pass, and observability notes.
- **Dependencies**: Feature surfaces from Phases 2-7.
- **Exit criteria**:
  - Critical regressions are covered by deterministic tests.
  - CI gates are appropriate for the available mocks and secrets.
