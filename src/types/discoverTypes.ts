export interface DiscoverContentItem {
  id: string;
  title: string;
  genres: string[];
  premiered: string;
  summary: string;
  image: string;
  rating: number;
}

export interface DiscoverResponse {
  results: DiscoverContentItem[];
  total_results?: number;
  provider?: string;
}
