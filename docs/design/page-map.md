# Page map

Frontend pages and API routes for the MVP plan.

## Frontend pages

- `/` — landing page and app overview.
- `/sign-in` — sign-in page or Supabase-powered auth entry point.
- `/search` — movie search UI.
- `/movies/[tmdb_id]` — optional movie detail view.
- `/watchlist` — authenticated watchlist overview showing the signed-in user's personal watchlist plus shared watchlists they belong to. Personal item management stays on this page for now.
- `/watchlist/[watchlistId]` — reserved follow-up route contract for shared-watchlist detail and invite-aware navigation.
- `/settings/calendar` — calendar token management and subscription URL.

## API routes

- `/api/movies/search?q=` — server-side movie search proxy backed by TMDb.
- `/api/watchlist` — authenticated `GET` and `POST` watchlist operations.
- `/api/watchlist/shared` — authenticated `POST` endpoint for creating a shared watchlist owned by the current user.
- `/api/watchlist/[id]` — authenticated `DELETE` watchlist operation.
- `/api/calendar/[token]` — public tokenized calendar feed endpoint returning `text/calendar`.
- `/api/cron/refresh-releases` — protected scheduled release-date refresh endpoint.
