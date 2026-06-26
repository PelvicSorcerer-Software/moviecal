import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireAuthenticatedPageSession } from '../../../lib/auth/session';
import {
  E2E_USER,
  findE2EWatchlist,
  readE2EWatchlistItemsForWatchlist,
} from '../../../lib/e2e/fixtures';
import {
  createServerSupabaseClient,
  createServerSupabaseServiceRoleClient,
} from '../../../lib/supabase/server';
import { createSupabaseWatchlistRepository } from '../../../lib/supabase/watchlist';
import { SupabaseEnvironmentError } from '../../../lib/supabase/env';
import {
  getWatchlistDetail,
  WatchlistAccessError,
  WatchlistDataError,
  WatchlistNotFoundError,
} from '../../../lib/watchlist';
import { WatchlistDetailClient } from '../watchlist-detail-client';

export const metadata: Metadata = {
  title: 'Watchlist detail | moviecal',
  description: 'Review and manage movies saved to an authorized moviecal watchlist.',
};

export default async function WatchlistDetailPage({
  params,
}: {
  params: Promise<{ watchlistId: string }>;
}) {
  const { watchlistId } = await params;
  const { accessToken, user } = await requireAuthenticatedPageSession(
    `/watchlist/${watchlistId}`,
  );

  try {
    if (user.id === E2E_USER.id) {
      const cookieStore = await cookies();
      const watchlist = findE2EWatchlist(cookieStore, watchlistId);

      if (!watchlist) {
        notFound();
      }

      const items = readE2EWatchlistItemsForWatchlist(cookieStore, watchlistId);

      return (
        <section className="space-y-8">
          <div className="rounded-3xl bg-slate-950 px-8 py-10 text-white shadow-xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-200">
              Watchlist detail
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight">{watchlist.name}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200">
              Review the movies saved to this authorized {watchlist.kind} watchlist without
              exposing any other list metadata.
            </p>
            <p className="mt-5 text-sm text-slate-300">
              <Link href="/watchlist" className="font-medium text-white underline underline-offset-4">
                Back to all watchlists
              </Link>
            </p>
          </div>

          <WatchlistDetailClient initialItems={items} watchlist={watchlist} />
        </section>
      );
    }

    const repository = createSupabaseWatchlistRepository({
      userClient: createServerSupabaseClient(accessToken),
      adminClient: createServerSupabaseServiceRoleClient(),
    });
    const detail = await getWatchlistDetail({
      actorUserId: user.id,
      repository,
      watchlistId,
    });

    return (
      <section className="space-y-8">
        <div className="rounded-3xl bg-slate-950 px-8 py-10 text-white shadow-xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-200">
            Watchlist detail
          </p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight">{detail.watchlist.name}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200">
            Review the movies saved to this authorized {detail.watchlist.kind} watchlist without
            exposing any other list metadata.
          </p>
          <p className="mt-5 text-sm text-slate-300">
            <Link href="/watchlist" className="font-medium text-white underline underline-offset-4">
              Back to all watchlists
            </Link>
          </p>
        </div>

        <WatchlistDetailClient
          initialItems={detail.items}
          watchlist={detail.watchlist}
        />
      </section>
    );
  } catch (error) {
    if (
      error instanceof WatchlistAccessError ||
      error instanceof WatchlistNotFoundError
    ) {
      notFound();
    }

    if (error instanceof SupabaseEnvironmentError) {
      return (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-sm">
          <p className="font-semibold text-rose-900">Watchlist detail unavailable</p>
          <p className="mt-2 leading-6">
            Watchlist detail is unavailable until Supabase is configured for this environment.
          </p>
        </section>
      );
    }

    if (error instanceof WatchlistDataError) {
      return (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-sm">
          <p className="font-semibold text-rose-900">Watchlist detail unavailable</p>
          <p className="mt-2 leading-6">{error.message}</p>
        </section>
      );
    }

    throw error;
  }
}
