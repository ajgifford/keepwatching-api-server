import { z } from 'zod';

export const addShowFavoriteSchema = z.object({
  id: z.number().int().positive('Show ID must be a positive integer'),
});

export const showAndProfileParamSchema = z.object({
  profileId: z.string().regex(/^\d+$/, 'Profile ID must be a number'),
  showId: z.string().regex(/^\d+$/, 'Show ID must be a number'),
});

export const showWatchStatusSchema = z.object({
  show_id: z.number().int().positive('Show ID must be a positive integer'),
  status: z.enum(['WATCHED', 'WATCHING', 'NOT_WATCHED'], {
    errorMap: () => ({ message: 'Status must be one of: WATCHED, WATCHING, or NOT_WATCHED' }),
  }),
  recursive: z.boolean().default(false).optional(),
});

export type ShowWatchStatusParams = z.infer<typeof showWatchStatusSchema>;
export type AddShowFavoriteParams = z.infer<typeof addShowFavoriteSchema>;
export type ShowAndProfileParams = z.infer<typeof showAndProfileParamSchema>;
