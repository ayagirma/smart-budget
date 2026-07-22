import { query } from '../db/index.js';

// @desc    Get all subscriptions for user
// @route   GET /api/subscriptions
// @access  Private
export const getSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY next_billing_date ASC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching subscriptions:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Add a new subscription
// @route   POST /api/subscriptions
// @access  Private
export const addSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, amount, billing_cycle, category, next_billing_date } = req.body;

    if (!name || amount === undefined) {
      return res.status(400).json({ error: 'Name and amount are required' });
    }

    const result = await query(
      `INSERT INTO subscriptions (user_id, name, amount, billing_cycle, category, next_billing_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, name, parseFloat(amount), billing_cycle || 'monthly', category || 'entertainment', next_billing_date || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding subscription:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Toggle cancellation flag on subscription
// @route   PUT /api/subscriptions/:id/flag
// @access  Private
export const toggleFlagSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { is_flagged_for_cancellation } = req.body;

    const result = await query(
      `UPDATE subscriptions SET is_flagged_for_cancellation = $1
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [is_flagged_for_cancellation, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating subscription flag:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a subscription
// @route   DELETE /api/subscriptions/:id
// @access  Private
export const deleteSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM subscriptions WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found or unauthorized' });
    }

    res.json({ message: 'Subscription deleted successfully' });
  } catch (err) {
    console.error('Error deleting subscription:', err.message);
    res.status(500).send('Server Error');
  }
};
