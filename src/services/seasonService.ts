import Season from '../models/season';
import Show from '../models/show';
import { CacheService } from './cacheService';
import { errorService } from './errorService';

export class SeasonService {
  private cache: CacheService;

  constructor() {
    this.cache = new CacheService();
  }

  /**
   * Update watch status for a season when new episodes are added
   * If a season was previously marked as WATCHED, update to WATCHING since there's new content
   * @param profileId ID of the profile
   * @param seasonId ID of the season in the database
   */
  public async updateSeasonWatchStatusForNewEpisodes(profileId: string, seasonId: number): Promise<void> {
    try {
      const seasonWatchStatus = await Season.getWatchStatus(profileId, seasonId);

      if (seasonWatchStatus === 'WATCHED') {
        await Season.updateWatchStatus(profileId, seasonId, 'WATCHING');

        const seasonShowId = await Season.getShowIdForSeason(seasonId);
        if (seasonShowId) {
          const showWatchStatus = await Show.getWatchStatus(profileId, seasonShowId);
          if (showWatchStatus === 'WATCHED') {
            await Show.updateWatchStatus(profileId, seasonShowId, 'WATCHING');
          }
        }
      }
    } catch (error) {
      throw errorService.handleError(error, `updateSeasonWatchStatusForNewEpisodes(${profileId}, ${seasonId})`);
    }
  }
}
// Export a singleton instance of the service
export const seasonService = new SeasonService();
