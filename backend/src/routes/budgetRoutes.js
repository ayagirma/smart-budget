import express from 'express';
import { getBudgets, setBudget, deleteBudget } from '../controllers/budgetController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getBudgets).post(protect, setBudget);
router.route('/:id').delete(protect, deleteBudget);

export default router;
