# GitHub issue hygiene plan

Use this checklist to keep GitHub issues aligned with the implementation plan. This is not a record of completed work; it is a maintenance guide for the issue board.

## CI and testing issues

- Maintain exactly one baseline CI issue for pull-request verification: lint, typecheck, unit tests, and build.
- Keep Playwright/E2E CI as a separate follow-up issue until the app has deterministic auth, TMDb, watchlist, and feed test fixtures.
- If a broad testing issue exists, convert it into an umbrella or close it in favor of focused unit, integration, E2E, and CI tasks.

## Feature issues

Each implementation issue should include:

- Background and scope.
- Acceptance criteria that are testable.
- Verification commands.
- Relevant docs to read.
- Security notes when the work touches auth, RLS, tokens, cron endpoints, or secrets.
- Clear out-of-scope items to prevent oversized PRs.

## Label guidance

- `docs`: documentation-only changes.
- `tests`: unit, integration, E2E, or CI verification changes.
- `auth`: Supabase Auth and session handling.
- `database`: schema, migrations, RLS, and data access.
- `tmdb`: TMDb wrapper and metadata work.
- `watchlist`: watchlist API and UI.
- `calendar`: calendar tokens, `.ics` generation, and feed endpoint.
- `deployment`: Vercel, cron, and production setup.
- `agent-ready`: only for issues that are small, current, and have acceptance criteria plus verification steps.
- `post-scaffold`: use only when it helps communicate dependency order; remove it when it is no longer useful.

## Milestone guidance

- Phase 1: Baseline cleanup and CI.
- Phase 2: Auth and Database.
- Phase 3: Search and Watchlist.
- Phase 4: Calendar Feed.
- Phase 5: Refresh and Deployment.
- Phase 6: Hardening.
