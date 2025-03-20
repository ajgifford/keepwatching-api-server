import { z } from 'zod';

export const accountIdParamSchema = z.object({
  accountId: z.string().regex(/^\d+$/, 'Account ID must be numeric'),
});

export const dismissParamSchema = z.object({
  accountId: z.string().regex(/^\d+$/, 'Account ID must be numeric'),
  notificationId: z.string().regex(/^\d+$/, 'Notification ID must be numeric'),
});

export type AccountIdParams = z.infer<typeof accountIdParamSchema>;
export type DismissParams = z.infer<typeof dismissParamSchema>;
