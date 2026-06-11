# Page map

Frontend pages and API routes for the MVP plan.

## Frontend pages

- `/` — landing page and app overview.
- `/sign-in` — sign-in page or Supabase-powered auth entry point.
- `/search` — movie search UI.
- `/movies/[tmdb_id]` — optional movie detail view.
- `/watchlist` — authenticated user's saved movies.
- `/settings/calendar` — calendar token management and subscription URL.

## API routes

- `/api/movies/search?q=` — server-side movie search proxy backed by TMDb.
- `/api/watchlist` — authenticated `GET` and `POST` watchlist operations.
- `/api/watchlist/[id]` — authenticated `DELETE` watchlist operation.
- `/api/calendar/[token]` — public tokenized calendar feed endpoint returning `text/calendar`.
- `/api/cron/refresh-releases` — protected scheduled release-date refresh endpoint.
