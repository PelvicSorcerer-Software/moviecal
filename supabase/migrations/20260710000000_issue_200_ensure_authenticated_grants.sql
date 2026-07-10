-- Idempotent re-application of authenticated role table grants.
-- Migration 20260709000002 introduced these grants but may not have been
-- applied to all environments. GRANT is a no-op if the privilege already
-- exists, so this is safe to run against any state.
grant select, insert, update, delete on table public.movies to authenticated;
grant select, insert, update, delete on table public.watchlists to authenticated;
grant select, insert, update, delete on table public.watchlist_items to authenticated;
grant select, insert, update, delete on table public.watchlist_memberships to authenticated;
grant select, insert, update, delete on table public.watchlist_invite_links to authenticated;
grant select, insert, update, delete on table public.calendar_tokens to authenticated;

grant select on table public.movies to anon;
