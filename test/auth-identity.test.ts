import { describe, expect, it } from 'vitest';
import type { User } from '@supabase/supabase-js';

import {
  resolveAuthTokensWithClient,
  type AuthClientLike,
} from '../src/lib/auth/identity';
import { SupabaseEnvironmentError } from '../src/lib/supabase/env';

function createUser(id: string): User {
  return {
    id,
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00.000Z',
    user_metadata: {},
  };
}

/**
 * Builds an AuthClientLike whose `getUser`/`refreshSession` behaviour is fully
 * controlled by the test. This mirrors the mock pattern in `test/auth.test.ts`
 * but exercises `identity.ts` directly, with no Next.js transport in scope.
 */
function createClient(overrides: {
  getUser?: AuthClientLike['auth']['getUser'];
  refreshSession?: AuthClientLike['auth']['refreshSession'];
}): AuthClientLike {
  return {
    auth: {
      getUser:
        overrides.getUser ??
        (async () => ({ data: { user: null } })),
      refreshSession:
        overrides.refreshSession ??
        (async () => ({ data: { session: null, user: null } })),
    },
  };
}

describe('resolveAuthTokensWithClient (identity module)', () => {
  it('resolves the user when the access token is valid', async () => {
    let refreshCalls = 0;

    const auth = await resolveAuthTokensWithClient(
      createClient({
        async getUser() {
          return { data: { user: createUser('user-1') } };
        },
        async refreshSession() {
          refreshCalls += 1;
          return { data: { session: null, user: null } };
        },
      }),
      { accessToken: 'valid-access-token', refreshToken: 'refresh-token' },
    );

    expect(auth).toEqual({
      refreshedSession: null,
      shouldClearCookies: false,
      user: createUser('user-1'),
    });
    // A valid access token must never trigger a refresh round-trip.
    expect(refreshCalls).toBe(0);
  });

  it('refreshes when the access token is expired but the refresh token is valid', async () => {
    const auth = await resolveAuthTokensWithClient(
      createClient({
        async getUser() {
          return { data: { user: null } };
        },
        async refreshSession() {
          return {
            data: {
              session: {
                access_token: 'new-access-token',
                refresh_token: 'new-refresh-token',
                expires_in: 3600,
              },
              user: createUser('user-1'),
            },
          };
        },
      }),
      { accessToken: 'expired-access-token', refreshToken: 'valid-refresh-token' },
    );

    expect(auth).toEqual({
      refreshedSession: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      },
      shouldClearCookies: false,
      user: createUser('user-1'),
    });
  });

  it('returns an anonymous resolution without clearing cookies when no tokens are present', async () => {
    let getUserCalls = 0;

    const auth = await resolveAuthTokensWithClient(
      createClient({
        async getUser() {
          getUserCalls += 1;
          return { data: { user: null } };
        },
      }),
      null,
    );

    expect(auth).toEqual({
      refreshedSession: null,
      shouldClearCookies: false,
      user: null,
    });
    // With no tokens there is nothing to validate; the client must not be hit.
    expect(getUserCalls).toBe(0);
  });

  it('flags cookies for clearing when both tokens are expired', async () => {
    const auth = await resolveAuthTokensWithClient(
      createClient({
        async getUser() {
          return { data: { user: null } };
        },
        async refreshSession() {
          return { data: { session: null, user: null } };
        },
      }),
      { accessToken: 'expired-access-token', refreshToken: 'expired-refresh-token' },
    );

    expect(auth).toEqual({
      refreshedSession: null,
      shouldClearCookies: true,
      user: null,
    });
  });

  it('propagates SupabaseEnvironmentError thrown by the auth client', async () => {
    const client = createClient({
      async getUser() {
        throw new SupabaseEnvironmentError('Supabase is not configured.');
      },
    });

    await expect(
      resolveAuthTokensWithClient(client, {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    ).rejects.toBeInstanceOf(SupabaseEnvironmentError);
  });
});
