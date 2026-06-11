import { query } from '../db/index.js';

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color 
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 
       ORDER BY t.date DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Add a new transaction (income or expense)
// @route   POST /api/transactions
// @access  Private
export const addTransaction = async (req, res) => {
  try {
    const { amount, type, description, date, category_id } = req.body;
    const userId = req.user.id;

    if (!amount || !type || !date) {
      return res.status(400).json({ error: 'Amount, type, and date are required' });
    }

    const newTransaction = await query(
      'INSERT INTO transactions (user_id, category_id, amount, type, description, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, category_id || null, amount, type, description, date]
    );

    res.status(201).json(newTransaction.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get Dashboard Summary (Total Income, Expenses, Balance)
// @route   GET /api/transactions/summary
// @access  Private
export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    let queryStr = 'SELECT type, SUM(amount) as total FROM transactions WHERE user_id = $1';
    let params = [userId];

    if (month && year) {
      queryStr += ' AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3';
      params.push(month, year);
    }

    queryStr += ' GROUP BY type';

    const result = await query(queryStr, params);

    let totalIncome = 0;
    let totalExpense = 0;

    result.rows.forEach(row => {
      if (row.type === 'income') totalIncome = parseFloat(row.total);
      if (row.type === 'expense') totalExpense = parseFloat(row.total);
    });

    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, description, date, category_id } = req.body;
    const userId = req.user.id;

    if (!amount || !type || !date) {
      return res.status(400).json({ error: 'Amount, type, and date are required' });
    }

    const updatedTransaction = await query(
      'UPDATE transactions SET amount = $1, type = $2, description = $3, date = $4, category_id = $5 WHERE id = $6 AND user_id = $7 RETURNING *',
      [amount, type, description, date, category_id || null, id, userId]
    );

    if (updatedTransaction.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found or not authorized' });
    }

    res.json(updatedTransaction.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deletedTransaction = await query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (deletedTransaction.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found or not authorized' });
    }

    res.json({ message: 'Transaction removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Upload CSV transactions
// @route   POST /api/transactions/upload_csv
// @access  Private
export const uploadCsvTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'Valid transactions array is required' });
    }

    let inserted = 0;
    for (const t of transactions) {
      if (!t.amount || !t.date || !t.description) continue;
      
      // Attempt to parse amount
      let parsedAmount = parseFloat(t.amount.toString().replace(/[^0-9.-]+/g,""));
      if (isNaN(parsedAmount)) continue;

      const type = parsedAmount < 0 ? 'expense' : 'income';
      const absAmount = Math.abs(parsedAmount);

      // Parse date safely
      let parsedDate = new Date(t.date);
      if (isNaN(parsedDate)) continue;

      await query(
        'INSERT INTO transactions (user_id, amount, type, description, date) VALUES ($1, $2, $3, $4, $5)',
        [userId, absAmount, type, t.description, parsedDate.toISOString().split('T')[0]]
      );
      inserted++;
    }

    res.status(201).json({ message: \`Successfully uploaded \${inserted} transactions\` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
