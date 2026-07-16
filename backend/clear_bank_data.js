import { query } from './src/db/index.js';

const clearAll = async () => {
  try {
    console.log("Clearing all bank and transaction data...");
    
    // Clear transactions table
    await query('TRUNCATE TABLE transactions CASCADE;');
    console.log("Transactions table cleared successfully.");

    // Clear plaid_items table
    await query('TRUNCATE TABLE plaid_items CASCADE;');
    console.log("Plaid items table cleared successfully.");

    console.log("All bank and transaction data cleared successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error clearing bank data:", err);
    process.exit(1);
  }
};

clearAll();
