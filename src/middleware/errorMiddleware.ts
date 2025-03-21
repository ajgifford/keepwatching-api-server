import { AxiosError } from 'axios';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  const requestId = uuidv4();

  if (error instanceof CustomError) {
    res.status(error.statusCode).json({
      status: 'error',
      requestId,
      error: {
        code: error.errorCode,
        message: error.message,
      },
    });
  } else if (error instanceof AxiosError && error.response) {
    const status = error.response.status;
    if (status === 429) {
      res.status(429).json({
        message: 'Rate limit exceeded on external API',
        retryAfter: error.response.headers['retry-after'] || 60,
      });
      return;
    }
    res.status(status).json({
      message: `External API error: ${error.response.data.message || 'Unknown error'}`,
      error: error.message,
    });
    return;
  } else {
    res.status(500).json({
      status: 'error',
      requestId,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
};

export class CustomError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public errorCode: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string) {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class BadRequestError extends CustomError {
  constructor(message: string) {
    super(message, 400, 'BAD_REQUEST');
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string) {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string) {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends CustomError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class NoAffectedRowsError extends CustomError {
  constructor(message: string) {
    super(message, 400, 'NO_AFFECTED_ROWS');
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string, originalError: any) {
    super(message, 500, 'DATABASE_ERROR');
  }
}

export class TMDBAPIError extends CustomError {
  constructor(message: string, originalError: any) {
    super(message, 500, 'TMDB_API_ERROR');
  }
}
