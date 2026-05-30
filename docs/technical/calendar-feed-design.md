Calendar feed design

- Feed format: RFC 5545 iCalendar (.ics) per-user feed accessible via an unguessable token URL.
- Token security: tokens must be high-entropy, stored hashed in the DB if feasible, and revocable.
- Event UIDs: deterministic stable UIDs derived from movie TMDb id + release date (e.g. hash(tmdbId + releaseDate)) so updates replace existing events in client calendars.
- Event content: include title, release date (as all-day event if appropriate), TMDb link, and source metadata.
- Caching: implement caching for feed generation to avoid heavy compute on each request; invalidate cache on relevant changes.
- Rate limiting and abuse detection for feed requests.
