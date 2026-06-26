import Link from 'next/link';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { requireAuthenticatedPageSession } from '../../../lib/auth/session';
import {
  getE2EActiveInviteLink,
  getE2EWatchlistAccess,
  listE2EWatchlistMembers,
} from '../../../lib/e2e/shared-watchlists';
import {
  findE2EUserById,
  hasE2EAuthenticatedSession,
  readE2EUser,
} from '../../../lib/e2e/fixtures';
import {
  createServerSupabaseClient,
  createServerSupabaseServiceRoleClient,
} from '../../../lib/supabase/server';
import { createSupabaseWatchlistRepository } from '../../../lib/supabase/watchlist';
import {
  getSharedWatchlistInviteLinkStatus,
  listSharedWatchlistMembers,
  type WatchlistMember,
  type WatchlistSummary,
} from '../../../lib/watchlist';
import { SharedWatchlistPageClient } from './shared-watchlist-page-client';

export const metadata: Metadata = {
  title: 'Shared watchlist | moviecal',
  description: 'Inspect shared watchlist access, invite collaborators, and manage current members.',
};

interface MemberEntry {
  acceptedAt: string | null;
  canRemove: boolean;
  email: string | null;
  id: string;
  isCurrentUser: boolean;
  isOwner: boolean;
  role: 'owner' | 'editor';
}

async function resolveUserEmailMap(userIds: string[]): Promise<Record<string, string | null>> {
  const adminClient = createServerSupabaseServiceRoleClient();
  const userEmailEntries = await Promise.all(
    [...new Set(userIds)].map(async (userId) => {
      const userResponse = await adminClient.auth.admin.getUserById(userId);

      return [userId, userResponse.data.user?.email ?? null] as const;
    }),
  );

  return Object.fromEntries(userEmailEntries);
}

function mapMemberEntries(args: {
  actorUserId: string;
  emailsByUserId: Record<string, string | null>;
  members: WatchlistMember[];
  watchlist: WatchlistSummary;
}): MemberEntry[] {
  return args.members.map((member) => ({
    acceptedAt: member.acceptedAt,
    canRemove: member.role !== 'owner',
    email: args.emailsByUserId[member.userId] ?? null,
    id: member.id,
    isCurrentUser: member.userId === args.actorUserId,
    isOwner: member.role === 'owner',
    role: member.role,
  }));
}

export default async function SharedWatchlistPage(
  context: { params: Promise<{ watchlistId: string }> },
) {
  const { watchlistId } = await context.params;
  const { accessToken, user } = await requireAuthenticatedPageSession(
    `/watchlist/${watchlistId}`,
  );
  let watchlist: WatchlistSummary | null = null;
  let ownerCanManage = false;
  let activeInviteLinkExists = false;
  let memberEntries: MemberEntry[] = [];

  const cookieStore = await cookies();

  if (hasE2EAuthenticatedSession(cookieStore) && user.id === readE2EUser(cookieStore).id) {
    const access = getE2EWatchlistAccess(cookieStore, user.id, watchlistId);

    if (!access) {
      notFound();
    }

    watchlist = access.watchlist;
    ownerCanManage = watchlist.ownerUserId === user.id;
    activeInviteLinkExists = ownerCanManage
      && getE2EActiveInviteLink(cookieStore, watchlistId) !== null;

    if (ownerCanManage) {
      const members = [
        {
          acceptedAt: null,
          id: `owner:${watchlist.ownerUserId}`,
          invitedByUserId: null,
          role: 'owner' as const,
          userId: watchlist.ownerUserId,
          watchlistId: watchlist.id,
        },
        ...listE2EWatchlistMembers(cookieStore, watchlistId),
      ];
      const emailsByUserId = Object.fromEntries(
        members.map((member) => [
          member.userId,
          findE2EUserById(member.userId)?.email ?? null,
        ]),
      );

      memberEntries = mapMemberEntries({
        actorUserId: user.id,
        emailsByUserId,
        members,
        watchlist,
      });
    }
  } else {
    const repository = createSupabaseWatchlistRepository({
      userClient: createServerSupabaseClient(accessToken),
      adminClient: createServerSupabaseServiceRoleClient(),
    });
    const access = await repository.getWatchlistAccess(user.id, watchlistId);

    if (access.status !== 'authorized' || access.watchlist.kind !== 'shared') {
      notFound();
    }

    watchlist = access.watchlist;
    ownerCanManage = watchlist.ownerUserId === user.id;

    if (ownerCanManage) {
      const members = await listSharedWatchlistMembers({
        actorUserId: user.id,
        repository,
        watchlistId,
      });
      const emailsByUserId = await resolveUserEmailMap(
        members.map((member) => member.userId),
      );

      memberEntries = mapMemberEntries({
        actorUserId: user.id,
        emailsByUserId,
        members,
        watchlist,
      });
      activeInviteLinkExists = (
        await getSharedWatchlistInviteLinkStatus({
          actorUserId: user.id,
          repository,
          watchlistId,
        })
      ) !== null;
    }
  }

  if (!watchlist) {
    notFound();
  }

  return (
    <section className="space-y-8">
      <div className="rounded-3xl bg-slate-950 px-8 py-10 text-white shadow-xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-200">
          Shared watchlist
        </p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight">{watchlist.name}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200">
          Use this page to confirm who can access the shared watchlist today. Shared
          movie add and remove flows will build on this route next.
        </p>
        <div className="mt-6">
          <Link
            href="/watchlist"
            className="inline-flex rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
          >
            Back to watchlists
          </Link>
        </div>
      </div>

      <SharedWatchlistPageClient
        activeInviteLinkExists={activeInviteLinkExists}
        initialMembers={memberEntries}
        ownerCanManage={ownerCanManage}
        watchlist={watchlist}
      />
    </section>
  );
}
