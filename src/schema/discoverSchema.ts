import { z } from 'zod';

export const discoverQuerySchema = z.object({
  showType: z.enum(['movie', 'series'], {
    errorMap: () => ({ message: 'Show type must be either "movie" or "series"' }),
  }),
  service: z.enum(['netflix', 'disney', 'hbo', 'apple', 'prime'], {
    errorMap: () => ({ message: 'Invalid streaming service provided' }),
  }),
});

export type DiscoverQuery = z.infer<typeof discoverQuerySchema>;
