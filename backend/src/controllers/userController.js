import { query } from '../db/index.js';

export const completeOnboarding = async (req, res) => {
  try {
    const { monthlyIncome, budgetRule } = req.body;
    const userId = req.user.id;

    if (monthlyIncome === undefined || !budgetRule) {
      return res.status(400).json({ error: 'Monthly income and budget rule are required' });
    }

    if (isNaN(monthlyIncome) || Number(monthlyIncome) < 1) {
      return res.status(400).json({ error: 'Monthly income must be at least 1' });
    }

    const result = await query(
      'UPDATE users SET onboarding_completed = true, monthly_income = $1, budget_rule = $2 WHERE id = $3 RETURNING id, onboarding_completed, monthly_income, budget_rule',
      [monthlyIncome, budgetRule, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Onboarding completed',
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
