Requirements

Functional requirements
- Users can search for movies (TMDb-backed search).
- Users can add and remove movies from a personal watchlist.
- Users can create a private calendar subscription (unguessable token) that exposes their watchlist release dates in iCalendar format.
- Calendar feed updates when movie release dates change.

Non-functional requirements
- Privacy: feeds are private and accessible only via token-bearing URLs.
- Security: tokens and API keys are stored in environment/secret stores, never in source.
- Reliability: calendar feed should be available and reasonably performant.
- Observability: critical errors and token misuse should be logged (without leaking tokens).
