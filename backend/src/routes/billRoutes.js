import express from 'express';
import { getBills, addBill, markBillPaid, deleteBill } from '../controllers/billController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getBills)
  .post(protect, addBill);

router.route('/:id/paid')
  .put(protect, markBillPaid);

router.route('/:id')
  .delete(protect, deleteBill);

export default router;
