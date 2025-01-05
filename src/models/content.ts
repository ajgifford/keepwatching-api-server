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
