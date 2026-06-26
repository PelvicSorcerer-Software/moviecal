// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { WatchlistDetailClient } from '../src/app/watchlist/watchlist-detail-client';
import type { WatchlistItem, WatchlistSummary } from '../src/lib/watchlist';

function buildItem(overrides: Partial<WatchlistItem> = {}): WatchlistItem {
  return {
    id: 'watchlist-item-1',
    addedAt: '2026-06-13T05:00:00.000Z',
    movie: {
      id: 42,
      tmdbId: 603,
      title: 'The Matrix',
      releaseDate: '1999-03-31',
      overview: 'A hacker discovers the truth.',
      posterPath: '/matrix.jpg',
    },
    ...overrides,
  };
}

function buildWatchlist(overrides: Partial<WatchlistSummary> = {}): WatchlistSummary {
  return {
    id: 'shared-watchlist-1',
    kind: 'shared',
    name: 'Friday movie night',
    ownerUserId: 'user-1',
    ...overrides,
  };
}

describe('WatchlistDetailClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('removes an item from the targeted watchlist detail page', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        deleted: true,
        id: 'watchlist-item-1',
      }),
    } as Response);

    render(
      <WatchlistDetailClient
        initialItems={[buildItem()]}
        watchlist={buildWatchlist()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(screen.queryByText('The Matrix')).toBeNull();
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/watchlist/watchlist-item-1?watchlist_id=shared-watchlist-1',
      {
        method: 'DELETE',
      },
    );
    expect(
      screen.getByText('Removed The Matrix from Friday movie night.'),
    ).toBeTruthy();
  });

  it('keeps the movie visible when the targeted delete fails', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'Watchlist item not found.',
      }),
    } as Response);

    render(
      <WatchlistDetailClient
        initialItems={[buildItem()]}
        watchlist={buildWatchlist()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(screen.getByText('Watchlist update failed')).toBeTruthy();
    });

    expect(screen.getByText('The Matrix')).toBeTruthy();
    expect(screen.getByText('Watchlist item not found.')).toBeTruthy();
  });
});
