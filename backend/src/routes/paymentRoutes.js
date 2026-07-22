import express from 'express';
import { getPlanStatus, toggleDemoTier, createCheckoutSession, createPortalSession } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/status', protect, getPlanStatus);
router.post('/toggle-tier', protect, toggleDemoTier);
router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/create-portal-session', protect, createPortalSession);

export default router;
