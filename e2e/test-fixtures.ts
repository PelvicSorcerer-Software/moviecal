import { expect, test as base } from '@playwright/test';

import {
  createE2ESharedWatchlist,
  createE2EWatchlistItem,
  createSeededE2ECalendarToken,
  E2E_AUTH_COOKIE,
  E2E_CALENDAR_TOKEN_COOKIE,
  E2E_PERSONAL_WATCHLIST_ID,
  E2E_WATCHLIST_COOKIE,
  E2E_WATCHLISTS_COOKIE,
  getE2EMovieSummaries,
  serializeE2EWatchlistItems,
  serializeE2EWatchlists,
} from '../src/lib/e2e/fixtures';

type SmokeFixtures = {
  assertRedirectsToSignIn(
    protectedPath: '/watchlist' | '/settings/calendar',
  ): Promise<void>;
  stubMovieSearchWithScenario(args?: {
    delayMs?: number;
    query?: string;
    results?: ReturnType<typeof getE2EMovieSummaries>;
    status?: number;
    error?: string;
  }): Promise<void>;
  seedAuthenticatedSession(
    args?:
      | number[]
      | {
          personalTmdbIds?: number[];
          sharedWatchlists?: Array<{
            canEdit?: boolean;
            id?: string;
            name: string;
            tmdbIds?: number[];
          }>;
        },
  ): Promise<void>;
  signInAsTestUser(nextPath?: string): Promise<void>;
  stubMovieSearch(tmdbIds?: number[]): Promise<void>;
};

export const test = base.extend<SmokeFixtures>({
  assertRedirectsToSignIn: async ({ page }, use) => {
    await use(async (protectedPath) => {
      await page.goto(protectedPath);
      await expect(page).toHaveURL(
        new RegExp(`/sign-in\\?next=${encodeURIComponent(protectedPath)}$`),
      );
      await expect(
        page.getByRole('heading', { name: 'Sign in to moviecal' }),
      ).toBeVisible();
    });
  },
  seedAuthenticatedSession: async ({ baseURL, context, request }, use) => {
    await use(async (args = []) => {
      if (!baseURL) {
        throw new Error('A baseURL is required for Playwright smoke fixtures.');
      }

      const personalTmdbIds = Array.isArray(args)
        ? args
        : (args.personalTmdbIds ?? []);
      const sharedWatchlists = Array.isArray(args)
        ? []
        : (args.sharedWatchlists ?? []);
      const watchlists = [
        {
          canEdit: true,
          id: E2E_PERSONAL_WATCHLIST_ID,
          kind: 'personal' as const,
          name: 'My watchlist',
          ownerUserId: 'e2e-user',
        },
        ...sharedWatchlists.map((watchlist, index) => ({
          canEdit: watchlist.canEdit ?? true,
          id: watchlist.id ?? createE2ESharedWatchlist(watchlist.name, index).id,
          kind: 'shared' as const,
          name: watchlist.name,
          ownerUserId: 'e2e-user',
        })),
      ];
      const watchlistCookieValue = serializeE2EWatchlistItems({
        [E2E_PERSONAL_WATCHLIST_ID]: personalTmdbIds.map((tmdbId) => createE2EWatchlistItem(tmdbId)),
        ...Object.fromEntries(
          sharedWatchlists.map((watchlist, index) => [
            watchlist.id ?? createE2ESharedWatchlist(watchlist.name, index).id,
            (watchlist.tmdbIds ?? []).map((tmdbId) => createE2EWatchlistItem(tmdbId)),
          ]),
        ),
      });
      const watchlistsCookieValue = serializeE2EWatchlists(watchlists);
      const calendarToken = createSeededE2ECalendarToken(
        `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      );

      await context.addCookies([
        {
          name: E2E_AUTH_COOKIE,
          value: 'authenticated',
          url: baseURL,
          httpOnly: true,
          sameSite: 'Lax',
        },
        {
          name: E2E_WATCHLIST_COOKIE,
          value: watchlistCookieValue,
          url: baseURL,
          httpOnly: true,
          sameSite: 'Lax',
        },
        {
          name: E2E_WATCHLISTS_COOKIE,
          value: watchlistsCookieValue,
          url: baseURL,
          httpOnly: true,
          sameSite: 'Lax',
        },
        {
          name: E2E_CALENDAR_TOKEN_COOKIE,
          value: calendarToken,
          url: baseURL,
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);

      await request.get(`${baseURL}/settings/calendar`, {
        headers: {
          cookie: [
            `${E2E_AUTH_COOKIE}=authenticated`,
            `${E2E_CALENDAR_TOKEN_COOKIE}=${calendarToken}`,
            `${E2E_WATCHLIST_COOKIE}=${watchlistCookieValue}`,
            `${E2E_WATCHLISTS_COOKIE}=${watchlistsCookieValue}`,
          ].join('; '),
        },
      });
    });
  },
  signInAsTestUser: async ({ page }, use) => {
    await use(async (nextPath = '/watchlist') => {
      await page.goto(`/sign-in?next=${encodeURIComponent(nextPath)}`);
      await page.getByLabel('Email').fill('e2e@example.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign in' }).click();
    });
  },
  stubMovieSearch: async ({ page }, use) => {
    await use(async (tmdbIds = [603]) => {
      const results = getE2EMovieSummaries(tmdbIds);

      await page.route('**/api/movies/search**', async (route) => {
        const requestUrl = new URL(route.request().url());
        const query = requestUrl.searchParams.get('q')?.trim() ?? '';

        if (!query) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Search query "q" is required.',
            }),
          });

          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ results }),
        });
      });
    });
  },
  stubMovieSearchWithScenario: async ({ page }, use) => {
    await use(async ({
      delayMs = 0,
      query,
      results = getE2EMovieSummaries([603]),
      status = 200,
      error,
    } = {}) => {
      await page.route('**/api/movies/search**', async (route) => {
        const requestUrl = new URL(route.request().url());
        const requestQuery = requestUrl.searchParams.get('q')?.trim() ?? '';

        if (query && requestQuery !== query) {
          await route.fallback();

          return;
        }

        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        if (status >= 400) {
          await route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify({
              error: error ?? 'Movie search is unavailable right now.',
            }),
          });

          return;
        }

        await route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify({ results }),
        });
      });
    });
  },
});

export { expect };
