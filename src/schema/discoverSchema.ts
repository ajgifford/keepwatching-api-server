import { z } from 'zod';

export const discoverTopQuerySchema = z.object({
  showType: z.enum(['movie', 'series'], {
    errorMap: () => ({ message: 'Show type must be either "movie" or "series"' }),
  }),
  service: z.enum(['netflix', 'disney', 'hbo', 'apple', 'prime'], {
    errorMap: () => ({ message: 'Invalid streaming service provided' }),
  }),
});

export const discoverTrendingQuerySchema = z.object({
  showType: z.enum(['movie', 'series'], {
    errorMap: () => ({ message: 'Show type must be either "movie" or "series"' }),
  }),
});

export const discoverSimilarContentSchema = z.object({
  id: z.string().min(1).regex(/^\d+$/, { message: 'ID must be numeric' }),
});

export type DiscoverTopQuery = z.infer<typeof discoverTopQuerySchema>;
export type DiscoverTrendingQuery = z.infer<typeof discoverTrendingQuerySchema>;
export type SimilarContentParams = z.infer<typeof discoverSimilarContentSchema>;
