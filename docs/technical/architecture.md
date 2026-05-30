Architecture (high level)

- Frontend: TypeScript-based web UI (SPA/SSR) that calls backend APIs.
- Backend API: TypeScript Node service exposing search, watchlist, and feed endpoints.
- Data store: relational DB for users, watchlists, subscriptions; cache for TMDb results.
- Background updater: scheduled job to reconcile release date changes and update feeds.
- External: TMDb API for movie metadata; calendar consumers (iOS Calendar) access per-user feed URLs.

Keep architecture simple and conventional; prefer well-understood patterns.
