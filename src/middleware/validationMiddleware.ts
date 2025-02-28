import { BadRequestError } from './errorMiddleware';
import { NextFunction, Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { ZodSchema, z } from 'zod';

/**
 * Creates a middleware function that validates request data against a Zod schema
 * @param schema The Zod schema to validate against
 * @param source Where to find the data to validate ('query', 'body', 'params')
 */
export const validateSchema = <T>(schema: ZodSchema<T>, source: 'query' | 'body' | 'params' = 'query') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      let data: any;

      // Determine which part of the request to validate
      switch (source) {
        case 'body':
          data = schema.parse(req.body);
          req.body = data;
          break;
        case 'params':
          data = schema.parse(req.params);
          req.params = data as ParamsDictionary;
          break;
        case 'query':
          data = schema.parse(req.query);
          req.query = data as ParsedQs;
          break;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');

        next(new BadRequestError(errorMessage));
      } else {
        next(new BadRequestError('Invalid request data'));
      }
    }
  };
};

/**
 * Creates a middleware function that validates multiple parts of the request
 * @param bodySchema Schema for request body (optional)
 * @param querySchema Schema for query parameters (optional)
 * @param paramsSchema Schema for route parameters (optional)
 */
export const validateRequest = <
  TBody = any,
  TQuery extends ParsedQs = ParsedQs,
  TParams extends ParamsDictionary = ParamsDictionary,
>(
  bodySchema?: ZodSchema<TBody>,
  querySchema?: ZodSchema<TQuery>,
  paramsSchema?: ZodSchema<TParams>,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate each part of the request if a schema is provided
      if (bodySchema) {
        req.body = bodySchema.parse(req.body);
      }

      if (querySchema) {
        req.query = querySchema.parse(req.query) as ParsedQs;
      }

      if (paramsSchema) {
        req.params = paramsSchema.parse(req.params) as ParamsDictionary;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');

        next(new BadRequestError(errorMessage));
      } else {
        next(new BadRequestError('Invalid request data'));
      }
    }
  };
};
