import { createHash } from 'node:crypto';

import type { WatchlistItem } from './watchlist';

const CALENDAR_LINE_ENDING = '\r\n';
const CALENDAR_PROD_ID = '-//moviecal//EN';

export type CalendarFeedEvent = {
  dtstart: string;
  dtstamp: string;
  uid: string;
  summary: string;
  description: string;
};

type BuildCalendarFeedOptions = {
  generatedAt?: Date;
  items: WatchlistItem[];
  userId: string;
};

export function buildCalendarFeed({
  generatedAt = new Date(),
  items,
  userId,
}: BuildCalendarFeedOptions): string {
  const dtstamp = formatCalendarTimestamp(generatedAt);
  const events = items
    .flatMap((item) => {
      const dtstart = formatCalendarDate(item.movie.releaseDate);

      if (!dtstart) {
        return [];
      }

      return [
        buildCalendarFeedEvent({
          dtstamp,
          dtstart,
          item,
          userId,
        }),
      ];
    })
    .sort(compareCalendarFeedEvents);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${CALENDAR_PROD_ID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events.flatMap((event) => serializeCalendarEvent(event)),
    'END:VCALENDAR',
  ];

  return `${lines.join(CALENDAR_LINE_ENDING)}${CALENDAR_LINE_ENDING}`;
}

export function buildCalendarEventUid(userId: string, tmdbId: number): string {
  const digest = createHash('sha256')
    .update(`${userId}:${tmdbId}`)
    .digest('hex');

  return `${digest}@moviecal`;
}

export function formatCalendarDate(releaseDate: string | null): string | null {
  if (!releaseDate) {
    return null;
  }

  const match = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/.exec(
    releaseDate,
  );

  if (!match?.groups) {
    return null;
  }

  const year = Number(match.groups.year);
  const month = Number(match.groups.month);
  const day = Number(match.groups.day);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${match.groups.year}${match.groups.month}${match.groups.day}`;
}

export function formatCalendarTimestamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

export function escapeCalendarText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function buildCalendarFeedEvent({
  dtstamp,
  dtstart,
  item,
  userId,
}: {
  dtstamp: string;
  dtstart: string;
  item: WatchlistItem;
  userId: string;
}): CalendarFeedEvent {
  const tmdbUrl = `https://www.themoviedb.org/movie/${item.movie.tmdbId}`;
  const descriptionParts = [tmdbUrl];

  if (item.movie.overview) {
    descriptionParts.push(item.movie.overview);
  }

  return {
    description: descriptionParts.join('\n\n'),
    dtstamp,
    dtstart,
    summary: item.movie.title,
    uid: buildCalendarEventUid(userId, item.movie.tmdbId),
  };
}

function compareCalendarFeedEvents(
  left: CalendarFeedEvent,
  right: CalendarFeedEvent,
): number {
  return (
    left.dtstart.localeCompare(right.dtstart) ||
    left.summary.localeCompare(right.summary) ||
    left.uid.localeCompare(right.uid)
  );
}

function serializeCalendarEvent(event: CalendarFeedEvent): string[] {
  return [
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${event.dtstamp}`,
    `DTSTART;VALUE=DATE:${event.dtstart}`,
    `SUMMARY:${escapeCalendarText(event.summary)}`,
    `DESCRIPTION:${escapeCalendarText(event.description)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
  ];
}
