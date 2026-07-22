import { query } from '../db/index.js';

// @desc    Get all debts for logged in user
// @route   GET /api/debts
// @access  Private
export const getDebts = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      'SELECT * FROM debts WHERE user_id = $1 ORDER BY balance DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching debts:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Add a new debt record
// @route   POST /api/debts
// @access  Private
export const addDebt = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, balance, interest_rate, minimum_payment, type } = req.body;

    if (!name || balance === undefined || interest_rate === undefined || minimum_payment === undefined) {
      return res.status(400).json({ error: 'Name, balance, interest_rate, and minimum_payment are required' });
    }

    const result = await query(
      `INSERT INTO debts (user_id, name, balance, interest_rate, minimum_payment, type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, name, parseFloat(balance), parseFloat(interest_rate), parseFloat(minimum_payment), type || 'credit_card']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding debt:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update a debt record
// @route   PUT /api/debts/:id
// @access  Private
export const updateDebt = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, balance, interest_rate, minimum_payment, type } = req.body;

    const result = await query(
      `UPDATE debts 
       SET name = $1, balance = $2, interest_rate = $3, minimum_payment = $4, type = $5
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [name, parseFloat(balance), parseFloat(interest_rate), parseFloat(minimum_payment), type, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Debt not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating debt:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a debt record
// @route   DELETE /api/debts/:id
// @access  Private
export const deleteDebt = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM debts WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Debt not found or unauthorized' });
    }

    res.json({ message: 'Debt removed successfully' });
  } catch (err) {
    console.error('Error deleting debt:', err.message);
    res.status(500).send('Server Error');
  }
};
