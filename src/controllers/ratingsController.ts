import { RatingParams, RatingProfileParams, UpsertRatingBody } from '@ajgifford/keepwatching-common-server/schema';
import { ratingsService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

/**
 * Get all ratings for a profile
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/ratings
 */
export const getRatingsForProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId } = req.params as unknown as RatingProfileParams;
    const ratings = await ratingsService.getRatingsForProfile(profileId);
    res.status(200).json({ message: 'Retrieved ratings for profile', ratings });
  } catch (error) {
    next(error);
  }
});

/**
 * Upsert a rating for a piece of content
 *
 * @route POST /api/v1/accounts/:accountId/profiles/:profileId/ratings
 */
export const upsertRating = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId } = req.params as unknown as RatingProfileParams;
    const { contentType, contentId, rating, note, contentTitle, posterImage } = req.body as UpsertRatingBody;
    const savedRating = await ratingsService.upsertRating(
      profileId,
      contentType,
      contentId,
      rating,
      note,
      contentTitle,
      posterImage,
    );
    res.status(200).json({ message: 'Rating saved successfully', rating: savedRating });
  } catch (error) {
    next(error);
  }
});

/**
 * Delete a rating
 *
 * @route DELETE /api/v1/accounts/:accountId/profiles/:profileId/ratings/:ratingId
 */
export const deleteRating = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId, ratingId } = req.params as unknown as RatingParams;
    await ratingsService.deleteRating(profileId, ratingId);
    res.status(200).json({ message: 'Rating deleted successfully' });
  } catch (error) {
    next(error);
  }
});
