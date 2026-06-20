import { describe, expect, it } from 'vitest';

import {
  buildCalendarEventUid,
  buildCalendarFeed,
  escapeCalendarText,
  formatCalendarDate,
  formatCalendarTimestamp,
} from '../src/lib/calendar-feed';
import type { WatchlistItem } from '../src/lib/watchlist';

function buildWatchlistItem(
  overrides: Partial<WatchlistItem> = {},
): WatchlistItem {
  return {
    addedAt: '2026-06-20T00:00:00.000Z',
    id: 'watchlist-item-1',
    movie: {
      id: 42,
      overview: 'A hacker discovers the truth.',
      posterPath: '/matrix.jpg',
      releaseDate: '1999-03-31',
      title: 'The Matrix',
      tmdbId: 603,
    },
    ...overrides,
  };
}

describe('calendar feed helpers', () => {
  it('formats all-day calendar dates as YYYYMMDD', () => {
    expect(formatCalendarDate('1999-03-31')).toBe('19990331');
    expect(formatCalendarDate('1999-02-29')).toBeNull();
    expect(formatCalendarDate(null)).toBeNull();
  });

  it('formats UTC timestamps for DTSTAMP fields', () => {
    expect(formatCalendarTimestamp(new Date('2026-06-20T14:05:06.789Z'))).toBe(
      '20260620T140506Z',
    );
  });

  it('builds stable user/movie scoped UIDs', () => {
    expect(buildCalendarEventUid('user-1', 603)).toBe(
      '35c9675c92fcbee5a2b50e3bf7bcc6797211309f5f0513b0f6f8aa66030a959b@moviecal',
    );
    expect(buildCalendarEventUid('user-1', 603)).toBe(
      buildCalendarEventUid('user-1', 603),
    );
    expect(buildCalendarEventUid('user-2', 603)).not.toBe(
      buildCalendarEventUid('user-1', 603),
    );
  });

  it('escapes special characters for ical text fields', () => {
    expect(escapeCalendarText('Line 1, line 2;\\ok\nNext')).toBe(
      'Line 1\\, line 2\\;\\\\ok\\nNext',
    );
  });
});

describe('buildCalendarFeed', () => {
  it('generates deterministic ics output for dated watchlist items', () => {
    const generatedAt = new Date('2026-06-20T14:05:06.789Z');
    const feed = buildCalendarFeed({
      generatedAt,
      items: [
        buildWatchlistItem({
          movie: {
            ...buildWatchlistItem().movie,
            overview: 'Dream invasion, commas, and semicolons; included.',
            releaseDate: '2010-07-16',
            title: 'Inception, Part I',
            tmdbId: 27205,
          },
        }),
        buildWatchlistItem({
          id: 'watchlist-item-2',
          movie: {
            ...buildWatchlistItem().movie,
            overview: null,
            releaseDate: '1999-03-31',
            title: 'The Matrix',
            tmdbId: 603,
          },
        }),
      ],
      userId: 'user-1',
    });

    expect(feed).toBe(
      [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//moviecal//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        'UID:35c9675c92fcbee5a2b50e3bf7bcc6797211309f5f0513b0f6f8aa66030a959b@moviecal',
        'DTSTAMP:20260620T140506Z',
        'DTSTART;VALUE=DATE:19990331',
        'SUMMARY:The Matrix',
        'DESCRIPTION:https://www.themoviedb.org/movie/603',
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:b6718b4bcde592fbbe8fe72fdbedf9f4554bc97d5224c00efe414a59089c166f@moviecal',
        'DTSTAMP:20260620T140506Z',
        'DTSTART;VALUE=DATE:20100716',
        'SUMMARY:Inception\\, Part I',
        'DESCRIPTION:https://www.themoviedb.org/movie/27205\\n\\nDream invasion\\, commas\\, and semicolons\\; included.',
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
        '',
      ].join('\r\n'),
    );
  });

  it('skips movies with missing or invalid release dates', () => {
    const feed = buildCalendarFeed({
      generatedAt: new Date('2026-06-20T14:05:06.789Z'),
      items: [
        buildWatchlistItem({
          movie: {
            ...buildWatchlistItem().movie,
            releaseDate: null,
          },
        }),
        buildWatchlistItem({
          id: 'watchlist-item-2',
          movie: {
            ...buildWatchlistItem().movie,
            releaseDate: '2026-02-30',
            tmdbId: 604,
          },
        }),
      ],
      userId: 'user-1',
    });

    expect(feed).not.toContain('BEGIN:VEVENT');
    expect(feed).toContain('BEGIN:VCALENDAR');
    expect(feed).toContain('END:VCALENDAR');
  });
});
