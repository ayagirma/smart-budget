import { query } from './index.js';

export const initExtraTables = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS debts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        balance DECIMAL(12, 2) NOT NULL,
        interest_rate DECIMAL(5, 2) NOT NULL,
        minimum_payment DECIMAL(12, 2) NOT NULL,
        type VARCHAR(50) DEFAULT 'credit_card',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        billing_cycle VARCHAR(20) DEFAULT 'monthly',
        category VARCHAR(50) DEFAULT 'entertainment',
        next_billing_date DATE,
        is_flagged_for_cancellation BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Extra tables (debts, subscriptions) checked/created successfully.");
  } catch (e) {
    console.error("Error initializing extra tables:", e.message);
  }
};
