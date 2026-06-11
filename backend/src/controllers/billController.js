import { query } from '../db/index.js';

// @desc    Get all bills for a user
// @route   GET /api/bills
// @access  Private
export const getBills = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      'SELECT * FROM bills WHERE user_id = $1 ORDER BY due_date ASC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Add a new scheduled bill
// @route   POST /api/bills
// @access  Private
export const addBill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, amount, due_date } = req.body;

    if (!title || amount === undefined || !due_date) {
      return res.status(400).json({ error: 'Title, amount, and due_date are required' });
    }

    const result = await query(
      'INSERT INTO bills (user_id, title, amount, due_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, title, amount, due_date]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Mark bill as paid or unpaid
// @route   PUT /api/bills/:id/paid
// @access  Private
export const markBillPaid = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { is_paid } = req.body;

    const result = await query(
      'UPDATE bills SET is_paid = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [is_paid, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a bill
// @route   DELETE /api/bills/:id
// @access  Private
export const deleteBill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM bills WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found or unauthorized' });
    }

    res.json({ message: 'Bill removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
