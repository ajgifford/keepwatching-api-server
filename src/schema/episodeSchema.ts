import { z } from 'zod';

export const profileIdParamSchema = z.object({
  profileId: z.string().regex(/^\d+$/, 'Profile ID must be a number'),
});

export const episodeWatchStatusSchema = z.object({
  episode_id: z.number().int().positive('Episode ID must be a positive integer'),
  status: z.enum(['WATCHED', 'WATCHING', 'NOT_WATCHED'], {
    errorMap: () => ({ message: 'Status must be one of: WATCHED, WATCHING, or NOT_WATCHED' }),
  }),
});

export const nextEpisodeWatchStatusSchema = z.object({
  show_id: z.number().int().positive('Show ID must be a positive integer'),
  season_id: z.number().int().positive('Season ID must be a positive integer'),
  episode_id: z.number().int().positive('Episode ID must be a positive integer'),
  status: z.enum(['WATCHED', 'WATCHING', 'NOT_WATCHED'], {
    errorMap: () => ({ message: 'Status must be one of: WATCHED, WATCHING, or NOT_WATCHED' }),
  }),
});

export type ProfileIdParams = z.infer<typeof profileIdParamSchema>;
export type EpisodeWatchStatusParams = z.infer<typeof episodeWatchStatusSchema>;
export type NextEpisodeWatchStatusParams = z.infer<typeof nextEpisodeWatchStatusSchema>;
