import { query } from './index.js';

const createPlaidItemsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS plaid_items (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      access_token VARCHAR(255) NOT NULL,
      item_id VARCHAR(255) NOT NULL,
      institution_name VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, item_id)
    );
  `;

  try {
    await query(createTableQuery);
    console.log("Successfully created plaid_items table.");
    process.exit(0);
  } catch (err) {
    console.error("Error creating plaid_items table:", err);
    process.exit(1);
  }
};

createPlaidItemsTable();
