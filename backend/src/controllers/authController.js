import { query } from '../db/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Register User
export const registerUser = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    // Check if user exists
    const userExists = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await query(
      'INSERT INTO users (first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, first_name, last_name, email, onboarding_completed, monthly_income, budget_rule',
      [firstName, lastName, email, passwordHash]
    );

    const user = newUser.rows[0];

    // Insert default categories for the user
    const defaultCategories = [
      { name: 'Grocery', type: 'expense', icon: 'shopping-cart', color: '#10b981', classification: 'need' },
      { name: 'Bills', type: 'expense', icon: 'file-text', color: '#ef4444', classification: 'need' },
      { name: 'Restaurant', type: 'expense', icon: 'coffee', color: '#f59e0b', classification: 'want' },
      { name: 'Giving Away', type: 'expense', icon: 'heart', color: '#ec4899', classification: 'want' },
      { name: 'Gift', type: 'expense', icon: 'gift', color: '#8b5cf6', classification: 'want' },
      { name: 'Personal Growth', type: 'expense', icon: 'book', color: '#3b82f6', classification: 'want' },
      { name: 'Salary', type: 'income', icon: 'dollar-sign', color: '#10b981', classification: 'income' },
      { name: 'Side Hustle', type: 'income', icon: 'briefcase', color: '#6366f1', classification: 'income' }
    ];

    for (const cat of defaultCategories) {
      await query(
        'INSERT INTO categories (user_id, name, type, icon, color, is_default, classification) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [user.id, cat.name, cat.type, cat.icon, cat.color, true, cat.classification]
      );
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '30d',
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        onboardingCompleted: user.onboarding_completed,
        monthlyIncome: user.monthly_income,
        budgetRule: user.budget_rule,
        token,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Login User
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user
    const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '30d',
    });

    res.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        onboardingCompleted: user.onboarding_completed,
        monthlyIncome: user.monthly_income,
        budgetRule: user.budget_rule,
        token,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
