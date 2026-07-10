/**
 * Real-stack test for listWatchlistsForUser.
 *
 * Requires a running local Supabase instance (started via `supabase start`).
 * The vitest.real-stack.config.ts injects default local credentials so no
 * manual env-var setup is needed when running against a local stack.
 *
 * This test verifies that the authenticated role has the SELECT grants it
 * needs on `watchlists` and `watchlist_memberships`. Those grants are
 * introduced by migration 20260709000002 and re-applied idempotently by
 * 20260710000000. Without them, listWatchlistsForUser silently returns []
 * for authenticated users — the bug described in issue #200.
 *
 * Lane: real-stack (npm run lane:real-stack)
 */

import { randomUUID } from 'node:crypto';

import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Database } from '../src/lib/supabase/database';
import { createSupabaseWatchlistRepository } from '../src/lib/supabase/watchlist';
import { listUserWatchlists } from '../src/lib/watchlist';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

/**
 * Probe whether a local Supabase stack is reachable at the configured URL.
 * Returns true when any HTTP response is received (including 401/403, which
 * mean the server is up but auth failed — that's fine for this check).
 */
async function isSupabaseReachable(url: string): Promise<boolean> {
  try {
    await fetch(`${url}/rest/v1/`, {
      signal: AbortSignal.timeout(3000),
    });

    return true;
  } catch {
    return false;
  }
}

const supabaseReachable = await isSupabaseReachable(SUPABASE_URL);

describe.skipIf(!supabaseReachable)(
  'listWatchlistsForUser — real-stack (requires local Supabase)',
  () => {
    const adminClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let testUserId = '';
    let testUserEmail = '';
    let testUserPassword = '';

    beforeAll(async () => {
      const runId = randomUUID().replace(/-/g, '').slice(0, 12);
      testUserEmail = `real-stack-wl-${runId}@moviecal.test`;
      testUserPassword = `Moviecal-${runId}-Aa1!`;

      const { data, error } = await adminClient.auth.admin.createUser({
        email: testUserEmail,
        email_confirm: true,
        password: testUserPassword,
      });

      if (error ?? !data.user) {
        throw new Error(
          `real-stack: could not create disposable test user: ${error?.message ?? 'no user returned'}`,
        );
      }

      testUserId = data.user.id;
    });

    afterAll(async () => {
      if (testUserId) {
        await adminClient.auth.admin.deleteUser(testUserId);
      }
    });

    it('returns the personal watchlist with canEdit: true for an authenticated user', async () => {
      // Sign in with the disposable user to obtain a real JWT that causes
      // Supabase to evaluate requests as the `authenticated` role.
      const anonClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: signInData, error: signInError } =
        await anonClient.auth.signInWithPassword({
          email: testUserEmail,
          password: testUserPassword,
        });

      expect(signInError).toBeNull();
      expect(signInData.session?.access_token).toBeTruthy();

      const accessToken = signInData.session!.access_token;

      // Mirror the client setup in src/app/search/page.tsx:
      //   userClient  — authenticated JWT; queries run as `authenticated` role
      //   adminClient — service_role key; bypasses RLS for ensurePersonalWatchlist
      const userClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      });

      const serviceClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const repository = createSupabaseWatchlistRepository({
        userClient,
        adminClient: serviceClient,
      });

      const watchlists = await listUserWatchlists({
        repository,
        userId: testUserId,
      });

      expect(watchlists.length).toBeGreaterThanOrEqual(1);

      const personal = watchlists.find((w) => w.kind === 'personal');
      expect(personal).toBeDefined();
      expect(personal?.canEdit).toBe(true);
      expect(personal?.ownerUserId).toBe(testUserId);
    });
  },
);
