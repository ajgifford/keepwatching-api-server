import { z } from 'zod';

export const profileIdParamSchema = z.object({
  profileId: z.string().regex(/^\d+$/, 'Profile ID must be a number'),
});

export type ProfileIdParams = z.infer<typeof profileIdParamSchema>;
