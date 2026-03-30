import { AccountAndProfileIdsParams } from '@ajgifford/keepwatching-common-server/schema';
import { calendarService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';

// GET /api/v1/accounts/:accountId/profiles/:profileId/calendar
export const getCalendarContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId } = req.params as unknown as AccountAndProfileIdsParams;
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    const results = await calendarService.getCalendarContentForProfile(profileId, startDate, endDate);

    res.status(200).json({
      message: 'Successfully retrieved calendar content',
      results,
    });
  } catch (error) {
    next(error);
  }
};
