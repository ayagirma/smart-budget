import { query } from './index.js';

const alterTransactionsTable = async () => {
  try {
    await query(`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS plaid_transaction_id VARCHAR(255) UNIQUE,
      ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(64) UNIQUE;
    `);
    console.log('Transactions table altered successfully for deduplication.');
    process.exit(0);
  } catch (err) {
    console.error('Error altering transactions table:', err);
    process.exit(1);
  }
};

alterTransactionsTable();
