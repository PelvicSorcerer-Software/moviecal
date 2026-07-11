import { describe, expect, it } from 'vitest';

import { extractBearerToken } from '../src/lib/auth/bearer';

function requestWithAuthorization(value?: string): Request {
  const headers = new Headers();

  if (value !== undefined) {
    headers.set('authorization', value);
  }

  return new Request('https://moviecal.test/api/v1/watchlist', { headers });
}

describe('extractBearerToken', () => {
  it('returns the token from a well-formed Authorization header', () => {
    expect(
      extractBearerToken(requestWithAuthorization('Bearer abc.def.ghi')),
    ).toBe('abc.def.ghi');
  });

  it('accepts a case-insensitive scheme', () => {
    expect(
      extractBearerToken(requestWithAuthorization('bearer token-value')),
    ).toBe('token-value');
  });

  it('tolerates surrounding whitespace around the header value', () => {
    expect(
      extractBearerToken(requestWithAuthorization('  Bearer   spaced-token  ')),
    ).toBe('spaced-token');
  });

  it('returns null when the Authorization header is missing', () => {
    expect(extractBearerToken(requestWithAuthorization())).toBeNull();
  });

  it('returns null when the header uses a different scheme', () => {
    expect(
      extractBearerToken(requestWithAuthorization('Basic dXNlcjpwYXNz')),
    ).toBeNull();
  });

  it('returns null when the Bearer scheme has no token', () => {
    expect(extractBearerToken(requestWithAuthorization('Bearer'))).toBeNull();
    expect(extractBearerToken(requestWithAuthorization('Bearer   '))).toBeNull();
  });

  it('returns null when the header carries extra token segments', () => {
    expect(
      extractBearerToken(requestWithAuthorization('Bearer token extra')),
    ).toBeNull();
  });

  it('returns null for an empty header value', () => {
    expect(extractBearerToken(requestWithAuthorization(''))).toBeNull();
  });
});
