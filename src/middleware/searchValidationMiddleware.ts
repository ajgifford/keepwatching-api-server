import { BadRequestError } from '../middleware/errorMiddleware';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

const searchParamsSchema = z.object({
  searchString: z.string().min(1).max(100).trim(),
  year: z
    .string()
    .regex(/^\d{4}$/)
    .optional(),
  page: z.string().regex(/^\d+$/).optional(),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

export const validateSearchParams = (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = searchParamsSchema.safeParse(req.query);

    if (!result.success) {
      const errorMessage = result.error.issues.map((issue) => issue.message).join(', ');
      return next(new BadRequestError(errorMessage));
    }

    req.validatedSearchParams = result.data;

    next();
  } catch (error) {
    next(new BadRequestError('Invalid search parameters'));
  }
};
