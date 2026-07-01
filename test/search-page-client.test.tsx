// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { SearchPageClient } from '../src/app/search/search-page-client';
import type { WatchlistSummary } from '../src/lib/watchlist';

vi.mock('next/navigation', () => ({
  usePathname: () => '/search',
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

function buildWatchlist(
  overrides: Partial<WatchlistSummary> = {},
): WatchlistSummary {
  return {
    canEdit: true,
    id: 'personal-watchlist-1',
    kind: 'personal',
    name: 'My watchlist',
    ownerUserId: 'user-1',
    ...overrides,
  };
}

describe('SearchPageClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('only offers editable watchlists as add targets', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            tmdbId: 603,
            title: 'The Matrix',
            releaseDate: '1999-03-31',
            posterPath: '/matrix.jpg',
            overview: 'A hacker discovers the truth.',
          },
        ],
      }),
    } as Response);

    render(
      <SearchPageClient
        availableWatchlists={[
          buildWatchlist(),
          buildWatchlist({
            canEdit: false,
            id: 'shared-watchlist-readonly',
            kind: 'shared',
            name: 'Curated picks',
          }),
        ]}
        initialQuery="matrix"
        isAuthenticated
      />,
    );

    await waitFor(() => {
      const saveTo = screen.getByLabelText('Save to') as HTMLSelectElement;

      expect(saveTo.value).toBe('personal-watchlist-1');
      expect(screen.getByRole('option', { name: 'My watchlist' })).toBeTruthy();
      expect(screen.queryByRole('option', { name: 'Curated picks' })).toBeNull();
      expect(screen.getByText('Read-only watchlists: Curated picks.')).toBeTruthy();
    });
  });

  it('surfaces a read-only message when no accessible watchlists allow edits', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            tmdbId: 603,
            title: 'The Matrix',
            releaseDate: '1999-03-31',
            posterPath: '/matrix.jpg',
            overview: 'A hacker discovers the truth.',
          },
        ],
      }),
    } as Response);

    render(
      <SearchPageClient
        availableWatchlists={[
          buildWatchlist({
            canEdit: false,
            id: 'shared-watchlist-readonly',
            kind: 'shared',
            name: 'Curated picks',
          }),
        ]}
        initialQuery="matrix"
        isAuthenticated
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          'You can view shared watchlists, but none of your current targets allow edits.',
        ),
      ).toBeTruthy();
      expect(screen.queryByLabelText('Save to')).toBeNull();
    });
  });
});
