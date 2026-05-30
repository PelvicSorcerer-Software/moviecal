Data model (core entities)

- User
  - id (UUID)
  - email
  - password_hash (if using local auth) or external auth id

- Movie
  - id (internal)
  - tmdb_id
  - title
  - release_date (canonical)

- WatchlistItem
  - id
  - user_id
  - movie_id
  - added_at

- CalendarSubscription
  - id
  - user_id
  - token (unguessable)
  - created_at

Design decisions such as normalisation and indexes will be refined later.
