import { ContentDetails } from '../models/content';
import pool from './db';

let cachedStreaminServiceIds: number[] = [];
export const getCachedStreamingServiceIds = (): number[] => cachedStreaminServiceIds;
export const setCachedStreamingServiceIds = (data: number[]): void => {
  cachedStreaminServiceIds = data;
};

export function getUSWatchProviders(content: ContentDetails): number[] {
  const watchProviders = content['watch/providers']?.results;
  const usWatchProvider = watchProviders.US;
  if (usWatchProvider && usWatchProvider.flatrate.length > 0) {
    const streaming_service_ids: number[] = [];
    usWatchProvider.flatrate.forEach((item) => {
      const id = item.provider_id;
      if (cachedStreaminServiceIds.includes(id)) {
        streaming_service_ids.push(item.provider_id);
      }
    });
    return streaming_service_ids;
  }
  return [9999];
}

export async function loadStreamingService() {
  const query = `SELECT id FROM streaming_services`;
  const [rows] = await pool.execute(query);
  const streamingServiceIds = rows as any[];
  setCachedStreamingServiceIds(streamingServiceIds.map((item) => item.id));
}
