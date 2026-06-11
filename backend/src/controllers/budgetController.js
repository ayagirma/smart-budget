import { query } from '../db/index.js';

// @desc    Get all budgets for a user
// @route   GET /api/budgets
// @access  Private
export const getBudgets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    let queryStr = `
      SELECT b.*, c.name as category_name
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = $1
    `;
    const params = [userId];

    if (month && year) {
      queryStr += ' AND b.month = $2 AND b.year = $3';
      params.push(month, year);
    }

    const result = await query(queryStr, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Set or update a budget for a category
// @route   POST /api/budgets
// @access  Private
export const setBudget = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category_id, amount, month, year } = req.body;

    if (!category_id || amount === undefined || !month || !year) {
      return res.status(400).json({ error: 'category_id, amount, month, and year are required' });
    }

    const result = await query(
      `INSERT INTO budgets (user_id, category_id, amount, month, year)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, category_id, month, year)
       DO UPDATE SET amount = EXCLUDED.amount
       RETURNING *`,
      [userId, category_id, amount, month, year]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
