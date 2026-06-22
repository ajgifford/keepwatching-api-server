import {
  AddWatchlistItemBody,
  UpdateWatchlistPrioritiesBody,
  WatchlistItemParams,
  WatchlistParams,
} from '@ajgifford/keepwatching-common-server/schema';
import { watchlistService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';

/**
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/watchlist
 */
export async function getWatchlist(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as unknown as WatchlistParams;
    const watchlist = await watchlistService.getWatchlist(profileId);
    res.status(200).json({ message: 'Successfully retrieved watchlist', watchlist });
  } catch (error) {
    next(error);
  }
}

/**
 * @route POST /api/v1/accounts/:accountId/profiles/:profileId/watchlist
 */
export async function addWatchlistItem(req: Request, res: Response, next: NextFunction) {
  try {
    const { accountId, profileId } = req.params as unknown as WatchlistParams;
    const { contentType, contentId }: AddWatchlistItemBody = req.body;
    const item = await watchlistService.addItem(accountId, profileId, contentType, contentId);
    res.status(201).json({ message: 'Successfully added item to watchlist', item });
  } catch (error) {
    next(error);
  }
}

/**
 * @route DELETE /api/v1/accounts/:accountId/profiles/:profileId/watchlist/:itemId
 */
export async function removeWatchlistItem(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId, itemId } = req.params as unknown as WatchlistItemParams;
    await watchlistService.removeItem(itemId, profileId);
    res.status(200).json({ message: 'Successfully removed item from watchlist' });
  } catch (error) {
    next(error);
  }
}

/**
 * @route PUT /api/v1/accounts/:accountId/profiles/:profileId/watchlist/priorities
 */
export async function updateWatchlistPriorities(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params as unknown as WatchlistParams;
    const { priorities }: UpdateWatchlistPrioritiesBody = req.body;
    await watchlistService.updatePriorities(profileId, priorities);
    res.status(200).json({ message: 'Successfully updated watchlist priorities' });
  } catch (error) {
    next(error);
  }
}
