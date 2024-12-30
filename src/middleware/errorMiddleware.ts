import { NextFunction, Request, Response } from 'express';

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);

  if (err instanceof AuthenticationError) {
    res.status(401).json({ message: 'Unauthorized: ' + err.message });
  } else if (err instanceof BadRequestError) {
    return res.status(400).json({ message: err.message || 'Request failed' });
  } else if (err instanceof NotFoundError) {
    return res.status(401).json({ message: err.message || 'Item not found' });
  } else {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export { errorHandler, AuthenticationError, BadRequestError, NotFoundError };
