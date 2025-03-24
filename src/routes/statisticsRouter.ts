import { getAccountStatistics, getProfileStatistics } from '../controllers/statisticsController';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateSchema } from '../middleware/validationMiddleware';
import { accountAndProfileIdsParamSchema, accountIdParamSchema } from '../schema/accountSchema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/statistics',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  getAccountStatistics,
);

router.get(
  '/api/v1/accounts/:accountId/profiles/:profileId/statistics',
  validateSchema(accountAndProfileIdsParamSchema, 'params'),
  authorizeAccountAccess,
  getProfileStatistics,
);

export default router;
