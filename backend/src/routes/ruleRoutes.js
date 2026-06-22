import express from 'express';
import { query } from '../db/index.js';
import { protect } from '../middleware/authMiddleware.js';
import { autoCategorize } from '../utils/categorization.js';

const router = express.Router();

// Preview rules on uncategorized transactions
router.get('/preview', protect, async (req, res) => {
  const { keyword, match_type } = req.query;
  const userId = req.user.id;

  if (!keyword) {
    return res.json([]);
  }

  try {
    const lowerKeyword = keyword.toLowerCase();
    const typePattern = match_type || 'contains';

    let condition = '';
    let paramValue = '';

    if (typePattern === 'exact') {
      condition = 'LOWER(description) = $2';
      paramValue = lowerKeyword;
    } else if (typePattern === 'starts_with') {
      condition = 'LOWER(description) LIKE $2';
      paramValue = `${lowerKeyword}%`;
    } else {
      condition = 'LOWER(description) LIKE $2';
      paramValue = `%${lowerKeyword}%`;
    }

    const { rows } = await query(
      `SELECT id, description, amount, date, type 
       FROM transactions 
       WHERE user_id = $1 AND category_id IS NULL AND ${condition} 
       ORDER BY date DESC 
       LIMIT 50`,
      [userId, paramValue]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error previewing rule:', err);
    res.status(500).json({ error: 'Failed to preview rule' });
  }
});

// Get all rules for the logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT r.*, c.name as category_name, c.color as category_color, c.icon as category_icon
       FROM category_rules r 
       JOIN categories c ON r.category_id = c.id 
       WHERE r.user_id = $1 ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

// Create a new rule
router.post('/', protect, async (req, res) => {
  const { category_id, keyword, match_type } = req.body;
  if (!category_id || !keyword) {
    return res.status(400).json({ error: 'Category ID and Keyword are required' });
  }

  try {
    const { rows } = await query(
      `INSERT INTO category_rules (user_id, category_id, keyword, match_type) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, category_id, keyword.toLowerCase(), match_type || 'contains']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Rule with this keyword already exists' });
    }
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

// Delete a rule
router.delete('/:id', protect, async (req, res) => {
  try {
    const { rows } = await query(
      'DELETE FROM category_rules WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    res.json({ message: 'Rule deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});

// Apply rules to all uncategorized transactions
router.post('/apply', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows: uncategorized } = await query(
      'SELECT id, description FROM transactions WHERE user_id = $1 AND category_id IS NULL',
      [userId]
    );

    let categorizedCount = 0;
    for (const t of uncategorized) {
      const categoryId = await autoCategorize(userId, t.description);
      if (categoryId) {
        await query('UPDATE transactions SET category_id = $1 WHERE id = $2', [categoryId, t.id]);
        categorizedCount++;
      }
    }

    res.json({ message: `Successfully categorized ${categorizedCount} transactions.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to apply rules' });
  }
});

export default router;
