import { ContentRatings, Network } from '../models/content';

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
