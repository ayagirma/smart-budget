import express from 'express';
import { completeOnboarding } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/onboarding', protect, completeOnboarding);

export default router;
