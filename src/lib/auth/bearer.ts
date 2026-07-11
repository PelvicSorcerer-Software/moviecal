/**
 * Bearer-token transport helper for the versioned mobile API surface.
 *
 * This module deliberately has ZERO coupling to Next.js request/response
 * transport (`next/headers`, `next/server`, `next/navigation`). It reads only
 * from the standard `Request` `Headers` interface so it can be reused by any
 * non-Next.js caller. It also never logs, echoes, or otherwise persists token
 * values — the extracted string is returned to the caller and nowhere else.
 */

/**
 * Extracts a bearer token from an `Authorization: Bearer <token>` header.
 *
 * Returns the raw token when the header is present and well-formed. Returns
 * `null` when the header is missing, uses a different scheme, or is otherwise
 * malformed (no token, extra whitespace-separated segments, etc.). The token
 * value is never logged.
 */
export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');

  if (!header) {
    return null;
  }

  // Exactly: the scheme "Bearer" (case-insensitive), one or more whitespace
  // characters, then a single non-whitespace token and nothing after it.
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());

  if (!match) {
    return null;
  }

  return match[1];
}
