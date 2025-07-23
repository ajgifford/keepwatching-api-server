import {
  AccountIdParam,
  PreferenceRouteParams,
  getPreferenceBodySchema,
} from '@ajgifford/keepwatching-common-server/schema';
import { preferencesService } from '@ajgifford/keepwatching-common-server/services';
import { TypedPreferenceUpdate } from '@ajgifford/keepwatching-types';
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

/**
 * Get preferences for an account
 *
 * @route GET /api/v1/accounts/:accountId/preferences
 */
export const getAccountPreferences = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params as unknown as AccountIdParam;
    const preferences = await preferencesService.getAccountPreferences(accountId);

    res.status(200).json({
      message: 'Account preferences retrieved successfully',
      preferences,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get preferences for an account by type
 *
 * @route GET /api/v1/accounts/:accountId/preferences/:preferenceType
 */
export const getAccountPreferencesByType = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, preferenceType } = req.params as unknown as PreferenceRouteParams;
    const preferences = await preferencesService.getPreferencesByType(accountId, preferenceType);

    res.status(200).json({
      message: 'Account preferences retrieved successfully',
      preferences,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update preferences for an account by type
 *
 * @route PUT /api/v1/accounts/:accountId/preferences/:preferenceType
 */
export const updatePreferences = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, preferenceType } = req.params as unknown as PreferenceRouteParams;
    const bodySchema = getPreferenceBodySchema(preferenceType);
    const validatedUpdates = bodySchema.parse(req.body);
    const preferences = await preferencesService.updatePreferences(accountId, preferenceType, validatedUpdates);

    res.status(200).json({
      message: 'Account preferences updated successfully',
      preferences,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update multiple preferences for an account
 *
 * @route PUT /api/v1/accounts/:accountId/preferences
 */
export const updateMultiplePreferences = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params as unknown as AccountIdParam;
    const updates = req.body as Partial<TypedPreferenceUpdate>;
    const preferences = await preferencesService.updateMultiplePreferences(accountId, updates);

    res.status(200).json({
      message: 'Account preferences updated successfully',
      preferences,
    });
  } catch (error) {
    next(error);
  }
});
