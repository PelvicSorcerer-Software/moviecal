import { describe, expect, it } from 'vitest';

import { addNumbers } from '../src/utils/dummy-math';

describe('addNumbers', () => {
  it('returns the sum of two positive integers', () => {
    expect(addNumbers(2, 3)).toBe(5);
  });

  it('supports negative values', () => {
    expect(addNumbers(-4, 1)).toBe(-3);
  });
});
