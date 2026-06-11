import express from 'express';
import { getCategories, addCategory, deleteCategory } from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes here are protected
router.route('/').get(protect, getCategories).post(protect, addCategory);
router.route('/:id').delete(protect, deleteCategory);

export default router;
