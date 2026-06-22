import { query } from '../db/index.js';
import { autoCategorize } from '../utils/categorization.js';

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

    if (amount === undefined || !type || !date) {
      return res.status(400).json({ error: 'Amount, type, and date are required' });
    }

    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number greater than 0' });
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

    if (amount === undefined || !type || !date) {
      return res.status(400).json({ error: 'Amount, type, and date are required' });
    }

    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number greater than 0' });
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
      if (isNaN(parsedAmount) || parsedAmount === 0) continue;

      // Parse date safely
      let parsedDate = new Date(t.date);
      if (isNaN(parsedDate)) continue;

      const type = parsedAmount < 0 ? 'expense' : 'income';
      const absAmount = Math.abs(parsedAmount);
      const dateStr = parsedDate.toISOString().split('T')[0];

      // Check if identical transaction already exists for this user
      const existing = await query(
        'SELECT id FROM transactions WHERE user_id = $1 AND date = $2 AND amount = $3 AND type = $4 AND description = $5',
        [userId, dateStr, absAmount, type, t.description]
      );

      if (existing.rows.length > 0) {
        continue;
      }

      const categoryId = await autoCategorize(userId, t.description);

      await query(
        'INSERT INTO transactions (user_id, category_id, amount, type, description, date) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, categoryId, absAmount, type, t.description, dateStr]
      );
      inserted++;
    }

    res.status(201).json({ message: `Successfully uploaded ${inserted} transactions` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get spending forecast and anomalies comparison
// @route   GET /api/transactions/forecast
// @access  Private
export const getSpendingForecast = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const currentDay = new Date().getDate();
    
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    const { rows: categories } = await query(
      "SELECT id, name, color, classification FROM categories WHERE user_id = $1 AND type = 'expense'",
      [userId]
    );

    const { rows: budgets } = await query(
      'SELECT category_id, amount FROM budgets WHERE user_id = $1 AND month = $2 AND year = $3',
      [userId, currentMonth, currentYear]
    );

    const { rows: monthlyHistory } = await query(
      `SELECT 
         category_id,
         EXTRACT(MONTH FROM date)::integer as month,
         EXTRACT(YEAR FROM date)::integer as year,
         SUM(amount)::numeric as total
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'
       GROUP BY category_id, EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date)`,
      [userId]
    );

    const forecastResults = [];

    for (const cat of categories) {
      const history = monthlyHistory.filter(h => h.category_id === cat.id);
      
      const currentMonthRecord = history.find(h => h.month === currentMonth && h.year === currentYear);
      const currentSpent = currentMonthRecord ? parseFloat(currentMonthRecord.total) : 0;
      
      const historicalRecords = history.filter(h => !(h.month === currentMonth && h.year === currentYear));
      
      historicalRecords.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

      let averageMonthlySpent = 0;
      let forecastedNextMonth = 0;
      let trendDescription = 'Stable';
      let trendFactor = 1.0;

      if (historicalRecords.length > 0) {
        const recentRecords = historicalRecords.slice(0, 3);
        const sum = recentRecords.reduce((acc, r) => acc + parseFloat(r.total), 0);
        averageMonthlySpent = sum / recentRecords.length;

        if (recentRecords.length >= 2) {
          const t1 = parseFloat(recentRecords[0].total);
          const t2 = parseFloat(recentRecords[1].total);
          if (t2 > 0) {
            trendFactor = t1 / t2;
            trendFactor = Math.min(Math.max(trendFactor, 0.6), 1.6);
            
            if (trendFactor > 1.1) trendDescription = 'Increasing';
            else if (trendFactor < 0.9) trendDescription = 'Decreasing';
          }
        }
        
        forecastedNextMonth = averageMonthlySpent * trendFactor;
      } else {
        if (currentSpent > 0) {
          forecastedNextMonth = (currentSpent / currentDay) * daysInMonth;
          averageMonthlySpent = currentSpent;
          trendDescription = 'Extrapolated';
        } else {
          forecastedNextMonth = 0;
          averageMonthlySpent = 0;
          trendDescription = 'No data';
        }
      }

      const budgetObj = budgets.find(b => b.category_id === cat.id);
      const budgetLimit = budgetObj ? parseFloat(budgetObj.amount) : 0;

      const isOverBudget = budgetLimit > 0 && currentSpent > budgetLimit;
      const isForecastOverBudget = budgetLimit > 0 && forecastedNextMonth > budgetLimit;

      forecastResults.push({
        categoryId: cat.id,
        categoryName: cat.name,
        categoryColor: cat.color,
        classification: cat.classification,
        currentSpent,
        averageMonthlySpent,
        forecastedNextMonth,
        budgetLimit,
        trendDescription,
        trendFactor,
        isOverBudget,
        isForecastOverBudget
      });
    }

    res.json(forecastResults);
  } catch (err) {
    console.error('Error calculating forecast:', err.message);
    res.status(500).send('Server Error');
  }
};
