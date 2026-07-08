import type { CalendarTokenRepository } from '../../../src/lib/calendar-tokens';
import { TEST_CALENDAR_TOKENS, TEST_USER_IDS } from '../../../src/lib/test-data/catalog';
import { buildCalendarTokenRow } from '../factories/calendar';

export function createCalendarTokenRepository(
  overrides: Partial<CalendarTokenRepository> = {},
): CalendarTokenRepository {
  return {
    async findTokenByUserId() {
      return null;
    },
    async findUserIdByToken(token) {
      return token === TEST_CALENDAR_TOKENS.DEFAULT ? TEST_USER_IDS.OWNER : null;
    },
    async insertTokenForUser() {
      return {
        errorCode: null,
        row: buildCalendarTokenRow(),
      };
    },
    async updateTokenForUser() {
      return {
        errorCode: null,
        row: buildCalendarTokenRow({ token: 'rotated-token' }),
      };
    },
    ...overrides,
  };
}

export function createMutableCalendarTokenRepository(args: {
  initialToken?: string | null;
  userId?: string;
} = {}): CalendarTokenRepository {
  const userId = args.userId ?? TEST_USER_IDS.OWNER;
  let currentRow = args.initialToken === null
    ? null
    : buildCalendarTokenRow({
      token: args.initialToken ?? TEST_CALENDAR_TOKENS.DEFAULT,
      user_id: userId,
    });

  return {
    async findTokenByUserId(requestedUserId) {
      if (!currentRow || requestedUserId !== userId) {
        return null;
      }

      return currentRow;
    },

    async findUserIdByToken(token) {
      if (!currentRow || token !== currentRow.token) {
        return null;
      }

      return userId;
    },

    async insertTokenForUser(requestedUserId, token) {
      if (currentRow || requestedUserId !== userId) {
        return {
          errorCode: '23505',
          row: null,
        };
      }

      currentRow = buildCalendarTokenRow({
        token,
        user_id: userId,
      });

      return {
        errorCode: null,
        row: currentRow,
      };
    },

    async updateTokenForUser(requestedUserId, token) {
      if (!currentRow || requestedUserId !== userId) {
        return {
          errorCode: null,
          row: null,
        };
      }

      currentRow = buildCalendarTokenRow({
        id: currentRow.id,
        token,
        user_id: userId,
      });

      return {
        errorCode: null,
        row: currentRow,
      };
    },
  };
}
