import { AccountAndProfileIdsParams } from '@ajgifford/keepwatching-common-server/schema';
import { accountService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware to track account activity
 *
 * This middleware extracts the accountId from request parameters and asynchronously
 * updates the last_activity timestamp. It uses a fire-and-forget pattern to avoid
 * blocking the request/response flow.
 *
 * The middleware will:
 * - Extract accountId from req.params.accountId
 * - Call accountService.trackActivity() without awaiting
 * - Immediately call next() to continue request processing
 * - Silently skip if accountId is not present in params
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const trackAccountActivity = (req: Request, res: Response, next: NextFunction): void => {
  const { accountId } = req.params as unknown as AccountAndProfileIdsParams;

  if (accountId) {
    // Fire and forget - don't await, don't block the request
    accountService.trackActivity(accountId).catch(() => {});
  }

  // Continue immediately without waiting for activity tracking
  next();
};
