import { ContentRatings, Network, Release, ReleaseDates } from '../models/content';

export function getUSNetwork(networks: Network[]): string | null {
  for (const network of networks) {
    if (network.origin_country === 'US') {
      return network.name;
    }
  }
  return null;
}

export function getUSRating(contentRatings: ContentRatings): string {
  for (const result of contentRatings.results) {
    if (result.iso_3166_1 === 'US') {
      return result.rating;
    }
  }
  return 'TV-G';
}

export function getInProduction(show: { in_production: boolean }): 0 | 1 {
  return show.in_production ? 1 : 0;
}

export function getEpisodeToAirId(episode: { id: number } | null) {
  if (episode) {
    return episode.id;
  }
  return null;
}

export function getUSMPARating(releaseDates: ReleaseDates): string {
  for (const releaseDate of releaseDates.results) {
    if (releaseDate.iso_3166_1 === 'US') {
      const release: Release = releaseDate.release_dates[0];
      return release.certification;
    }
  }
  return 'PG';
}
