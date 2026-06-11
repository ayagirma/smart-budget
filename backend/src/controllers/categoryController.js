import { query } from '../db/index.js';

// @desc    Get all categories for the logged-in user
// @route   GET /api/categories
// @access  Private
export const getCategories = async (req, res) => {
  try {
    const userId = req.user.id;
    // Get user-specific categories OR default categories (where user_id is NULL)
    const result = await query(
      'SELECT * FROM categories WHERE user_id = $1 OR is_default = true ORDER BY name ASC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private
export const addCategory = async (req, res) => {
  try {
    const { name, type, icon, color, classification } = req.body;
    const userId = req.user.id;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const newCategory = await query(
      'INSERT INTO categories (user_id, name, type, icon, color, classification) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, name, type, icon, color, classification || 'want']
    );

    res.status(201).json(newCategory.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a custom category
// @route   DELETE /api/categories/:id
// @access  Private
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Delete category ONLY if it belongs to the user and is NOT a default
    const result = await query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 AND is_default = false RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found or unauthorized to delete' });
    }

    res.json({ message: 'Category removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
