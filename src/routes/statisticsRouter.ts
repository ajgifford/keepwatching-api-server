import accountRouter from './statistics/accountStatisticsRouter';
import profileRouter from './statistics/profileStatisticsRouter';
import express from 'express';

const router = express.Router();
router.use(accountRouter);
router.use(profileRouter);

export default router;
