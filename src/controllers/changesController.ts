import { Change, ChangeItem, ContentUpdates } from '../models/content';
import Episode from '../models/episode';
import Movie from '../models/movie';
import Season from '../models/season';
import Show from '../models/show';
import { axiosTMDBAPIInstance } from '../utils/axiosInstance';
import { getEpisodeToAirId, getInProduction, getUSMPARating, getUSNetwork, getUSRating } from '../utils/contentUtility';
import { buildTMDBImagePath } from '../utils/imageUtility';
import { getUSWatchProviders } from '../utils/wacthProvidersUtility';
import { Request, Response } from 'express';
import CronJob from 'node-cron';

const supportedChangesSets = [
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

export function initScheduledJobs() {
  const showsJob = CronJob.schedule('0 2 * * *', () => {
    console.log('Starting the show change job');
    const startTime = performance.now();
    updateShows();
    const endTime = performance.now();
    console.log(`Ending the show change job`, endTime - startTime);
  });

  const moviesJob = CronJob.schedule('0 1 7,14,21,28 * *', () => {
    console.log('Starting the movie change job');
    const startTime = performance.now();
    updateMovies();
    const endTime = performance.now();
    console.log(`Ending the movie change job`, endTime - startTime);
  });

  showsJob.start();
  moviesJob.start();
  console.log('Job Scheduler Initialized');
}

async function updateMovies() {
  try {
    const movies = await Movie.getMoviesForUpdates();
    movies.forEach(async (movie) => {
      await sleep(500);
      await checkForMovieChanges(movie);
    });
  } catch (error) {
    console.log({ message: 'Unexpected error while checking for movie updates', error: error });
  }
}

async function checkForMovieChanges(content: ContentUpdates) {
  const { currentDate, pastDate } = generateDates(10);
  try {
    const changesResponse = await axiosTMDBAPIInstance.get(
      `movie/${content.tmdb_id}/changes?end_date=${currentDate}&start_date=${pastDate}`,
    );
    const changes: Change[] = changesResponse.data.changes;
    const supportedChanges = changes.filter((item) => supportedChangesSets.includes(item.key));
    if (supportedChanges.length > 0) {
      console.log('Movies has changes, updating >>> ', content.title);
      const movieDetailsResponse = await axiosTMDBAPIInstance.get(
        `/movie/${content.tmdb_id}?append_to_response=release_dates%2Cwatch%2Fproviders&language=en-US`,
      );
      const movieDetails = movieDetailsResponse.data;
      const movieToFavorite = new Movie(
        movieDetails.id,
        movieDetails.title,
        movieDetails.overview,
        movieDetails.release_date,
        movieDetails.runtime,
        buildTMDBImagePath(movieDetails.poster_path),
        movieDetails.vote_average,
        getUSMPARating(movieDetails.release_dates),
        content.id,
        getUSWatchProviders(movieDetails, 9998),
        movieDetails.genres.map((genre: { id: any }) => genre.id),
      );
      movieToFavorite.update();
    }
  } catch (error) {
    console.error('Error checking movie changes', content, error);
  }
}

async function updateShows() {
  try {
    const shows = await Show.getShowsForUpdates();
    shows.forEach(async (show) => {
      await sleep(500);
      await checkForShowChanges(show);
    });
  } catch (error) {
    console.log({ message: 'Unexpected error while checking for show updates', error: error });
  }
}

async function checkForShowChanges(content: ContentUpdates) {
  const { currentDate, pastDate } = generateDates(2);
  try {
    const changesResponse = await axiosTMDBAPIInstance.get(
      `tv/${content.tmdb_id}/changes?end_date=${currentDate}&start_date=${pastDate}`,
    );
    const changes: Change[] = changesResponse.data.changes;
    const supportedChanges = changes.filter((item) => supportedChangesSets.includes(item.key));
    if (supportedChanges.length > 0) {
      console.log('Show has changes, updating >>> ', content.title);
      const showDetailsResponse = await axiosTMDBAPIInstance.get(
        `/tv/${content.tmdb_id}?append_to_response=content_ratings,watch/providers`,
      );
      const showDetails = showDetailsResponse.data;
      const showToUpdate = new Show(
        showDetails.id,
        showDetails.name,
        showDetails.overview,
        showDetails.first_air_date,
        buildTMDBImagePath(showDetails.poster_path),
        showDetails.vote_average,
        getUSRating(showDetails.content_ratings),
        content.id,
        getUSWatchProviders(showDetails, 9999),
        showDetails.number_of_episodes,
        showDetails.number_of_seasons,
        showDetails.genres.map((genre: { id: any }) => genre.id),
        showDetails.status,
        showDetails.type,
        getInProduction(showDetails),
        showDetails.last_air_date,
        getEpisodeToAirId(showDetails.last_episode_to_air),
        getEpisodeToAirId(showDetails.next_episode_to_air),
        getUSNetwork(showDetails.networks),
      );
      await showToUpdate.update();
      const profileIds = await showToUpdate.getProfilesForShow();

      const seasonChanges = changes.filter((item) => item.key === 'season');
      if (seasonChanges.length > 0) {
        processSeasonChanges(seasonChanges[0].items, showDetails, content, profileIds);
      }
    }
  } catch (error) {
    console.error('Error checking show changes', content, error);
  }
}

function processSeasonChanges(changes: ChangeItem[], responseShow: any, content: ContentUpdates, profileIds: number[]) {
  const uniqueSeasonIds = filterSeasonChanges(changes);
  const responseShowSeasons = responseShow.seasons;
  console.log('Show has changes to season(s), updating >>>', uniqueSeasonIds);
  uniqueSeasonIds.forEach(async (season_id) => {
    await sleep(500);
    const responseShowSeason = responseShowSeasons.find((season: { id: number }) => season.id === season_id);
    if (responseShowSeason) {
      const seasonToUpdate = new Season(
        content.id,
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
        const response = await axiosTMDBAPIInstance.get(
          `/tv/${content.tmdb_id}/season/${seasonToUpdate.season_number}`,
        );
        const responseData = response.data;
        responseData.episodes.forEach(async (responseEpisode: any) => {
          const episodeToUpdate = new Episode(
            responseEpisode.id,
            content.id,
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
  const { currentDate, pastDate } = generateDates(2);
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

function generateDates(lookback: number): { currentDate: string; pastDate: string } {
  const currentDate = new Date();
  const pastDate = new Date();

  pastDate.setDate(currentDate.getDate() - lookback);

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
