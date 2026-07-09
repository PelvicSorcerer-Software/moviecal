-- Issue #138: Grant service_role execute on functions called via the admin client.
-- The watchlist repository calls ensure_personal_watchlist_for_user through
-- the service role client (adminClient) in ensurePersonalWatchlist.

grant execute on function public.ensure_personal_watchlist_for_user(uuid) to service_role;
