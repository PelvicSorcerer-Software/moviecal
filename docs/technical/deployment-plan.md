# Deployment plan

## Environments

- Development: local Next.js app and local or disposable Supabase project.
- Production: Vercel hosting and Supabase project.

## Environment variables

Use `.env.example` as the canonical placeholder list. Set real values in `.env.local` for local development and in Vercel/Supabase secret stores for hosted environments.

Client-safe values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-only values:

- `SUPABASE_SERVICE_ROLE_KEY`
- `TMDB_API_KEY`
- `CRON_SECRET`

## Deployment steps

1. Create a Supabase project.
2. Apply database schema and RLS migrations.
3. Create a Vercel project linked to the GitHub repository.
4. Add required environment variables in Vercel.
5. Deploy the Next.js app.
6. Configure Vercel Cron to call `/api/cron/refresh-releases` with `CRON_SECRET` in `Authorization: Bearer <CRON_SECRET>` or the fallback `x-cron-secret` header.
7. Run post-deploy smoke checks for public pages, authenticated flows, calendar feed, and scheduled refresh protection.

## Security notes

- Keep credentials out of the repository.
- Do not paste real calendar tokens in public issues, logs, screenshots, or PR descriptions.
- Treat calendar URLs as bearer credentials.
- Monitor logs for calendar endpoint abuse, TMDb rate limiting, and cron failures.
