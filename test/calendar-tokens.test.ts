import { describe, expect, it, vi } from 'vitest';

import {
  buildCalendarSubscriptionUrl,
  CalendarTokenDataError,
  generateCalendarToken,
  getOrCreateCalendarToken,
  resolveCalendarTokenOwner,
  rotateCalendarToken,
  type CalendarTokenRepository,
} from '../src/lib/calendar-tokens';
import {
  buildCalendarTokenRow,
  createCalendarTokenRepository,
  createMutableCalendarTokenRepository,
} from './support';

describe('calendar token helpers', () => {
  it('generates url-safe tokens with strong length', () => {
    const token = generateCalendarToken(
      ((size: number) => Buffer.alloc(size, 7)) as typeof import('node:crypto').randomBytes,
    );

    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(token).not.toContain('+');
    expect(token).not.toContain('/');
  });

  it('builds the subscription URL from the request origin', () => {
    expect(
      buildCalendarSubscriptionUrl('https://moviecal.example.com', 'token-123'),
    ).toBe('https://moviecal.example.com/api/calendar/token-123');
  });
});

describe('calendar token domain flow', () => {
  it('returns the existing token without regenerating it', async () => {
    const repository = createCalendarTokenRepository({
      async findTokenByUserId() {
        return buildCalendarTokenRow();
      },
    });

    await expect(
      getOrCreateCalendarToken({ repository, userId: 'user-1' }),
    ).resolves.toEqual(buildCalendarTokenRow());
  });

  it('creates a token when the user does not have one yet', async () => {
    const repository = createCalendarTokenRepository({
      async insertTokenForUser(_userId, token) {
        return {
          errorCode: null,
          row: buildCalendarTokenRow({ token }),
        };
      },
    });

    const row = await getOrCreateCalendarToken({
      repository,
      userId: 'user-1',
    });

    expect(row.user_id).toBe('user-1');
    expect(row.token.length).toBeGreaterThanOrEqual(32);
  });

  it('throws a data error when creation cannot persist', async () => {
    const repository = createCalendarTokenRepository({
      async insertTokenForUser() {
        return {
          errorCode: null,
          row: null,
        };
      },
    });

    await expect(
      getOrCreateCalendarToken({ repository, userId: 'user-1' }),
    ).rejects.toBeInstanceOf(CalendarTokenDataError);
  });

  it('resolves an insert race by refetching the user token', async () => {
    const repository = createCalendarTokenRepository({
      async findTokenByUserId() {
        return buildCalendarTokenRow({ token: 'raced-token' });
      },
      async insertTokenForUser() {
        return {
          errorCode: '23505',
          row: null,
        };
      },
    });

    await expect(
      getOrCreateCalendarToken({ repository, userId: 'user-1' }),
    ).resolves.toEqual(buildCalendarTokenRow({ token: 'raced-token' }));
  });

  it('rotates the token for an existing row', async () => {
    const repository = createCalendarTokenRepository({
      async findTokenByUserId() {
        return buildCalendarTokenRow({ token: 'old-token' });
      },
      async updateTokenForUser(_userId, token) {
        return {
          errorCode: null,
          row: buildCalendarTokenRow({ token }),
        };
      },
    });

    const row = await rotateCalendarToken({
      repository,
      userId: 'user-1',
    });

    expect(row.token).not.toBe('old-token');
  });

  it('retries rotation after a token collision', async () => {
    const repository = createCalendarTokenRepository({
      async findTokenByUserId() {
        return buildCalendarTokenRow({ token: 'old-token' });
      },
      updateTokenForUser: vi
        .fn<CalendarTokenRepository['updateTokenForUser']>()
        .mockResolvedValueOnce({
          errorCode: '23505',
          row: null,
        })
        .mockResolvedValueOnce({
          errorCode: null,
          row: buildCalendarTokenRow({ token: 'rotated-token' }),
        }),
    });

    await expect(
      rotateCalendarToken({ repository, userId: 'user-1' }),
    ).resolves.toEqual(buildCalendarTokenRow({ token: 'rotated-token' }));
    expect(repository.updateTokenForUser).toHaveBeenCalledTimes(2);
  });

  it('creates a token on rotate when no token exists yet', async () => {
    const repository = createCalendarTokenRepository({
      async findTokenByUserId() {
        return null;
      },
      async insertTokenForUser(_userId, token) {
        return {
          errorCode: null,
          row: buildCalendarTokenRow({ token }),
        };
      },
    });

    const row = await rotateCalendarToken({
      repository,
      userId: 'user-1',
    });

    expect(row.token.length).toBeGreaterThanOrEqual(32);
  });

  it('resolves the owner id from a valid token', async () => {
    const repository = createCalendarTokenRepository({
      async findUserIdByToken(token) {
        return token === 'valid-token' ? 'user-1' : null;
      },
    });

    await expect(
      resolveCalendarTokenOwner({ repository, token: 'valid-token' }),
    ).resolves.toBe('user-1');
    await expect(
      resolveCalendarTokenOwner({ repository, token: 'missing-token' }),
    ).resolves.toBeNull();
  });

  it('trims tokens before resolution and skips blank lookups', async () => {
    const repository = createCalendarTokenRepository({
      findUserIdByToken: vi
        .fn<CalendarTokenRepository['findUserIdByToken']>()
        .mockResolvedValue('user-1'),
    });

    await expect(
      resolveCalendarTokenOwner({ repository, token: '  valid-token  ' }),
    ).resolves.toBe('user-1');
    await expect(
      resolveCalendarTokenOwner({ repository, token: '   ' }),
    ).resolves.toBeNull();

    expect(repository.findUserIdByToken).toHaveBeenCalledTimes(1);
    expect(repository.findUserIdByToken).toHaveBeenCalledWith('valid-token');
  });

  it('invalidates the previous token after rotation while preserving the owner mapping', async () => {
    const repository = createMutableCalendarTokenRepository({
      initialToken: null,
    });

    const initialRow = await getOrCreateCalendarToken({
      repository,
      userId: 'user-1',
    });
    const rotatedRow = await rotateCalendarToken({
      repository,
      userId: 'user-1',
    });

    await expect(
      resolveCalendarTokenOwner({ repository, token: initialRow.token }),
    ).resolves.toBeNull();
    await expect(
      resolveCalendarTokenOwner({ repository, token: rotatedRow.token }),
    ).resolves.toBe('user-1');
    expect(rotatedRow.token).not.toBe(initialRow.token);
  });

  it('throws a data error when rotation cannot persist', async () => {
    const repository = createCalendarTokenRepository({
      async findTokenByUserId() {
        return buildCalendarTokenRow();
      },
      async updateTokenForUser() {
        return {
          errorCode: null,
          row: null,
        };
      },
    });

    await expect(
      rotateCalendarToken({ repository, userId: 'user-1' }),
    ).rejects.toBeInstanceOf(CalendarTokenDataError);
  });
});
