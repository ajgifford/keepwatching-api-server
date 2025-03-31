import { ACCOUNT_KEYS, PROFILE_KEYS } from '../constants/cacheKeys';
import { BadRequestError, NotFoundError } from '../middleware/errorMiddleware';
import Account from '../models/account';
import Movie from '../models/movie';
import Profile from '../models/profile';
import Show from '../models/show';
import { getAccountImage, getProfileImage } from '../utils/imageUtility';
import { CacheService } from './cacheService';
import { episodesService } from './episodesService';
import { errorService } from './errorService';
import { moviesService } from './moviesService';
import { showService } from './showService';

/**
 * Service class for handling account-related business logic
 */
export class AccountService {
  private cache: CacheService;

  constructor() {
    this.cache = CacheService.getInstance();
  }

  /**
   * Retrieves all profiles for a specific account
   *
   * @param accountId - ID of the account to get profiles for
   * @returns Array of profile objects with basic information
   * @throws {BadRequestError} If profiles cannot be retrieved
   */
  public async getProfiles(accountId: number) {
    try {
      return await this.cache.getOrSet(
        ACCOUNT_KEYS.profiles(accountId),
        async () => {
          const profiles = await Profile.getAllByAccountId(accountId);
          if (!profiles) {
            throw new BadRequestError('Failed to get all profiles for an account');
          }

          return profiles.map((profile) => ({
            id: profile.id,
            name: profile.name,
            image: getProfileImage(profile),
          }));
        },
        600,
      );
    } catch (error) {
      throw errorService.handleError(error, `getProfiles(${accountId})`);
    }
  }

  /**
   * Retrieves a specific profile with all its associated content
   *
   * @param profileId - ID of the profile to retrieve
   * @returns Profile with shows, movies, and episode data
   * @throws {NotFoundError} If the profile is not found
   */
  public async getProfile(profileId: number) {
    try {
      return await this.cache.getOrSet(
        PROFILE_KEYS.complete(profileId),
        async () => {
          const profile = await Profile.findById(profileId);
          if (!profile) {
            throw new NotFoundError('Profile not found');
          }

          const [
            shows,
            movies,
            recentEpisodes,
            upcomingEpisodes,
            nextUnwatchedEpisodes,
            recentMoviesData,
            upcomingMoviesData,
          ] = await Promise.all([
            showService.getShowsForProfile(profileId.toString()),
            moviesService.getMoviesForProfile(profileId.toString()),
            episodesService.getRecentEpisodesForProfile(profileId.toString()),
            episodesService.getUpcomingEpisodesForProfile(profileId.toString()),
            Show.getNextUnwatchedEpisodesForProfile(profileId.toString()),
            Movie.getRecentMovieReleasesForProfile(profileId.toString()),
            Movie.getUpcomingMovieReleasesForProfile(profileId.toString()),
          ]);

          return {
            profile: {
              id: profile.id,
              name: profile.name,
              image: getProfileImage(profile),
            },
            shows,
            recentEpisodes,
            upcomingEpisodes,
            nextUnwatchedEpisodes,
            movies,
            recentMovies: recentMoviesData,
            upcomingMovies: upcomingMoviesData,
          };
        },
        600,
      );
    } catch (error) {
      throw errorService.handleError(error, `getProfile(${profileId})`);
    }
  }

  /**
   * Updates an account's details (name and default profile)
   *
   * @param accountId - ID of the account to update
   * @param name - New name for the account
   * @param defaultProfileId - ID of the profile to set as default
   * @returns Updated account information
   * @throws {NotFoundError} If the account is not found
   * @throws {BadRequestError} If the account update fails
   */
  public async editAccount(accountId: number, name: string, defaultProfileId: number) {
    try {
      const account = await Account.findById(accountId);
      if (!account) {
        throw new NotFoundError('Account not found');
      }

      const updatedAccount = await account.editAccount(name, defaultProfileId);
      if (!updatedAccount) {
        throw new BadRequestError('Failed to update the account');
      }

      return {
        id: updatedAccount.account_id,
        name: updatedAccount.account_name,
        email: updatedAccount.email,
        image: getAccountImage(updatedAccount),
        default_profile_id: updatedAccount.default_profile_id,
      };
    } catch (error) {
      throw errorService.handleError(error, `editAccount(${accountId})`);
    }
  }

  /**
   * Creates a new profile for an account
   *
   * @param accountId - ID of the account to create a profile for
   * @param name - Name for the new profile
   * @returns The newly created profile information
   * @throws {BadRequestError} If the profile creation fails
   */
  public async addProfile(accountId: number, name: string) {
    try {
      const profile = new Profile(accountId, name);
      await profile.save();

      if (!profile.id) {
        throw new BadRequestError('Failed to add a profile');
      }

      this.cache.invalidateAccount(accountId);

      return {
        id: profile.id,
        name: profile.name,
        image: getProfileImage(profile),
      };
    } catch (error) {
      throw errorService.handleError(error, `addProfile(${accountId}, ${name})`);
    }
  }

  /**
   * Updates an existing profile's details
   *
   * @param profileId - ID of the profile to update
   * @param name - New name for the profile
   * @returns Updated profile information
   * @throws {NotFoundError} If the profile is not found
   * @throws {BadRequestError} If the profile update fails
   */
  public async editProfile(profileId: number, name: string) {
    try {
      const profile = await Profile.findById(profileId);
      if (!profile) {
        throw new NotFoundError('Profile not found');
      }

      const updatedProfile = await profile.update(name);
      if (!updatedProfile) {
        throw new BadRequestError('Failed to update profile');
      }

      this.cache.invalidateProfile(profileId);
      this.cache.invalidateProfileStatistics(profileId);

      return {
        id: updatedProfile.id,
        name: updatedProfile.name,
        image: getProfileImage(updatedProfile),
      };
    } catch (error) {
      throw errorService.handleError(error, `editProfile(${profileId})`);
    }
  }

  /**
   * Deletes a profile from an account
   *
   * This action will cascade delete all watch status data for the profile.
   *
   * @param profileId - ID of the profile to delete
   * @param accountId - ID of the account that owns the profile (for cache invalidation)
   * @returns A boolean indicating if the deletion was successful
   * @throws {NotFoundError} If the profile is not found
   * @throws {BadRequestError} If the profile deletion fails
   */
  public async deleteProfile(profileId: number, accountId: number) {
    try {
      const profile = await Profile.findById(profileId);
      if (!profile) {
        throw new NotFoundError('Profile not found');
      }

      const deleted = await profile.delete();
      if (!deleted) {
        throw new BadRequestError('Failed to delete profile');
      }

      this.cache.invalidateProfile(profileId);
      this.cache.invalidateAccount(accountId);

      return true;
    } catch (error) {
      throw errorService.handleError(error, `deleteProfile(${profileId})`);
    }
  }
}

export const accountService = new AccountService();
