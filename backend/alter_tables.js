import { query } from './src/db/index.js';

const alterTables = async () => {
  try {
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(12, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS budget_rule VARCHAR(50) DEFAULT '50-30-20';
    `);
    console.log('Users table altered successfully.');

    await query(`
      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS classification VARCHAR(20) DEFAULT 'want';
    `);
    
    // Update existing categories to have correct classifications
    await query(`UPDATE categories SET classification = 'need' WHERE name IN ('Grocery', 'Bills');`);
    await query(`UPDATE categories SET classification = 'want' WHERE name IN ('Restaurant', 'Gift', 'Giving Away', 'Personal Growth');`);
    await query(`UPDATE categories SET classification = 'income' WHERE type = 'income';`);

    console.log('Categories table altered successfully.');
  } catch (err) {
    console.error('Error altering tables:', err);
  }
  process.exit(0);
};

alterTables();
