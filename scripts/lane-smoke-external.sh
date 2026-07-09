#!/usr/bin/env bash
set -euo pipefail

# lane:smoke-external — external-provider smoke lane
#
# Checks live TMDb connectivity by hitting the /3/configuration endpoint.
# Requires TMDB_API_KEY to be set in the environment.
# Never prints the API key value.
#
# Exit 0 on success; exit 1 on any failure with a diagnostic message.

TMDB_BASE_URL="https://api.themoviedb.org/3"
TMDB_ENDPOINT="/configuration"

# --- Validate environment ---

if [[ -z "${TMDB_API_KEY:-}" ]]; then
  echo "lane:smoke-external: FAIL — TMDB_API_KEY is not set or is empty" >&2
  echo "Set TMDB_API_KEY to a valid TMDb API key before running this lane." >&2
  exit 1
fi

echo "lane:smoke-external: TMDB_API_KEY is set"

# --- Hit the TMDb configuration endpoint ---

echo "lane:smoke-external: checking ${TMDB_BASE_URL}${TMDB_ENDPOINT} ..."

RESPONSE=$(curl --silent --write-out "\n%{http_code}" \
  --max-time 15 \
  --retry 2 \
  --retry-delay 2 \
  "${TMDB_BASE_URL}${TMDB_ENDPOINT}?api_key=${TMDB_API_KEY}")

HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)

# --- Validate HTTP status ---

if [[ "$HTTP_STATUS" != "200" ]]; then
  echo "lane:smoke-external: FAIL — TMDb returned HTTP $HTTP_STATUS (expected 200)" >&2
  echo "Response body: $HTTP_BODY" >&2
  exit 1
fi

echo "lane:smoke-external: HTTP 200 received"

# --- Validate response body contains expected field ---

if ! echo "$HTTP_BODY" | grep -q '"images"'; then
  echo "lane:smoke-external: FAIL — response body does not contain expected \"images\" field" >&2
  echo "Response body: $HTTP_BODY" >&2
  exit 1
fi

echo "lane:smoke-external: response body contains expected \"images\" field"
echo "lane:smoke-external: PASS — TMDb connectivity check succeeded"
