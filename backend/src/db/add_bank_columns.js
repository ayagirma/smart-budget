import { query } from './index.js';

const migrate = async () => {
  try {
    await query(`
      ALTER TABLE transactions
      ADD COLUMN IF NOT EXISTS institution_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS account_name VARCHAR(255);
    `);
    console.log("Altered transactions table successfully with bank columns.");

    // Update existing transactions to default to Wells Fargo Checking
    await query(`
      UPDATE transactions
      SET institution_name = 'Wells Fargo', account_name = 'Checking'
      WHERE institution_name IS NULL;
    `);
    console.log("Updated existing transactions with default bank details.");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
};

migrate();
