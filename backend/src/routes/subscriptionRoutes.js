import express from 'express';
import { getSubscriptions, addSubscription, toggleFlagSubscription, deleteSubscription } from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getSubscriptions)
  .post(protect, addSubscription);

router.route('/:id/flag')
  .put(protect, toggleFlagSubscription);

router.route('/:id')
  .delete(protect, deleteSubscription);

export default router;
