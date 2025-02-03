import { NextFunction, Request, Response } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof AuthenticationError) {
    res.status(401).json({ message: 'Unauthorized: ' + err.message });
  } else if (err instanceof BadRequestError) {
    res.status(400).json({ message: err.message || 'Request failed' });
  } else if (err instanceof NotFoundError) {
    res.status(401).json({ message: err.message || 'Item not found' });
  } else {
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}
