export interface ProfileEpisode {
  profile_id: number;
  episode_id: number;
  tmdb_id: number;
  season_id: number;
  show_id: number;
  episode_number: number;
  episode_type: string;
  season_number: number;
  title: string;
  overview: string;
  runtime: number;
  air_date: string;
  still_image: string;
  watch_status: 'WATCHED' | 'NOT_WATCHED' | 'WATCHING';
}
