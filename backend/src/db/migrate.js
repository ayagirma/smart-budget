import { query } from './index.js';
import { initExtraTables } from './init_extra_tables.js';
import { initStripeSchema } from './init_stripe_schema.js';

export const runFullMigration = async () => {
  console.log('🚀 Starting full database migration...');
  try {
    // 1. Create Core Tables (users, categories, transactions, budgets)
    await query(`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          onboarding_completed BOOLEAN DEFAULT FALSE,
          monthly_income DECIMAL(12, 2) DEFAULT 0,
          budget_rule VARCHAR(50) DEFAULT '50-30-20',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
          classification VARCHAR(20) DEFAULT 'want',
          icon VARCHAR(100),
          color VARCHAR(20),
          is_default BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
          amount DECIMAL(12, 2) NOT NULL,
          type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
          description TEXT,
          date DATE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS budgets (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
          amount DECIMAL(12, 2) NOT NULL,
          month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
          year INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, category_id, month, year)
      );
    `);
    console.log('✅ Core tables (users, categories, transactions, budgets) verified.');

    // 2. Extra Tables (debts, subscriptions)
    await initExtraTables();

    // 3. Add Bank Columns
    await query(`
      ALTER TABLE transactions
      ADD COLUMN IF NOT EXISTS institution_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS account_name VARCHAR(255);
    `);

    // 4. Plaid Items Table
    await query(`
      CREATE TABLE IF NOT EXISTS plaid_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        access_token VARCHAR(255) NOT NULL,
        item_id VARCHAR(255) NOT NULL,
        institution_name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, item_id)
      );
    `);

    // 5. Category Rules Table
    await query(`
      CREATE TABLE IF NOT EXISTS category_rules (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        keyword VARCHAR(255) NOT NULL,
        match_type VARCHAR(50) DEFAULT 'contains',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, keyword)
      );
    `);

    // 6. Deduplication Columns
    await query(`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS plaid_transaction_id VARCHAR(255) UNIQUE,
      ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(64) UNIQUE;
    `);

    // 7. Stripe & Admin Schema
    await initStripeSchema();

    console.log('🎉 Full database migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  }
};

runFullMigration().then(() => process.exit(0));
