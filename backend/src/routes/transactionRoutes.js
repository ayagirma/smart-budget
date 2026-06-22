import express from 'express';
import {
  getTransactions,
  addTransaction,
  getDashboardSummary,
  updateTransaction,
  deleteTransaction,
  uploadCsvTransactions,
  getSpendingForecast
} from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/forecast').get(protect, getSpendingForecast);
router.route('/summary').get(protect, getDashboardSummary);
router.route('/').get(protect, getTransactions).post(protect, addTransaction);
router.route('/upload_csv').post(protect, uploadCsvTransactions);
router.route('/:id').put(protect, updateTransaction).delete(protect, deleteTransaction);

export default router;
