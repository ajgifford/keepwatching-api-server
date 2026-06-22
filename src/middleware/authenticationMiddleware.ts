import { getServiceName } from '@ajgifford/keepwatching-common-server/config';
import { verifyFirebaseToken } from '@ajgifford/keepwatching-common-server/utils';
import { NextFunction, Request, Response } from 'express';

export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization header missing or malformed' });
      return;
    }

    const idToken = authHeader.split(' ')[1];
    const decodedToken = await verifyFirebaseToken(getServiceName(), idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error authenticating user:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};
