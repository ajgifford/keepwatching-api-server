export interface ProviderInfo {
  link: string;
  flatrate: {
    logo_path: string;
    provider_id: number;
    provider_name: string;
    display_priority: number;
  }[];
}

export interface WatchProviders {
  results: Record<string, ProviderInfo>;
}

export interface ContentDetails {
  'watch/providers': WatchProviders;
}

export interface ContentRating {
  descriptors: string[];
  iso_3166_1: string;
  rating: string;
}

export interface ContentRatings {
  results: ContentRating[];
}

export interface Network {
  id: string;
  logo_path: string;
  name: string;
  origin_country: string;
}

export interface ShowUpdates {
  id: number;
  title: string;
  tmdb_id: number;
  created_at: string;
  updated_at: string;
}

export interface ChangeItem {
  id: string;
  action: string;
  time: string;
  iso_639_1: string;
  iso_3166_1: string;
  value: any;
  original_value: any;
}

export interface Change {
  key: string;
  items: ChangeItem[];
}

export interface Changes {
  changes: Change[];
}

export enum ContentType {
  Show,
  Season,
  Episode,
  Movie,
}
