import {
  DiscoverChangesQuery,
  DiscoverTopQuery,
  DiscoverTrendingQuery,
} from '@ajgifford/keepwatching-common-server/schema';
import { contentDiscoveryService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';

// GET /api/v1/discover/top
export const discoverTopContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { showType, service } = req.query as DiscoverTopQuery;
    const topContent = await contentDiscoveryService.discoverTopContent(showType, service);
    res.status(200).json(topContent);
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/discover/changes
export const discoverChangesContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { showType, service, changeType } = req.query as DiscoverChangesQuery;
    const changesContent = await contentDiscoveryService.discoverChangesContent(showType, service, changeType);
    res.status(200).json(changesContent);
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/discover/trending
export const discoverTrendingContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { showType, page = 1 } = req.query as unknown as DiscoverTrendingQuery;
    const trendingContent = await contentDiscoveryService.discoverTrendingContent(showType, page);
    res.status(200).json(trendingContent);
  } catch (error) {
    next(error);
  }
};
