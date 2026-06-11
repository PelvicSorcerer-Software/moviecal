# moviecal

moviecal is a personal movie watchlist web app that lets users search TMDb, save movies to a private watchlist, and subscribe to a private iCalendar (`.ics`) feed compatible with iOS Calendar. The feed provides one all-day event per movie release date and stays up-to-date when release dates change.

Status: Scaffold complete; MVP implementation pending.

## Planned tech stack

- Next.js App Router with strict TypeScript
- Tailwind CSS
- Supabase Auth and Postgres with Row Level Security
- TMDb API for movie metadata
- Vercel hosting and Vercel Cron
- Vitest, Playwright, and GitHub Actions

## Local development

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in local development values.
3. Start the development server: `npm run dev`
4. Run the baseline checks before opening a PR: `npm run verify`

The current application routes are an early scaffold. Product features such as Supabase auth, TMDb search, persistent watchlists, calendar token rotation, and release-date refresh are planned but not implemented yet.

## Documentation

See `docs/` for product, design, technical, and planning notes. Planning docs describe the intended implementation sequence instead of acting as a progress tracker.

## Security

This is a public repository. Do **not** commit secrets, API keys, service-role keys, `.env` files, tokens, private URLs, or real user data. Keep real values in local environment files and hosting-provider secret stores. See `docs/technical/auth-and-security.md` for details.
