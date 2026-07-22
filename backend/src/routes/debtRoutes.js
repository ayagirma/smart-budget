import express from 'express';
import { getDebts, addDebt, updateDebt, deleteDebt } from '../controllers/debtController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getDebts)
  .post(protect, addDebt);

router.route('/:id')
  .put(protect, updateDebt)
  .delete(protect, deleteDebt);

export default router;
