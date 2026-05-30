TMDb integration

- Use TMDb API for search and movie metadata. Store TMDb IDs in local DB.
- Do not commit TMDb API keys. Keep keys in environment/secret manager.
- Respect TMDb rate limits; add caching for frequent queries.
- Consider nightly reconcile jobs for corrected release dates (and notify users via feed updates).
