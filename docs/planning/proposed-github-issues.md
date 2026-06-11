# Proposed GitHub issue templates

Use these issue outlines when creating or updating GitHub issues. They are intentionally issue-number agnostic so they remain useful after issue cleanup.

## Baseline CI verify workflow

**Goal**: Ensure pull requests run the baseline project verification checks.

**Acceptance criteria**:
- Pull requests run lint, typecheck, unit tests, and build.
- Workflow uses a Node version compatible with the current app dependencies.
- Workflow does not require production secrets.

**Verification**:
- `npm run verify`
- GitHub Actions run on a pull request.

## Supabase environment and client setup

**Goal**: Add validated Supabase configuration and helper clients for browser/server usage.

**Acceptance criteria**:
- Client-safe values can be used in browser code.
- Service-role values are server-only.
- Missing required env values fail clearly.

**Verification**:
- `npm run typecheck`
- `npm run test`

## Database schema and RLS

**Goal**: Add schema and policies for movies, watchlist items, and calendar tokens.

**Acceptance criteria**:
- Tables, indexes, unique constraints, and foreign keys match the data model.
- RLS restricts user-owned data.
- Migration comments explain policy intent.

**Verification**:
- Supabase SQL verification command.
- `npm run test`

## Authentication foundation

**Goal**: Add sign-in/sign-out and protected pages/API routes.

**Acceptance criteria**:
- Users can sign in and out.
- Protected pages require a session.
- User-scoped API endpoints reject anonymous requests.

**Verification**:
- `npm run test`
- `npm run build`

## TMDb API wrapper

**Goal**: Add server-only TMDb search and details helpers.

**Acceptance criteria**:
- TMDb API key is never exposed client-side.
- Helpers return normalized fields.
- Error handling avoids leaking secrets.

**Verification**:
- `npm run test`

## Movie search page

**Goal**: Build the search UI and connect it to the server-side movie search endpoint.

**Acceptance criteria**:
- Search results show title and release-date information when available.
- Loading, empty, and error states are present.
- Add-to-watchlist affordance is visible for authenticated users.

**Verification**:
- `npm run test`
- `npm run build`

## Watchlist operations and page

**Goal**: Let authenticated users add, list, and remove saved movies.

**Acceptance criteria**:
- Users can manage only their own watchlist.
- Duplicate adds are handled safely.
- Watchlist page reflects current saved movies.

**Verification**:
- `npm run test`
- `npm run build`

## Calendar token model

**Goal**: Support one active private token per user and token rotation.

**Acceptance criteria**:
- Tokens are cryptographically unguessable.
- User can retrieve and rotate their token.
- Old token is invalid after rotation.

**Verification**:
- `npm run test`

## iCalendar generator and feed endpoint

**Goal**: Expose a tokenized calendar feed for watchlisted release dates.

**Acceptance criteria**:
- Valid token returns `text/calendar`.
- Invalid token returns `404`.
- Feed emits stable all-day events and skips unknown dates.
- Event UIDs do not depend on token value.

**Verification**:
- `npm run test`
- `npm run build`

## Scheduled release refresh and Vercel Cron

**Goal**: Refresh cached release dates on a protected schedule.

**Acceptance criteria**:
- Authorized scheduler can trigger refresh.
- Unauthorized calls are rejected.
- Cron setup and secret handling are documented.

**Verification**:
- `npm run test`
- `npm run build`

## Deployment and hardening

**Goal**: Document production setup and expand deterministic test coverage.

**Acceptance criteria**:
- Vercel and Supabase setup is documented.
- Required env vars are listed with no real secret values.
- Unit, integration, and E2E coverage is split into focused tasks.

**Verification**:
- `npm run verify`
