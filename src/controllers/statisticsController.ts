import { AccountAndProfileIdsParams, AccountIdParam } from '../schema/accountSchema';
import { showService } from '../services/showService';
import { getProfileMovieStatistics } from './moviesController';
import { NextFunction, Request, Response } from 'express';

/**
 * Get statistics (shows, movies and watch progress) for an account
 *
 * @route GET /api/v1/accounts/:accountId/statistics
 */
export async function getAccountStatistics(req: Request, res: Response, next: NextFunction) {
  try {
    const { accountId } = req.params as AccountIdParam;
    const showStatistics = await showService.getProfileShowStatistics(accountId);
    const movieStatistics = await getProfileMovieStatistics(accountId);
    const progress = await showService.getProfileWatchProgress(accountId);

    res.status(200).json({
      message: 'Successfully retrieved account statistics',
      results: { showStatistics, movieStatistics, progress },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get statistics (shows, movies and watch progress) for a profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/statistics
 */
export async function getProfileStatistics(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as AccountAndProfileIdsParams;
    const showStatistics = await showService.getProfileShowStatistics(profileId);
    const movieStatistics = await getProfileMovieStatistics(profileId);
    const progress = await showService.getProfileWatchProgress(profileId);

    res.status(200).json({
      message: 'Successfully retrieved profile statistics',
      results: { showStatistics, movieStatistics, progress },
    });
  } catch (error) {
    next(error);
  }
}
