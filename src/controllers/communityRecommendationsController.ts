import {
  ContentRecommendationDetailsParams,
  CommunityRecommendationsQuery,
  RatingProfileParams,
  SendRecommendationBody,
} from '@ajgifford/keepwatching-common-server/schema';
import { communityRecommendationsService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

/**
 * Get the current profile's own recommendations
 *
 * @route GET /api/v1/accounts/:accountId/profiles/:profileId/recommendations
 */
export const getProfileRecommendations = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId } = req.params as unknown as RatingProfileParams;
    const recommendations = await communityRecommendationsService.getRecommendationsForProfile(profileId);
    res.status(200).json({ message: 'Retrieved recommendations for profile', recommendations });
  } catch (error) {
    next(error);
  }
});

/**
 * Add a community recommendation
 *
 * @route POST /api/v1/accounts/:accountId/profiles/:profileId/recommendations
 */
export const addRecommendation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId } = req.params as unknown as RatingProfileParams;
    const { contentType, contentId, rating, message } = req.body as SendRecommendationBody;
    const recommendation = await communityRecommendationsService.addRecommendation(
      profileId,
      contentType,
      contentId,
      rating,
      message,
    );
    res.status(201).json({ message: 'Recommendation added successfully', recommendation });
  } catch (error) {
    next(error);
  }
});

/**
 * Remove a community recommendation
 *
 * @route DELETE /api/v1/accounts/:accountId/profiles/:profileId/recommendations
 */
export const removeRecommendation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId } = req.params as unknown as RatingProfileParams;
    const { contentType, contentId } = req.body as SendRecommendationBody;
    await communityRecommendationsService.removeRecommendation(profileId, contentType, contentId);
    res.status(200).json({ message: 'Recommendation removed successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * Get the anonymized community recommendations feed
 *
 * @route GET /community/recommendations
 */
export const getCommunityRecommendations = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contentType } = req.query as unknown as CommunityRecommendationsQuery;
    const recommendations = await communityRecommendationsService.getCommunityRecommendations(contentType);
    res.status(200).json({ message: 'Retrieved community recommendations', recommendations });
  } catch (error) {
    next(error);
  }
});

/**
 * Get individual recommendation details (rating + message per recommender) for a piece of content
 *
 * @route GET /community/recommendations/:contentType/:contentId
 */
export const getRecommendationDetails = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contentType, contentId } = req.params as unknown as ContentRecommendationDetailsParams;
    const details = await communityRecommendationsService.getRecommendationDetails(contentType, contentId);
    res.status(200).json({ message: 'Retrieved recommendation details', details });
  } catch (error) {
    next(error);
  }
});
