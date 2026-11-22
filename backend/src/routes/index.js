import { Router } from 'express';
import applicationRoutes from './application.routes.js';
import authRoutes from './auth.routes.js';
import healthRoutes from './health.routes.js';
import jobRoutes from './job.routes.js';
import resumeRoutes from './resume.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/resume', resumeRoutes);

export default router;
