import { TMDbEnvironmentError } from './tmdb/env';
import type { NormalizedMovieDetail } from './tmdb/client';
import type { WatchlistRepository } from './watchlist';

export interface ReleaseRefreshResult {
  failedMovies: number;
  refreshedMovies: number;
  trackedMovies: number;
}

function dedupeTrackedMovieIds(tmdbIds: number[]): number[] {
  return [...new Set(tmdbIds.filter((tmdbId) => Number.isInteger(tmdbId) && tmdbId > 0))];
}

export async function refreshTrackedMovies(args: {
  getMovieDetails(tmdbId: number): Promise<NormalizedMovieDetail>;
  repository: WatchlistRepository;
}): Promise<ReleaseRefreshResult> {
  const trackedMovies = await args.repository.listTrackedMovies();
  const trackedTmdbIds = dedupeTrackedMovieIds(
    trackedMovies.map((movie) => movie.tmdb_id),
  );

  let refreshedMovies = 0;
  let failedMovies = 0;

  for (const tmdbId of trackedTmdbIds) {
    try {
      const detail = await args.getMovieDetails(tmdbId);

      await args.repository.upsertMovie(detail);
      refreshedMovies += 1;
    } catch (error) {
      if (error instanceof TMDbEnvironmentError) {
        throw error;
      }

      failedMovies += 1;
    }
  }

  return {
    trackedMovies: trackedTmdbIds.length,
    refreshedMovies,
    failedMovies,
  };
}
