import { query } from './index.js';

const createCategoryRulesTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS category_rules (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
      keyword VARCHAR(255) NOT NULL,
      match_type VARCHAR(50) DEFAULT 'contains',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, keyword)
    );
  `;

  try {
    await query(createTableQuery);
    console.log("Successfully created category_rules table.");
    process.exit(0);
  } catch (err) {
    console.error("Error creating category_rules table:", err);
    process.exit(1);
  }
};

createCategoryRulesTable();
