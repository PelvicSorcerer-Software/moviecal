API design (outline)

- GET /api/search?q=:query — search TMDb (server-side proxy)
- GET /api/movie/:tmdbId — movie details (cached)
- GET /api/watchlist — list current user's watchlist (auth required)
- POST /api/watchlist — add movie to watchlist
- DELETE /api/watchlist/:id — remove from watchlist
- POST /api/subscription — create/regenerate calendar token
- DELETE /api/subscription/:id — revoke token
- GET /feed/:token.ics — iCalendar feed (no interactive auth; token grants access)

APIs should return well-formed JSON, follow REST conventions, and include proper auth/authorization.
