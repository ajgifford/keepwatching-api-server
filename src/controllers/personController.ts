import { PersonIdParams } from '@ajgifford/keepwatching-common-server/schema';
import { personService } from '@ajgifford/keepwatching-common-server/services';
import { NextFunction, Request, Response } from 'express';

export const getPersonDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { personId } = req.params as unknown as PersonIdParams;

    const person = await personService.getPersonDetails(personId);
    res.status(200).json({
      message: 'Successfully retrieved person details',
      person,
    });
  } catch (error) {
    next(error);
  }
};
