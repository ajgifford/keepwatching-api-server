import { Change, ChangeItem, ShowUpdates } from '../models/content';
import Episode from '../models/episode';
import Season from '../models/season';
import Show from '../models/show';
import { axiosTMDBAPIInstance } from '../utils/axiosInstance';
import { getEpisodeToAirId, getInProduction, getUSNetwork, getUSRating } from '../utils/contentUtility';
import { buildTMDBImagePath } from '../utils/imageUtility';
import { getUSWatchProviders } from '../utils/wacthProvidersUtility';
import { Request, Response } from 'express';

export const supportedChangesSets = [
  'air_date',
  'episode',
  'episode_number',
  'episode_run_time',
  'general',
  'genres',
  'images',
  'name',
  'network',
  'overview',
  'runtime',
  'season',
  'season_number',
  'status',
  'title',
  'type',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const updateShows = async (req: Request, res: Response) => {
  console.log(`POST /api/updateShows START`);
  const startTime = performance.now();
  try {
    const shows = await Show.getShowsForUpdates();
    shows.forEach(async (show) => {
      await sleep(500);
      await checkForShowChanges(show);
    });
    res.sendStatus(202);
    const endTime = performance.now();
    console.log(`POST /api/updateShows END >>> `, endTime - startTime);
  } catch (error) {
    res.status(500).json({ message: 'Unexpected error while checking for show updates' });
  }
};

async function checkForShowChanges(show: ShowUpdates) {
  const { currentDate, pastDate } = generateDates();
  try {
    const response = await axiosTMDBAPIInstance.get(
      `tv/${show.tmdb_id}/changes?end_date=${currentDate}&start_date=${pastDate}`,
    );
    const changes: Change[] = response.data.changes;
    const supportedChanges = changes.filter((item) => supportedChangesSets.includes(item.key));
    if (supportedChanges.length > 0) {
      console.log('Show has changes, updating >>> ', show.title);
      const response = await axiosTMDBAPIInstance.get(
        `/tv/${show.tmdb_id}?append_to_response=content_ratings,watch/providers`,
      );
      const responseShow = response.data;
      const showToUpdate = new Show(
        responseShow.id,
        responseShow.name,
        responseShow.overview,
        responseShow.first_air_date,
        buildTMDBImagePath(responseShow.poster_path),
        responseShow.vote_average,
        getUSRating(responseShow.content_ratings),
        show.id,
        getUSWatchProviders(responseShow, 9999),
        responseShow.number_of_episodes,
        responseShow.number_of_seasons,
        responseShow.genres.map((genre: { id: any }) => genre.id),
        responseShow.status,
        responseShow.type,
        getInProduction(responseShow),
        responseShow.last_air_date,
        getEpisodeToAirId(responseShow.last_episode_to_air),
        getEpisodeToAirId(responseShow.next_episode_to_air),
        getUSNetwork(responseShow.networks),
      );
      await showToUpdate.update();
      const profileIds = await showToUpdate.getProfilesForShow();

      const seasonChanges = changes.filter((item) => item.key === 'season');
      if (seasonChanges.length > 0) {
        processSeasonChanges(seasonChanges[0].items, responseShow, show, profileIds);
      }
    }
  } catch (error) {
    console.error('Error checking show changes', show, error);
  }
}

function processSeasonChanges(changes: ChangeItem[], responseShow: any, show: ShowUpdates, profileIds: number[]) {
  const uniqueSeasonIds = filterSeasonChanges(changes);
  const responseShowSeasons = responseShow.seasons;
  console.log('Show has changes to season(s), updating >>>', uniqueSeasonIds);
  uniqueSeasonIds.forEach(async (season_id) => {
    await sleep(500);
    const responseShowSeason = responseShowSeasons.find((season: { id: number }) => season.id === season_id);
    if (responseShowSeason) {
      const seasonToUpdate = new Season(
        show.id,
        responseShowSeason.id,
        responseShowSeason.name,
        responseShowSeason.overview,
        responseShowSeason.season_number,
        responseShowSeason.air_date,
        buildTMDBImagePath(responseShowSeason.poster_path),
        responseShowSeason.episode_count,
      );
      await seasonToUpdate.update();
      profileIds.forEach((id) => seasonToUpdate.updateFavorite(id));

      const seasonHasEpisodeChanges = await checkSeasonForEpisodeChanges(season_id);
      if (seasonHasEpisodeChanges) {
        console.log('Season has episode changes, updating >>>', seasonToUpdate.season_number);
        const response = await axiosTMDBAPIInstance.get(`/tv/${show.tmdb_id}/season/${seasonToUpdate.season_number}`);
        const responseData = response.data;
        responseData.episodes.forEach(async (responseEpisode: any) => {
          const episodeToUpdate = new Episode(
            responseEpisode.id,
            show.id,
            seasonToUpdate.id!,
            responseEpisode.episode_number,
            responseEpisode.episode_type,
            responseEpisode.season_number,
            responseEpisode.name,
            responseEpisode.overview,
            responseEpisode.air_date,
            responseEpisode.runtime,
            buildTMDBImagePath(responseEpisode.still_path),
          );
          await episodeToUpdate.update();
          profileIds.forEach((id) => episodeToUpdate.updateFavorite(id));
        });
      }
    }
  });
}

function filterSeasonChanges(changes: ChangeItem[]) {
  const uniqueSeasonIds = new Set<number>();
  for (const change of changes) {
    const seasonId = change.value.season_id;
    uniqueSeasonIds.add(seasonId);
  }
  return uniqueSeasonIds;
}

async function checkSeasonForEpisodeChanges(season_id: number) {
  const { currentDate, pastDate } = generateDates();
  try {
    const response = await axiosTMDBAPIInstance.get(
      `tv/season/${season_id}/changes?end_date=${currentDate}&start_date=${pastDate}`,
    );
    const changes: Change[] = response.data.changes;
    return changes.filter((item) => item.key === 'episode').length > 0;
  } catch (error) {
    console.error('Error checking season changes', season_id, error);
  }
}

function generateDates(): { currentDate: string; pastDate: string } {
  const currentDate = new Date();
  const pastDate = new Date();

  pastDate.setDate(currentDate.getDate() - 14);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    currentDate: formatDate(currentDate),
    pastDate: formatDate(pastDate),
  };
}
