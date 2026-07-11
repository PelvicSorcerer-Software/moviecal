import type { User } from '@supabase/supabase-js';

import type { AuthTokens } from './cookies';

export interface AuthResolution {
  refreshedSession:
    | {
        accessToken: string;
        refreshToken: string;
        expiresIn?: number;
      }
    | null;
  shouldClearCookies: boolean;
  user: User | null;
}

export interface AuthClientLike {
  auth: {
    getUser(accessToken: string): Promise<{ data: { user: User | null } }>;
    refreshSession(args: {
      refresh_token: string;
    }): Promise<{
      data: {
        session:
          | {
              access_token: string;
              refresh_token: string;
              expires_in?: number;
            }
          | null;
        user: User | null;
      };
    }>;
  };
}

export interface ResolveAuthTokenOptions {
  allowRefresh?: boolean;
}

/**
 * Transport-agnostic identity/session resolution.
 *
 * Given an auth client and a pair of tokens, this decides whether the caller is
 * authenticated, whether a refresh is required, and whether stale cookies should
 * be cleared. It never touches Next.js request/response transport (no
 * `next/headers`, `next/server`, or `next/navigation`), so it can be reused by a
 * mobile API handler or any non-Next.js caller. Cookie transport lives in
 * `session.ts`.
 */
export async function resolveAuthTokensWithClient(
  client: AuthClientLike,
  tokens: AuthTokens | null,
  options: ResolveAuthTokenOptions = {},
): Promise<AuthResolution> {
  const { allowRefresh = true } = options;

  if (!tokens) {
    return {
      refreshedSession: null,
      shouldClearCookies: false,
      user: null,
    };
  }

  const { data: userData } = await client.auth.getUser(tokens.accessToken);

  if (userData.user) {
    return {
      refreshedSession: null,
      shouldClearCookies: false,
      user: userData.user,
    };
  }

  if (!allowRefresh) {
    return {
      refreshedSession: null,
      shouldClearCookies: false,
      user: null,
    };
  }

  const { data: refreshData } = await client.auth.refreshSession({
    refresh_token: tokens.refreshToken,
  });

  if (!refreshData.session || !refreshData.user) {
    return {
      refreshedSession: null,
      shouldClearCookies: true,
      user: null,
    };
  }

  return {
    refreshedSession: {
      accessToken: refreshData.session.access_token,
      refreshToken: refreshData.session.refresh_token,
      expiresIn: refreshData.session.expires_in,
    },
    shouldClearCookies: false,
    user: refreshData.user,
  };
}
