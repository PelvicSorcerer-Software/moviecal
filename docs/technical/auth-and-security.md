Auth and security

- Authentication: use a proven provider (e.g., Supabase/Auth, OAuth providers) or JWT-backed sessions. Prefer provider-managed auth for MVP if it accelerates delivery.
- Authorization: ensure endpoints validate that a user can only access their own watchlist and subscriptions.
- Secrets: never commit keys/secrets; load from environment or secret manager.
- Calendar tokens: treat as bearer secrets; allow regeneration and revocation.
- Logging: avoid logging tokens or PII. Sanitize logs before storing.
- Data protection: follow least-privilege access patterns in DB and backups.
