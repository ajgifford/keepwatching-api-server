import { z } from 'zod';

export const accountSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name must be less than 50 characters').trim(),
  email: z.string().email('Invalid email format'),
  uid: z.string().min(1, 'UID cannot be empty'),
});

export const accountUpdateSchema = z.object({
  account_name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be less than 50 characters')
    .trim(),
  default_profile_id: z.number().int().positive('Default profile ID must be a positive integer'),
});

export const loginSchema = z.object({
  uid: z.string().min(1, 'UID cannot be empty'),
});

export const googleLoginSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty'),
  email: z.string().email('Invalid email format'),
  uid: z.string().min(1, 'UID cannot be empty'),
  photoURL: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number'),
});

export const bothIdsParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number'),
  profileId: z.string().regex(/^\d+$/, 'Profile ID must be a number'),
});

export const profileNameSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name must be less than 50 characters').trim(),
});

export type AccountParams = z.infer<typeof accountSchema>;
export type AccountUpdateParams = z.infer<typeof accountUpdateSchema>;
export type LoginParams = z.infer<typeof loginSchema>;
export type GoogleLoginParams = z.infer<typeof googleLoginSchema>;
export type AccountIdParams = z.infer<typeof idParamSchema>;
export type AccountProfileIdsParams = z.infer<typeof bothIdsParamSchema>;
export type ProfileNameParams = z.infer<typeof profileNameSchema>;
